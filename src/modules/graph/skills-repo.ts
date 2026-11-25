import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, SkillProficiency } from "@/lib/supabase/database.types";

export type CanonicalSkillRow = Database["public"]["Tables"]["skills"]["Row"];

export interface SkillSelectionInput {
  skillId: string;
  proficiencyLevel: SkillProficiency;
}

/**
 * Pure deduplication helper ensuring a single profile never submits duplicate skill_ids.
 */
export function deduplicateSkillSelections(
  selections: SkillSelectionInput[]
): SkillSelectionInput[] {
  const seen = new Set<string>();
  const unique: SkillSelectionInput[] = [];
  for (const item of selections) {
    if (!seen.has(item.skillId)) {
      seen.add(item.skillId);
      unique.push(item);
    }
  }
  return unique;
}

/**
 * Lists verified canonical skills from the `skills` catalogue.
 */
export async function listCanonicalSkills(search?: string): Promise<CanonicalSkillRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("skills")
    .select("*")
    .eq("is_verified", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const trimmed = search?.trim().toLowerCase();
  if (trimmed) {
    query = query.ilike("normalised_name", `%${trimmed}%`);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    throw new Error(`Failed to fetch canonical skills: ${error.message}`);
  }
  return data ?? [];
}

/**
 * Synchronises the authenticated user's `profile_skills` rows cleanly under RLS.
 * Deletes unselected skills and upserts selected ones without creating duplicates.
 */
export async function replaceUserProfileSkills(
  userId: string,
  selections: SkillSelectionInput[]
): Promise<void> {
  const deduped = deduplicateSkillSelections(selections);
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("profile_skills")
    .select("skill_id")
    .eq("user_id", userId);

  if (fetchError) {
    throw new Error(`Failed to read existing profile skills: ${fetchError.message}`);
  }

  const targetIds = new Set(deduped.map((s) => s.skillId));
  const toDelete = (existing ?? [])
    .map((row) => row.skill_id)
    .filter((id) => !targetIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("profile_skills")
      .delete()
      .eq("user_id", userId)
      .in("skill_id", toDelete);

    if (deleteError) {
      throw new Error(`Failed to remove deselected skills: ${deleteError.message}`);
    }
  }

  if (deduped.length > 0) {
    const rows = deduped.map((item) => ({
      user_id: userId,
      skill_id: item.skillId,
      proficiency_level: item.proficiencyLevel,
      evidence_status: "self_reported" as const,
    }));

    const { error: upsertError } = await supabase
      .from("profile_skills")
      .upsert(rows, { onConflict: "user_id,skill_id" });

    if (upsertError) {
      throw new Error(`Failed to save profile skills: ${upsertError.message}`);
    }
  }
}
