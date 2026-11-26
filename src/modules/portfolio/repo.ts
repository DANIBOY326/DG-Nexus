import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  evaluateProfileCompleteness,
  type ProfileCompletenessReport,
} from "@/modules/portfolio/completeness";
import { parseContactLinks, type ContactLink } from "@/modules/portfolio/schemas";
import type { ProfileRow, ProfileSkillEntry } from "@/modules/profiles/repo";

export type ProjectCategoryRow = Database["public"]["Tables"]["project_categories"]["Row"];
export type ExperienceRow = Database["public"]["Tables"]["profile_experiences"]["Row"];
export type EducationRow = Database["public"]["Tables"]["profile_educations"]["Row"];
export type CredentialRow = Database["public"]["Tables"]["profile_credentials"]["Row"];
export type PortfolioProjectRow = Database["public"]["Tables"]["portfolio_projects"]["Row"];
export type EvidenceFileRow = Database["public"]["Tables"]["evidence_files"]["Row"];

export interface LinkedSkillSummary {
  skillId: string;
  slug: string;
  name: string;
  category: string;
}

export interface ExperienceWithSkills extends ExperienceRow {
  skills: LinkedSkillSummary[];
}

export interface CredentialWithDetails extends CredentialRow {
  skills: LinkedSkillSummary[];
  evidenceFiles: EvidenceFileRow[];
}

export interface EducationWithDetails extends EducationRow {
  evidenceFiles: EvidenceFileRow[];
}

export interface PortfolioProjectWithDetails extends PortfolioProjectRow {
  categoryName: string;
  skills: LinkedSkillSummary[];
  evidenceFiles: EvidenceFileRow[];
}

export interface SupportingProjectRef {
  id: string;
  slug: string;
  title: string;
  visibilityScope: PortfolioProjectRow["visibility_scope"];
}

export interface EnrichedProfileSkill extends ProfileSkillEntry {
  supportingProjects: SupportingProjectRef[];
}

export interface MemberPortfolioBundle {
  profile: ProfileRow;
  contactLinks: ContactLink[];
  avatarEvidenceFile: EvidenceFileRow | null;
  skills: EnrichedProfileSkill[];
  experiences: ExperienceWithSkills[];
  educations: EducationWithDetails[];
  credentials: CredentialWithDetails[];
  projects: PortfolioProjectWithDetails[];
  completeness: ProfileCompletenessReport;
}

export interface PublicProfileBundle {
  profile: {
    user_id: string;
    handle: string;
    full_name: string;
    headline: string;
    bio: string;
    current_focus: string;
    work_arrangement: ProfileRow["work_arrangement"];
    achievements: string[];
    country_code: string | null;
    city: string | null;
    timezone: string;
    interests: string[];
    availability_status: ProfileRow["availability_status"];
    avatar_url: string | null;
    allow_search_indexing: boolean;
    updated_at: string;
  };
  contactLinks: ContactLink[];
  avatarSignedUrl: string | null;
  skills: EnrichedProfileSkill[];
  experiences: ExperienceWithSkills[];
  educations: EducationWithDetails[];
  credentials: CredentialWithDetails[];
  projects: PortfolioProjectWithDetails[];
  signedEvidenceUrls: Record<string, string>;
}

