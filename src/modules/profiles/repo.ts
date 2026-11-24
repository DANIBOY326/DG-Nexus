import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

/**
 * Typed Profile repository enforcing Supabase RLS via the caller's session JWT (TDR-007).
 */
export async function getOwnProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
  return data;
}

export async function updateOwnProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<ProfileRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
  return data;
}
