import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getMemberPortfolioBundle } from "@/modules/portfolio/repo";
import {
  evaluateOpportunityFit,
  type MatchCandidateProfile,
  type OpportunityFitBreakdown,
  type OpportunitySkillRequirement,
} from "@/modules/opportunities/matching";

export type OpportunityRow = Database["public"]["Tables"]["opportunities"]["Row"];
export type OpportunityBookmarkRow =
  Database["public"]["Tables"]["opportunity_bookmarks"]["Row"];
export type OpportunityApplicationRow =
  Database["public"]["Tables"]["opportunity_applications"]["Row"];

export interface OpportunityWithSkills extends OpportunityRow {
  requiredSkills: OpportunitySkillRequirement[];
}

export interface MatchedOpportunityItem {
  opportunity: OpportunityWithSkills;
  fit: OpportunityFitBreakdown;
  bookmark: OpportunityBookmarkRow | null;
  application: OpportunityApplicationRow | null;
}

export interface OpportunityWorkspaceBundle {
  timezone: string;
  countryCode: string | null;
  items: MatchedOpportunityItem[];
  savedCount: number;
  applicationCount: number;
}

function mapOpportunityRow(
  row: OpportunityRow & {
    opportunity_skills?: Array<{
      skill_id: string;
      requirement_level: "required" | "preferred";
      skills:
        | { slug: string; name: string; category: string }
        | Array<{ slug: string; name: string; category: string }>
        | null;
    }>;
  }
): OpportunityWithSkills {
  const { opportunity_skills, ...fields } = row;
  const requiredSkills: OpportunitySkillRequirement[] = (opportunity_skills ?? [])
    .map((entry) => {
      const joined = Array.isArray(entry.skills) ? entry.skills[0] : entry.skills;
      if (!joined) return null;
      return {
        skillId: entry.skill_id,
        slug: joined.slug,
        name: joined.name,
        category: joined.category,
        requirementLevel: entry.requirement_level,
      };
    })
    .filter((item): item is OpportunitySkillRequirement => Boolean(item));

  return {
    ...fields,
    requiredSkills,
  };
}

function toCandidateProfile(
  bundle: Awaited<ReturnType<typeof getMemberPortfolioBundle>>
): MatchCandidateProfile {
  if (!bundle) {
    return {
      countryCode: null,
      interests: [],
      workArrangement: "flexible",
      skills: [],
    };
  }
  return {
    countryCode: bundle.profile.country_code,
    interests: bundle.profile.interests,
    workArrangement: bundle.profile.work_arrangement,
    skills: bundle.skills.map((s) => ({
      skillId: s.skillId,
      slug: s.slug,
      name: s.name,
      evidenceStatus: s.evidenceStatus,
      supportingProjectTitles: s.supportingProjects.map((p) => p.title),
    })),
  };
}

/**
 * Loads published opportunities alongside the authenticated member's bookmarks,
 * tracked applications, and deterministic evidence-weighted fit breakdown.
 */
