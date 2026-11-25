import type { ConsentLogRow, ProfileRow, ProfileSkillEntry } from "@/modules/profiles/repo";
import type { OrgRole } from "@/lib/supabase/database.types";

export interface ExportAccountInput {
  userId: string;
  email: string | null;
  authProvider: string | null;
  emailConfirmedAt: string | null;
  accountCreatedAt: string | null;
}

export interface ExportOrgMembershipInput {
  organisationId: string;
  organisationName: string;
  role: OrgRole;
}

export interface PersonalDataExportPayload {
  export_metadata: {
    schema_version: string;
    exported_at_utc: string;
    product: string;
    notice: string;
  };
  account: {
    user_id: string;
    email: string | null;
    auth_provider: string | null;
    email_confirmed_at: string | null;
    created_at: string | null;
  };
  profile: {
    full_name: string;
    headline: string;
    bio: string;
    handle: string | null;
    country_code: string | null;
    city: string | null;
    timezone: string;
    interests: string[];
    career_goals: string[];
    career_goal_summary: string;
    availability_status: string;
    visibility_scope: string;
    ai_context_consent: boolean;
    profile_completion_score: number;
    onboarding_step: number;
    onboarding_completed_at: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  skills: Array<{
    skill_id: string;
    slug: string;
    name: string;
    category: string;
    proficiency_level: string;
    evidence_status: string;
    added_at: string;
  }>;
  organisation_memberships: Array<{
    organisation_id: string;
    organisation_name: string;
    role: OrgRole;
  }>;
  consent_history: Array<{
    id: string;
    consent_type: string;
    policy_version: string;
    granted: boolean;
    recorded_at: string;
  }>;
  unavailable_categories: Array<{
    category: string;
    reason: string;
  }>;
}

/**
 * Pure personal data export assembler.
 * Strictly includes only authorised, user-scoped personal records and explicitly
 * excludes secrets, tokens, internal security metadata, and other users' data.
 */
export function buildPersonalDataExportPayload(input: {
  account: ExportAccountInput;
  profile: ProfileRow | null;
  skills: ProfileSkillEntry[];
  organisations: ExportOrgMembershipInput[];
  consentLogs: ConsentLogRow[];
  exportedAt?: string;
}): PersonalDataExportPayload {
  return {
    export_metadata: {
      schema_version: "1.0.0-m1",
      exported_at_utc: input.exportedAt ?? new Date().toISOString(),
      product: "DG NEXUS (by DGConcept)",
      notice:
        "Self-service personal data export supporting GDPR and Nigeria Data Protection Act (NDPA) data portability readiness. Excludes authentication credentials, session tokens, and internal security logs.",
    },
    account: {
      user_id: input.account.userId,
      email: input.account.email,
      auth_provider: input.account.authProvider,
      email_confirmed_at: input.account.emailConfirmedAt,
      created_at: input.account.accountCreatedAt,
    },
    profile: input.profile
      ? {
          full_name: input.profile.full_name,
          headline: input.profile.headline,
          bio: input.profile.bio,
          handle: input.profile.handle,
          country_code: input.profile.country_code,
          city: input.profile.city,
          timezone: input.profile.timezone,
          interests: input.profile.interests,
          career_goals: input.profile.career_goals,
          career_goal_summary: input.profile.career_goal,
          availability_status: input.profile.availability_status,
          visibility_scope: input.profile.visibility_scope,
          ai_context_consent: input.profile.ai_context_consent,
          profile_completion_score: input.profile.profile_completion_score,
          onboarding_step: input.profile.onboarding_step,
          onboarding_completed_at: input.profile.onboarding_completed_at,
          created_at: input.profile.created_at,
          updated_at: input.profile.updated_at,
        }
      : null,
    skills: input.skills.map((s) => ({
      skill_id: s.skillId,
      slug: s.slug,
      name: s.name,
      category: s.category,
      proficiency_level: s.proficiencyLevel,
      evidence_status: s.evidenceStatus,
      added_at: s.createdAt,
    })),
    organisation_memberships: input.organisations.map((o) => ({
      organisation_id: o.organisationId,
      organisation_name: o.organisationName,
      role: o.role,
    })),
    consent_history: input.consentLogs.map((c) => ({
      id: c.id,
      consent_type: c.consent_type,
      policy_version: c.policy_version,
      granted: c.granted,
      recorded_at: c.created_at,
    })),
    unavailable_categories: [
      {
        category: "portfolio_items_and_growth_records",
        reason: "Not yet implemented in Milestone M1 (scheduled for Milestone M2).",
      },
      {
        category: "opportunity_bookmarks_and_applications",
        reason: "Not yet implemented in Milestone M1 (scheduled for Milestone M3).",
      },
      {
        category: "nexus_ai_usage_history",
        reason: "Not yet implemented in Milestone M1 (scheduled for Milestone M4).",
      },
      {
        category: "connections_and_direct_messages",
        reason: "Not yet implemented in Milestone M1 (scheduled for Milestone M5).",
      },
    ],
  };
}
