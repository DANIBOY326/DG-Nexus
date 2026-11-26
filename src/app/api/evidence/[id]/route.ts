import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deletes an evidence file owned strictly by the authenticated caller from both
 * Supabase Storage and `evidence_files`.
 */
export async function DELETE(
  _request: Request,
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
      { error: "Invalid evidence file identifier." },
      { status: 400, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const { data: file, error: fetchError } = await supabase
    .from("evidence_files")
    .select("id, user_id, entity_type, storage_bucket, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !file) {
    return NextResponse.json(
      { error: "Evidence file not found or access denied." },
      { status: 404, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const { error: storageErr } = await supabase.storage
    .from(file.storage_bucket)
    .remove([file.storage_path]);

  if (storageErr) {
    return NextResponse.json(
      { error: `Failed to delete file from storage: ${storageErr.message}` },
      { status: 500, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const { error: deleteErr } = await supabase
    .from("evidence_files")
    .delete()
    .eq("id", file.id)
    .eq("user_id", user.id);

  if (deleteErr) {
    return NextResponse.json(
      { error: `Failed to delete evidence record: ${deleteErr.message}` },
      { status: 500, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  if (file.entity_type === "avatar") {
    await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", user.id);
  }

  return NextResponse.json(
    { deleted: true, id: file.id },
    { status: 200, headers: { "Cache-Control": "no-store, private" } }
  );
}
