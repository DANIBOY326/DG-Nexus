import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { EvidenceEntityType, RecordVisibilityScope } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EVIDENCE_STORAGE_BUCKET } from "@/modules/portfolio/constants";
import {
  buildSafeEvidenceStoragePath,
  validateEvidenceUpload,
} from "@/modules/portfolio/evidence-security";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_ENTITY_TYPES = new Set<EvidenceEntityType>([
  "project",
  "credential",
  "education",
  "avatar",
]);
const VALID_VISIBILITIES = new Set<RecordVisibilityScope>([
  "public",
  "connections",
  "private",
]);

/**
 * Authenticated, magic-byte-validated evidence upload endpoint.
 * Stores files strictly in the private `portfolio-evidence` bucket under `{user_id}/...`
 * with zero user-controlled path segments.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Storage service is unavailable until Supabase Staging is configured." },
      { status: 503, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required to upload evidence files." },
      { status: 401, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart upload payload." },
      { status: 400, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const fileEntry = formData.get("file");
  const entityTypeRaw = String(formData.get("entityType") ?? "").trim() as EvidenceEntityType;
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 240);
  const visibilityRaw = String(formData.get("visibilityScope") ?? "").trim() as RecordVisibilityScope;

  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: "Please attach a file to upload." },
      { status: 400, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  if (!VALID_ENTITY_TYPES.has(entityTypeRaw)) {
    return NextResponse.json(
      { error: "Invalid evidence target type." },
      { status: 400, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  if (entityTypeRaw !== "avatar" && !UUID_REGEX.test(parentIdRaw)) {
    return NextResponse.json(
      { error: "A valid parent record identifier is required." },
      { status: 400, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  // Privacy-protective default: all evidence files default to 'private' unless explicitly specified.
  const visibilityScope: RecordVisibilityScope = VALID_VISIBILITIES.has(visibilityRaw)
    ? visibilityRaw
    : entityTypeRaw === "avatar"
      ? "public"
      : "private";

  // Verify parent ownership BEFORE reading/uploading bytes to Storage
  if (entityTypeRaw === "project") {
    const { data: project } = await supabase
      .from("portfolio_projects")
      .select("id")
      .eq("id", parentIdRaw)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you do not have permission to attach files." },
        { status: 403, headers: { "Cache-Control": "no-store, private" } }
      );
    }
  } else if (entityTypeRaw === "credential") {
    const { data: cred } = await supabase
      .from("profile_credentials")
      .select("id")
      .eq("id", parentIdRaw)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!cred) {
      return NextResponse.json(
        { error: "Credential not found or you do not have permission to attach files." },
        { status: 403, headers: { "Cache-Control": "no-store, private" } }
      );
    }
  } else if (entityTypeRaw === "education") {
    const { data: edu } = await supabase
      .from("profile_educations")
      .select("id")
      .eq("id", parentIdRaw)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!edu) {
      return NextResponse.json(
        { error: "Education record not found or you do not have permission to attach files." },
        { status: 403, headers: { "Cache-Control": "no-store, private" } }
      );
    }
  }

  const arrayBuffer = await fileEntry.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const validation = validateEvidenceUpload({
    entityType: entityTypeRaw,
    claimedMimeType: fileEntry.type,
    fileName: fileEntry.name,
    byteLength: bytes.byteLength,
    headerBytes: bytes.subarray(0, 16),
  });

  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const storagePath = buildSafeEvidenceStoragePath({
    userId: user.id,
    entityType: entityTypeRaw,
    parentId: entityTypeRaw === "avatar" ? null : parentIdRaw,
    extension: validation.extension,
  });

  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_STORAGE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: validation.detectedMime,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const { data: evidenceRow, error: dbError } = await supabase
    .from("evidence_files")
    .insert({
      user_id: user.id,
      entity_type: entityTypeRaw,
      project_id: entityTypeRaw === "project" ? parentIdRaw : null,
      credential_id: entityTypeRaw === "credential" ? parentIdRaw : null,
      education_id: entityTypeRaw === "education" ? parentIdRaw : null,
      storage_bucket: EVIDENCE_STORAGE_BUCKET,
      storage_path: storagePath,
      file_name: validation.sanitisedFileName,
      mime_type: validation.detectedMime,
      file_size_bytes: bytes.byteLength,
      caption,
      visibility_scope: visibilityScope,
    })
    .select("*")
    .single();

  if (dbError || !evidenceRow) {
    // Roll back orphan storage object cleanly
    await supabase.storage.from(EVIDENCE_STORAGE_BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: `Failed to record evidence metadata: ${dbError?.message ?? "Unknown error"}` },
      { status: 500, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  // Side effects by entity type
  if (entityTypeRaw === "credential") {
    // Promote self_reported -> evidence_submitted only (NEVER to verified)
    await supabase
      .from("profile_credentials")
      .update({ verification_status: "evidence_submitted" })
      .eq("id", parentIdRaw)
      .eq("user_id", user.id)
      .eq("verification_status", "self_reported");
  } else if (entityTypeRaw === "avatar") {
    // Clean up older avatar evidence files so storage remains lean
    const { data: oldAvatars } = await supabase
      .from("evidence_files")
      .select("id, storage_path")
      .eq("user_id", user.id)
      .eq("entity_type", "avatar")
      .neq("id", evidenceRow.id);

    if (oldAvatars && oldAvatars.length > 0) {
      await supabase.storage
        .from(EVIDENCE_STORAGE_BUCKET)
        .remove(oldAvatars.map((a) => a.storage_path));
      await supabase
        .from("evidence_files")
        .delete()
        .in("id", oldAvatars.map((a) => a.id));
    }

    await supabase
      .from("profiles")
      .update({ avatar_url: `/api/evidence/${evidenceRow.id}/url` })
      .eq("user_id", user.id);
  }

  return NextResponse.json(
    {
      evidence: {
        id: evidenceRow.id,
        entityType: evidenceRow.entity_type,
        fileName: evidenceRow.file_name,
        mimeType: evidenceRow.mime_type,
        fileSizeBytes: evidenceRow.file_size_bytes,
        caption: evidenceRow.caption,
        visibilityScope: evidenceRow.visibility_scope,
        accessUrl: `/api/evidence/${evidenceRow.id}/url`,
        createdAt: evidenceRow.created_at,
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store, private" } }
  );
}