export async function getOpportunityWorkspaceBundle(
  userId: string
): Promise<OpportunityWorkspaceBundle> {
  const supabase = await createSupabaseServerClient();

  const [memberBundle, oppsRes, bookmarksRes, appsRes] = await Promise.all([
    getMemberPortfolioBundle(userId),
    supabase
      .from("opportunities")
      .select(
        "*, opportunity_skills(skill_id, requirement_level, skills(slug, name, category))"
      )
      .eq("publication_status", "published")
      .order("deadline_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("opportunity_bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("opportunity_applications")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  if (oppsRes.error) {
    throw new Error(`Failed to fetch opportunities: ${oppsRes.error.message}`);
  }
  if (bookmarksRes.error) {
    throw new Error(`Failed to fetch bookmarks: ${bookmarksRes.error.message}`);
  }
  if (appsRes.error) {
    throw new Error(`Failed to fetch applications: ${appsRes.error.message}`);
  }

  const candidate = toCandidateProfile(memberBundle);
  const bookmarkByOppId = new Map(
    (bookmarksRes.data ?? []).map((b) => [b.opportunity_id, b])
  );
  const appByOppId = new Map(
    (appsRes.data ?? []).map((a) => [a.opportunity_id, a])
  );

  const items: MatchedOpportunityItem[] = (oppsRes.data ?? [])
    .map((raw) => {
      const opportunity = mapOpportunityRow(
        raw as OpportunityRow & {
          opportunity_skills?: Array<{
            skill_id: string;
            requirement_level: "required" | "preferred";
            skills:
              | { slug: string; name: string; category: string }
              | Array<{ slug: string; name: string; category: string }>
              | null;
          }>;
        }
      );
      const fit = evaluateOpportunityFit(candidate, {
        id: opportunity.id,
        eligibleCountries: opportunity.eligible_countries,
        domainTags: opportunity.domain_tags,
        workArrangement: opportunity.work_arrangement,
        requiredSkills: opportunity.requiredSkills,
      });

      return {
        opportunity,
        fit,
        bookmark: bookmarkByOppId.get(opportunity.id) ?? null,
        application: appByOppId.get(opportunity.id) ?? null,
      };
    })
    .sort((a, b) => b.fit.overallScore - a.fit.overallScore);

  return {
    timezone: memberBundle?.profile.timezone || "UTC",
    countryCode: memberBundle?.profile.country_code ?? null,
    items,
    savedCount: bookmarksRes.data?.length ?? 0,
    applicationCount: appsRes.data?.length ?? 0,
  };
}

export async function getMatchedOpportunityBySlug(
  userId: string,
  slug: string
): Promise<{
  item: MatchedOpportunityItem;
  timezone: string;
  countryCode: string | null;
} | null> {
  const supabase = await createSupabaseServerClient();

  const { data: raw, error } = await supabase
    .from("opportunities")
    .select(
      "*, opportunity_skills(skill_id, requirement_level, skills(slug, name, category))"
    )
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();

  if (error || !raw) {
    return null;
  }

  const opportunity = mapOpportunityRow(
    raw as OpportunityRow & {
      opportunity_skills?: Array<{
        skill_id: string;
        requirement_level: "required" | "preferred";
        skills:
          | { slug: string; name: string; category: string }
          | Array<{ slug: string; name: string; category: string }>
          | null;
      }>;
    }
  );

  const [memberBundle, bookmarkRes, appRes] = await Promise.all([
    getMemberPortfolioBundle(userId),
    supabase
      .from("opportunity_bookmarks")
      .select("*")
      .eq("user_id", userId)
      .eq("opportunity_id", opportunity.id)
      .maybeSingle(),
    supabase
      .from("opportunity_applications")
      .select("*")
      .eq("user_id", userId)
      .eq("opportunity_id", opportunity.id)
      .maybeSingle(),
  ]);

  const candidate = toCandidateProfile(memberBundle);
  const fit = evaluateOpportunityFit(candidate, {
    id: opportunity.id,
    eligibleCountries: opportunity.eligible_countries,
    domainTags: opportunity.domain_tags,
    workArrangement: opportunity.work_arrangement,
    requiredSkills: opportunity.requiredSkills,
  });

  return {
    item: {
      opportunity,
      fit,
      bookmark: bookmarkRes.data ?? null,
      application: appRes.data ?? null,
    },
    timezone: memberBundle?.profile.timezone || "UTC",
    countryCode: memberBundle?.profile.country_code ?? null,
  };
}

export async function listUserOpportunityExportData(userId: string): Promise<{
  bookmarks: Array<{
    id: string;
    opportunity_id: string;
    opportunity_title: string;
    organisation_name: string;
    notes: string;
    saved_at: string;
  }>;
  applications: Array<{
    id: string;
    opportunity_id: string;
    opportunity_title: string;
    organisation_name: string;
    status: OpportunityApplicationRow["status"];
    personal_notes: string;
    external_reference: string;
    submitted_at: string | null;
    next_reminder_at: string | null;
    updated_at: string;
  }>;
}> {
  const supabase = await createSupabaseServerClient();

  const [bookmarksRes, appsRes] = await Promise.all([
    supabase
      .from("opportunity_bookmarks")
      .select("id, opportunity_id, notes, created_at, opportunities(title, organisation_name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("opportunity_applications")
      .select(
        "id, opportunity_id, status, personal_notes, external_reference, submitted_at, next_reminder_at, updated_at, opportunities(title, organisation_name)"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  const bookmarks = (bookmarksRes.data ?? []).map((row) => {
    const opp = Array.isArray(row.opportunities)
      ? row.opportunities[0]
      : row.opportunities;
    return {
      id: row.id,
      opportunity_id: row.opportunity_id,
      opportunity_title: opp?.title ?? "Opportunity",
      organisation_name: opp?.organisation_name ?? "",
      notes: row.notes,
      saved_at: row.created_at,
    };
  });

  const applications = (appsRes.data ?? []).map((row) => {
    const opp = Array.isArray(row.opportunities)
      ? row.opportunities[0]
      : row.opportunities;
    return {
      id: row.id,
      opportunity_id: row.opportunity_id,
      opportunity_title: opp?.title ?? "Opportunity",
      organisation_name: opp?.organisation_name ?? "",
      status: row.status,
      personal_notes: row.personal_notes,
      external_reference: row.external_reference,
      submitted_at: row.submitted_at,
      next_reminder_at: row.next_reminder_at,
      updated_at: row.updated_at,
    };
  });

  return { bookmarks, applications };
}
