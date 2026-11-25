import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ConsentType,
  Database,
  SkillEvidenceStatus,
  SkillProficiency,
} from "@/lib/supabase/database.types";
import { PRIVACY_POLICY_VERSION } from "@/modules/profiles/constants";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type ConsentLogRow = Database["public"]["Tables"]["consent_logs"]["Row"];

export interface ProfileSkillEntry {
  skillId: string;
  slug: string;
  name: string;
  category: string;
  proficiencyLevel: SkillProficiency;
  evidenceStatus: SkillEvidenceStatus;
  createdAt: string;
}

export interface ProfileWithSkills {
  profile: ProfileRow;
  skills: ProfileSkillEntry[];
}

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

export async function getOwnProfileWithSkills(
  userId: string
): Promise<ProfileWithSkills | null> {
  const supabase = await createSupabaseServerClient();

  const [profileRes, skillsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("profile_skills")
      .select(
        "skill_id, proficiency_level, evidence_status, created_at, skills(slug, name, category)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);

  if (profileRes.error) {
    throw new Error(`Failed to load profile: ${profileRes.error.message}`);
  }
  if (!profileRes.data) {
    return null;
  }
  if (skillsRes.error) {
    throw new Error(`Failed to load profile skills: ${skillsRes.error.message}`);
  }

  const skills: ProfileSkillEntry[] = (skillsRes.data ?? [])
    .map((row) => {
      const joined = Array.isArray(row.skills) ? row.skills[0] : row.skills;
      if (!joined) return null;
      return {
        skillId: row.skill_id,
        slug: joined.slug,
        name: joined.name,
        category: joined.category,
        proficiencyLevel: row.proficiency_level,
        evidenceStatus: row.evidence_status,
        createdAt: row.created_at,
      };
    })
    .filter((entry): entry is ProfileSkillEntry => Boolean(entry));

  return {
    profile: profileRes.data,
    skills,
  };
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

/**
 * Appends an immutable consent event to `consent_logs`.
 * Ordinary users cannot UPDATE or DELETE historical consent records (enforced by RLS + trigger).
 */
export async function recordConsentEvent(input: {
  userId: string;
  consentType: ConsentType;
  policyVersion: string;
  granted: boolean;
}): Promise<ConsentLogRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("consent_logs")
    .insert({
      user_id: input.userId,
      consent_type: input.consentType,
      policy_version: input.policyVersion,
      granted: input.granted,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to record consent event: ${error.message}`);
  }
  return data;
}

export async function listOwnConsentLogs(userId: string): Promise<ConsentLogRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("consent_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch consent history: ${error.message}`);
  }
  return data ?? [];
}

/**
 * Idempotently records initial `terms_and_privacy` consent on first verified session
 * (covers email-confirmed sign-ups and OAuth callbacks cleanly).
 */
export async function ensureInitialTermsConsent(userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("consent_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("consent_type", "terms_and_privacy")
    .limit(1);

  if (!data || data.length === 0) {
    await supabase.from("consent_logs").insert({
      user_id: userId,
      consent_type: "terms_and_privacy",
      policy_version: PRIVACY_POLICY_VERSION,
      granted: true,
    });
  }
}