export async function listProjectCategories(): Promise<ProjectCategoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch project categories: ${error.message}`);
  }
  return data ?? [];
}

function mapSkillJoinRows(
  rows: Array<{
    skill_id: string;
    skills:
      | { slug: string; name: string; category: string }
      | Array<{ slug: string; name: string; category: string }>
      | null;
  }>
): LinkedSkillSummary[] {
  return rows
    .map((row) => {
      const joined = Array.isArray(row.skills) ? row.skills[0] : row.skills;
      if (!joined) return null;
      return {
        skillId: row.skill_id,
        slug: joined.slug,
        name: joined.name,
        category: joined.category,
      };
    })
    .filter((entry): entry is LinkedSkillSummary => Boolean(entry));
}

async function fetchPortfolioCollectionsForUser(userId: string) {
  const supabase = await createSupabaseServerClient();

  const [
    skillsRes,
    experiencesRes,
    educationsRes,
    credentialsRes,
    projectsRes,
    categoriesRes,
    evidenceRes,
  ] = await Promise.all([
    supabase
      .from("profile_skills")
      .select(
        "skill_id, proficiency_level, evidence_status, created_at, skills(slug, name, category)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("profile_experiences")
      .select("*, experience_skills(skill_id, skills(slug, name, category))")
      .eq("user_id", userId)
      .order("is_current", { ascending: false })
      .order("start_date", { ascending: false }),
    supabase
      .from("profile_educations")
      .select("*")
      .eq("user_id", userId)
      .order("is_current", { ascending: false })
      .order("start_year", { ascending: false }),
    supabase
      .from("profile_credentials")
      .select("*, credential_skills(skill_id, skills(slug, name, category))")
      .eq("user_id", userId)
      .order("issue_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("portfolio_projects")
      .select("*, portfolio_project_skills(skill_id, skills(slug, name, category))")
      .eq("user_id", userId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("project_categories")
      .select("slug, name")
      .eq("is_active", true),
    supabase
      .from("evidence_files")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (skillsRes.error) throw new Error(`Failed to load skills: ${skillsRes.error.message}`);
  if (experiencesRes.error) {
    throw new Error(`Failed to load experiences: ${experiencesRes.error.message}`);
  }
  if (educationsRes.error) {
    throw new Error(`Failed to load educations: ${educationsRes.error.message}`);
  }
  if (credentialsRes.error) {
    throw new Error(`Failed to load credentials: ${credentialsRes.error.message}`);
  }
  if (projectsRes.error) {
    throw new Error(`Failed to load portfolio projects: ${projectsRes.error.message}`);
  }
  if (evidenceRes.error) {
    throw new Error(`Failed to load evidence files: ${evidenceRes.error.message}`);
  }

  const categoryNameBySlug = new Map(
    (categoriesRes.data ?? []).map((cat) => [cat.slug, cat.name])
  );

  const allEvidence = evidenceRes.data ?? [];
  const evidenceByProject = new Map<string, EvidenceFileRow[]>();
  const evidenceByCredential = new Map<string, EvidenceFileRow[]>();
  const evidenceByEducation = new Map<string, EvidenceFileRow[]>();
  let avatarEvidenceFile: EvidenceFileRow | null = null;

  for (const file of allEvidence) {
    if (file.entity_type === "avatar" && !avatarEvidenceFile) {
      avatarEvidenceFile = file;
    } else if (file.project_id) {
      const list = evidenceByProject.get(file.project_id) ?? [];
      list.push(file);
      evidenceByProject.set(file.project_id, list);
    } else if (file.credential_id) {
      const list = evidenceByCredential.get(file.credential_id) ?? [];
      list.push(file);
      evidenceByCredential.set(file.credential_id, list);
    } else if (file.education_id) {
      const list = evidenceByEducation.get(file.education_id) ?? [];
      list.push(file);
      evidenceByEducation.set(file.education_id, list);
    }
  }

  const projects: PortfolioProjectWithDetails[] = (projectsRes.data ?? []).map((row) => {
    const { portfolio_project_skills, ...projectFields } = row as PortfolioProjectRow & {
      portfolio_project_skills?: Array<{
        skill_id: string;
        skills:
          | { slug: string; name: string; category: string }
          | Array<{ slug: string; name: string; category: string }>
          | null;
      }>;
    };
    return {
      ...projectFields,
      categoryName: categoryNameBySlug.get(projectFields.category_slug) ?? projectFields.category_slug,
      skills: mapSkillJoinRows(portfolio_project_skills ?? []),
      evidenceFiles: evidenceByProject.get(projectFields.id) ?? [],
    };
  });

  // Map each canonical skill to the portfolio projects providing supporting evidence
  const projectsBySkillId = new Map<string, SupportingProjectRef[]>();
  for (const project of projects) {
    for (const skill of project.skills) {
      const refs = projectsBySkillId.get(skill.skillId) ?? [];
      refs.push({
        id: project.id,
        slug: project.slug,
        title: project.title,
        visibilityScope: project.visibility_scope,
      });
      projectsBySkillId.set(skill.skillId, refs);
    }
  }

  const skills: EnrichedProfileSkill[] = (skillsRes.data ?? [])
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
        supportingProjects: projectsBySkillId.get(row.skill_id) ?? [],
      };
    })
    .filter((entry): entry is EnrichedProfileSkill => Boolean(entry));

  const experiences: ExperienceWithSkills[] = (experiencesRes.data ?? []).map((row) => {
    const { experience_skills, ...expFields } = row as ExperienceRow & {
      experience_skills?: Array<{
        skill_id: string;
        skills:
          | { slug: string; name: string; category: string }
          | Array<{ slug: string; name: string; category: string }>
          | null;
      }>;
    };
    return {
      ...expFields,
      skills: mapSkillJoinRows(experience_skills ?? []),
    };
  });

  const educations: EducationWithDetails[] = (educationsRes.data ?? []).map((row) => ({
    ...row,
    evidenceFiles: evidenceByEducation.get(row.id) ?? [],
  }));

  const credentials: CredentialWithDetails[] = (credentialsRes.data ?? []).map((row) => {
    const { credential_skills, ...credFields } = row as CredentialRow & {
      credential_skills?: Array<{
        skill_id: string;
        skills:
          | { slug: string; name: string; category: string }
          | Array<{ slug: string; name: string; category: string }>
          | null;
      }>;
    };
    return {
      ...credFields,
      skills: mapSkillJoinRows(credential_skills ?? []),
      evidenceFiles: evidenceByCredential.get(credFields.id) ?? [],
    };
  });

  return {
    avatarEvidenceFile,
    skills,
    experiences,
    educations,
    credentials,
    projects,
    allEvidence,
  };
}

/**
 * Loads the authenticated member's full Proof-of-Work profile & portfolio bundle.
 */
export async function getMemberPortfolioBundle(
  userId: string
): Promise<MemberPortfolioBundle | null> {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
  if (!profile) {
    return null;
  }

  const collections = await fetchPortfolioCollectionsForUser(userId);
  const completeness = evaluateProfileCompleteness({
    fullName: profile.full_name,
    countryCode: profile.country_code,
    timezone: profile.timezone,
    headline: profile.headline,
    bio: profile.bio,
    skillCount: collections.skills.length,
    experienceCount: collections.experiences.length,
    educationCount: collections.educations.length,
    projectCount: collections.projects.length,
    credentialCount: collections.credentials.length,
  });

  return {
    profile,
    contactLinks: parseContactLinks(profile.contact_links),
    avatarEvidenceFile: collections.avatarEvidenceFile,
    skills: collections.skills,
    experiences: collections.experiences,
    educations: collections.educations,
    credentials: collections.credentials,
    projects: collections.projects,
    completeness,
  };
}

export async function getMemberProjectById(
  userId: string,
  projectId: string
): Promise<PortfolioProjectWithDetails | null> {
  const bundle = await getMemberPortfolioBundle(userId);
  if (!bundle) return null;
  return bundle.projects.find((p) => p.id === projectId) ?? null;
}

/**
 * Recalculates transparent M2 profile completeness and persists it to `profiles`.
 */
export async function recalculateAndPersistProfileCompleteness(
  userId: string
): Promise<ProfileCompletenessReport | null> {
  const bundle = await getMemberPortfolioBundle(userId);
  if (!bundle) return null;

  if (bundle.profile.profile_completion_score !== bundle.completeness.score) {
    const supabase = await createSupabaseServerClient();
    await supabase
      .from("profiles")
      .update({ profile_completion_score: bundle.completeness.score })
      .eq("user_id", userId);
  }

  return bundle.completeness;
}

/**
 * Public-safe profile lookup by handle.
 * Enforces RLS under the caller's role (anon or authenticated), explicitly filters to
 * `visibility_scope = 'public'`, strips internal/private account fields, and generates
 * short-lived signed URLs ONLY for public evidence files permitted by Storage RLS.
 */
export async function getPublicProfileBundleByHandle(
  rawHandle: string
): Promise<PublicProfileBundle | null> {
  const handle = rawHandle.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{2,38}[a-z0-9]$/.test(handle)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "user_id, handle, full_name, headline, bio, current_focus, work_arrangement, achievements, contact_links, country_code, city, timezone, interests, availability_status, avatar_url, visibility_scope, allow_search_indexing, updated_at"
    )
    .ilike("handle", handle)
    .eq("visibility_scope", "public")
    .maybeSingle();

  if (error || !profile || !profile.handle) {
    return null;
  }

  const collections = await fetchPortfolioCollectionsForUser(profile.user_id);

  // Double-enforce public visibility in application layer on top of PostgreSQL RLS
  // (protects against leaking owner's own private items when owner previews their public link).
  const publicExperiences = collections.experiences.filter(
    (e) => e.visibility_scope === "public"
  );
  const publicEducations = collections.educations
    .filter((e) => e.visibility_scope === "public")
    .map((e) => ({
      ...e,
      evidenceFiles: e.evidenceFiles.filter((f) => f.visibility_scope === "public"),
    }));
  const publicCredentials = collections.credentials
    .filter((c) => c.visibility_scope === "public")
    .map((c) => ({
      ...c,
      evidenceFiles: c.evidenceFiles.filter((f) => f.visibility_scope === "public"),
    }));
  const publicProjects = collections.projects
    .filter((p) => p.visibility_scope === "public")
    .map((p) => ({
      ...p,
      evidenceFiles: p.evidenceFiles.filter((f) => f.visibility_scope === "public"),
    }));

  const publicProjectIds = new Set(publicProjects.map((p) => p.id));
  const publicSkills: EnrichedProfileSkill[] = collections.skills.map((skill) => ({
    ...skill,
    supportingProjects: skill.supportingProjects.filter((ref) =>
      publicProjectIds.has(ref.id)
    ),
  }));

  // Generate short-lived signed URLs (5 minutes) ONLY for explicitly public evidence visuals
  const signedEvidenceUrls: Record<string, string> = {};
  const publicImageEvidence = [
    ...publicProjects.flatMap((p) => p.evidenceFiles),
    ...publicCredentials.flatMap((c) => c.evidenceFiles),
    ...publicEducations.flatMap((e) => e.evidenceFiles),
  ].filter((f) => f.visibility_scope === "public");

  await Promise.all(
    publicImageEvidence.slice(0, 24).map(async (file) => {
      const { data } = await supabase.storage
        .from(file.storage_bucket)
        .createSignedUrl(file.storage_path, 300);
      if (data?.signedUrl) {
        signedEvidenceUrls[file.id] = data.signedUrl;
      }
    })
  );

  let avatarSignedUrl: string | null = null;
  if (
    collections.avatarEvidenceFile &&
    collections.avatarEvidenceFile.visibility_scope === "public"
  ) {
    const { data } = await supabase.storage
      .from(collections.avatarEvidenceFile.storage_bucket)
      .createSignedUrl(collections.avatarEvidenceFile.storage_path, 300);
    avatarSignedUrl = data?.signedUrl ?? null;
  }

  return {
    profile: {
      user_id: profile.user_id,
      handle: profile.handle,
      full_name: profile.full_name,
      headline: profile.headline,
      bio: profile.bio,
      current_focus: profile.current_focus,
      work_arrangement: profile.work_arrangement,
      achievements: profile.achievements,
      country_code: profile.country_code,
      city: profile.city,
      timezone: profile.timezone,
      interests: profile.interests,
      availability_status: profile.availability_status,
      avatar_url: profile.avatar_url,
      allow_search_indexing: profile.allow_search_indexing,
      updated_at: profile.updated_at,
    },
    contactLinks: parseContactLinks(profile.contact_links),
    avatarSignedUrl,
    skills: publicSkills,
    experiences: publicExperiences,
    educations: publicEducations,
    credentials: publicCredentials,
    projects: publicProjects,
    signedEvidenceUrls,
  };
}
