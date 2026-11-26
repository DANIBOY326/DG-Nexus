import type { ConsentLogRow, ProfileRow, ProfileSkillEntry } from "@/modules/profiles/repo";
import type { OrgRole } from "@/lib/supabase/database.types";
import type {
  CredentialWithDetails,
  EducationWithDetails,
  EvidenceFileRow,
  ExperienceWithSkills,
  PortfolioProjectWithDetails,
} from "@/modules/portfolio/repo";
import { parseContactLinks, type ContactLink } from "@/modules/portfolio/schemas";

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
    current_focus: string;
    work_arrangement: string;
    achievements: string[];
    contact_links: ContactLink[];
    allow_search_indexing: boolean;
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
  experiences: Array<{
    id: string;
    organisation_name: string;
    role_title: string;
    employment_type: string;
    location: string;
    work_arrangement: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string;
    responsibilities: string[];
    achievements: string[];
    visibility_scope: string;
    linked_skills: string[];
    created_at: string;
    updated_at: string;
  }>;
  educations: Array<{
    id: string;
    institution: string;
    qualification: string;
    pathway_type: string;
    field_of_study: string;
    start_year: number;
    end_year: number | null;
    is_current: boolean;
    description: string;
    achievements: string[];
    visibility_scope: string;
    created_at: string;
    updated_at: string;
  }>;
  credentials: Array<{
    id: string;
    name: string;
    issuing_organisation: string;
    issue_date: string | null;
    expiry_date: string | null;
    credential_id_code: string;
    verification_url: string | null;
    verification_status: string;
    visibility_scope: string;
    linked_skills: string[];
    created_at: string;
    updated_at: string;
  }>;
  portfolio_projects: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    description: string;
    category_slug: string;
    project_type: string;
    project_status: string;
    start_date: string | null;
    completion_date: string | null;
    associated_organisation: string;
    is_collaborative: boolean;
    member_role: string;
    member_contribution: string;
    team_members: string[];
    outcomes: string[];
    achievements: string[];
    tools_used: string[];
    project_url: string | null;
    repository_url: string | null;
    visibility_scope: string;
    linked_skills: string[];
    created_at: string;
    updated_at: string;
  }>;
  evidence_files: Array<{
    id: string;
    entity_type: string;
    project_id: string | null;
    credential_id: string | null;
    education_id: string | null;
    file_name: string;
    mime_type: string;
    file_size_bytes: number;
    caption: string;
    visibility_scope: string;
    uploaded_at: string;
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
 * Pure personal data export assembler (M2 schema v2.0.0-m2).
 * Strictly includes only authorised, user-scoped personal records and explicitly
 * excludes secrets, tokens, raw storage paths, internal security metadata, and other users' data.
 */
export function buildPersonalDataExportPayload(input: {
  account: ExportAccountInput;
  profile: ProfileRow | null;
  skills: ProfileSkillEntry[];
  experiences?: ExperienceWithSkills[];
  educations?: EducationWithDetails[];
  credentials?: CredentialWithDetails[];
  portfolioProjects?: PortfolioProjectWithDetails[];
  evidenceFiles?: EvidenceFileRow[];
  organisations: ExportOrgMembershipInput[];
  consentLogs: ConsentLogRow[];
  exportedAt?: string;
}): PersonalDataExportPayload {
  const experiences = input.experiences ?? [];
  const educations = input.educations ?? [];
  const credentials = input.credentials ?? [];
  const portfolioProjects = input.portfolioProjects ?? [];
  const evidenceFiles = input.evidenceFiles ?? [];

  return {
    export_metadata: {
      schema_version: "2.0.0-m2",
      exported_at_utc: input.exportedAt ?? new Date().toISOString(),
      product: "DG NEXUS (by DGConcept)",
      notice:
        "Self-service personal data export supporting GDPR and Nigeria Data Protection Act (NDPA) data portability readiness. Excludes authentication credentials, session tokens, internal storage paths, and internal security logs.",
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
          current_focus: input.profile.current_focus,
          work_arrangement: input.profile.work_arrangement,
          achievements: input.profile.achievements,
          contact_links: parseContactLinks(input.profile.contact_links),
          allow_search_indexing: input.profile.allow_search_indexing,
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
    experiences: experiences.map((e) => ({
      id: e.id,
      organisation_name: e.organisation_name,
      role_title: e.role_title,
      employment_type: e.employment_type,
      location: e.location,
      work_arrangement: e.work_arrangement,
      start_date: e.start_date,
      end_date: e.end_date,
      is_current: e.is_current,
      description: e.description,
      responsibilities: e.responsibilities,
      achievements: e.achievements,
      visibility_scope: e.visibility_scope,
      linked_skills: e.skills.map((sk) => sk.name),
      created_at: e.created_at,
      updated_at: e.updated_at,
    })),
    educations: educations.map((ed) => ({
      id: ed.id,
      institution: ed.institution,
      qualification: ed.qualification,
      pathway_type: ed.pathway_type,
      field_of_study: ed.field_of_study,
      start_year: ed.start_year,
      end_year: ed.end_year,
      is_current: ed.is_current,
      description: ed.description,
      achievements: ed.achievements,
      visibility_scope: ed.visibility_scope,
      created_at: ed.created_at,
      updated_at: ed.updated_at,
    })),
    credentials: credentials.map((c) => ({
      id: c.id,
      name: c.name,
      issuing_organisation: c.issuing_organisation,
      issue_date: c.issue_date,
      expiry_date: c.expiry_date,
      credential_id_code: c.credential_id_code,
      verification_url: c.verification_url,
      verification_status: c.verification_status,
      visibility_scope: c.visibility_scope,
      linked_skills: c.skills.map((sk) => sk.name),
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    portfolio_projects: portfolioProjects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      description: p.description,
      category_slug: p.category_slug,
      project_type: p.project_type,
      project_status: p.project_status,
      start_date: p.start_date,
      completion_date: p.completion_date,
      associated_organisation: p.associated_organisation,
      is_collaborative: p.is_collaborative,
      member_role: p.member_role,
      member_contribution: p.member_contribution,
      team_members: p.team_members,
      outcomes: p.outcomes,
      achievements: p.achievements,
      tools_used: p.tools_used,
      project_url: p.project_url,
      repository_url: p.repository_url,
      visibility_scope: p.visibility_scope,
      linked_skills: p.skills.map((sk) => sk.name),
      created_at: p.created_at,
      updated_at: p.updated_at,
    })),
    evidence_files: evidenceFiles.map((f) => ({
      id: f.id,
      entity_type: f.entity_type,
      project_id: f.project_id,
      credential_id: f.credential_id,
      education_id: f.education_id,
      file_name: f.file_name,
      mime_type: f.mime_type,
      file_size_bytes: f.file_size_bytes,
      caption: f.caption,
      visibility_scope: f.visibility_scope,
      uploaded_at: f.created_at,
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
        category: "evidence_binary_file_contents",
        reason:
          "Metadata for all uploaded evidence files is included above. Raw binary images and PDFs are not inlined into JSON; members can download each owned file securely via authenticated signed URLs from /profile.",
      },
      {
        category: "opportunity_bookmarks_and_applications",
        reason: "Not yet implemented in Milestone M2 (scheduled for Milestone M3).",
      },
      {
        category: "nexus_ai_usage_history",
        reason: "Not yet implemented in Milestone M2 (scheduled for Milestone M4).",
      },
      {
        category: "connections_and_direct_messages",
        reason: "Not yet implemented in Milestone M2 (scheduled for Milestone M5).",
      },
    ],
  };
}
