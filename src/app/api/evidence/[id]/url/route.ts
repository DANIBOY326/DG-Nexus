import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Issues a short-lived signed URL (5 minutes) for an evidence file ONLY if
 * PostgreSQL RLS permits the caller to view the evidence row and its parent record.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Storage service unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: "Evidence file not found." },
      { status: 404, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const supabase = await createSupabaseServerClient();

  // RLS on evidence_files automatically blocks private/connections/unauthorised files
  const { data: file, error } = await supabase
    .from("evidence_files")
    .select("id, storage_bucket, storage_path, file_name, mime_type")
    .eq("id", id)
    .maybeSingle();

  if (error || !file) {
    return NextResponse.json(
      { error: "Evidence file not found or access denied." },
      { status: 404, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const url = new URL(request.url);
  const forceDownload =
    url.searchParams.get("download") === "1" || file.mime_type === "application/pdf";

  const { data: signed, error: signError } = await supabase.storage
    .from(file.storage_bucket)
    .createSignedUrl(file.storage_path, 300, {
      download: forceDownload ? file.file_name : undefined,
    });

  if (signError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Unable to authorise file access." },
      { status: 403, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  if (url.searchParams.get("mode") === "json") {
    return NextResponse.json(
      {
        url: signed.signedUrl,
        expiresIn: 300,
        fileName: file.file_name,
        mimeType: file.mime_type,
      },
      { status: 200, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  return NextResponse.redirect(signed.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "no-store, private" },
  });
}
