"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RecordVisibilityScope } from "@/lib/supabase/database.types";
import { requireUser } from "@/modules/identity/guards";
import type { ActionResult } from "@/modules/profiles/actions";
import { recalculateAndPersistProfileCompleteness } from "@/modules/portfolio/repo";
import {
  credentialInputSchema,
  deriveInitialCredentialStatus,
  educationInputSchema,
  experienceInputSchema,
  generateProjectSlug,
  portfolioProjectInputSchema,
  profileCoreUpdateSchema,
} from "@/modules/portfolio/schemas";

function revalidatePortfolioPaths(handle?: string | null, projectId?: string) {
  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/settings");
  if (projectId) {
    revalidatePath(`/profile/projects/${projectId}`);
  }
  if (handle) {
    revalidatePath(`/u/${handle}`);
  }
}

export async function updateProfileCoreAction(
  payload: unknown
): Promise<ActionResult<{ handle: string | null; completionScore: number }>> {
  const user = await requireUser("/profile");
  const parsed = profileCoreUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please review your profile details.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("profiles")
      .select("handle")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        handle: parsed.data.handle,
        headline: parsed.data.headline,
        bio: parsed.data.bio,
        current_focus: parsed.data.currentFocus,
        country_code: parsed.data.countryCode,
        city: parsed.data.city || null,
        timezone: parsed.data.timezone,
        work_arrangement: parsed.data.workArrangement,
        availability_status: parsed.data.availabilityStatus,
        visibility_scope: parsed.data.visibilityScope,
        allow_search_indexing:
          parsed.data.visibilityScope === "public" ? parsed.data.allowSearchIndexing : false,
        achievements: parsed.data.achievements,
        contact_links: parsed.data.contactLinks,
      })
      .eq("user_id", user.id);

    if (error) {
      if (error.code === "23505" || error.message.toLowerCase().includes("handle")) {
        return {
          ok: false,
          error: "That public profile handle is already taken. Please try another.",
        };
      }
      return { ok: false, error: `Failed to save profile: ${error.message}` };
    }

    const completeness = await recalculateAndPersistProfileCompleteness(user.id);
    revalidatePortfolioPaths(existing?.handle);
    revalidatePortfolioPaths(parsed.data.handle);

    return {
      ok: true,
      data: {
        handle: parsed.data.handle,
        completionScore: completeness?.score ?? 0,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to update profile.",
    };
  }
}

export async function saveExperienceAction(
  payload: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser("/profile");
  const parsed = experienceInputSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your experience details.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const recordValues = {
      user_id: user.id,
      organisation_name: parsed.data.organisationName,
      role_title: parsed.data.roleTitle,
      employment_type: parsed.data.employmentType,
      location: parsed.data.location,
      work_arrangement: parsed.data.workArrangement,
      start_date: parsed.data.startDate,
      end_date: parsed.data.isCurrent ? null : parsed.data.endDate,
      is_current: parsed.data.isCurrent,
      description: parsed.data.description,
      responsibilities: parsed.data.responsibilities,
      achievements: parsed.data.achievements,
      visibility_scope: parsed.data.visibilityScope,
    };

    let experienceId = parsed.data.id;

    if (experienceId) {
      const { data, error } = await supabase
        .from("profile_experiences")
        .update(recordValues)
        .eq("id", experienceId)
        .eq("user_id", user.id)
        .select("id")
        .single();
      if (error) {
        return { ok: false, error: `Failed to update experience: ${error.message}` };
      }
      experienceId = data.id;
    } else {
      const { data, error } = await supabase
        .from("profile_experiences")
        .insert(recordValues)
        .select("id")
        .single();
      if (error) {
        return { ok: false, error: `Failed to add experience: ${error.message}` };
      }
      experienceId = data.id;
    }

    // Synchronise linked canonical skills cleanly
    const { error: delSkillsErr } = await supabase
      .from("experience_skills")
      .delete()
      .eq("experience_id", experienceId);
    if (delSkillsErr) {
      return { ok: false, error: `Failed to sync experience skills: ${delSkillsErr.message}` };
    }

    const uniqueSkillIds = Array.from(new Set(parsed.data.skillIds));
    if (uniqueSkillIds.length > 0) {
      const { error: insSkillsErr } = await supabase.from("experience_skills").insert(
        uniqueSkillIds.map((skillId) => ({
          experience_id: experienceId!,
          skill_id: skillId,
        }))
      );
      if (insSkillsErr) {
        return { ok: false, error: `Failed to link experience skills: ${insSkillsErr.message}` };
      }
    }

    await recalculateAndPersistProfileCompleteness(user.id);
    revalidatePortfolioPaths();
    return { ok: true, data: { id: experienceId } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to save experience record.",
    };
  }
}

export async function deleteExperienceAction(id: string): Promise<ActionResult> {
  const user = await requireUser("/profile");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, error: "Invalid experience identifier." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profile_experiences")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: `Failed to delete experience: ${error.message}` };
    }

    await recalculateAndPersistProfileCompleteness(user.id);
    revalidatePortfolioPaths();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to delete experience record.",
    };
  }
}

export async function saveEducationAction(
  payload: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser("/profile");
  const parsed = educationInputSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your education details.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const values = {
      user_id: user.id,
      institution: parsed.data.institution,
      qualification: parsed.data.qualification,
      pathway_type: parsed.data.pathwayType,
      field_of_study: parsed.data.fieldOfStudy,
      start_year: parsed.data.startYear,
      end_year: parsed.data.endYear,
      is_current: parsed.data.isCurrent,
      description: parsed.data.description,
      achievements: parsed.data.achievements,
      visibility_scope: parsed.data.visibilityScope,
    };

    let educationId = parsed.data.id;
    if (educationId) {
      const { data, error } = await supabase
        .from("profile_educations")
        .update(values)
        .eq("id", educationId)
        .eq("user_id", user.id)
        .select("id")
        .single();
      if (error) {
        return { ok: false, error: `Failed to update education: ${error.message}` };
      }
      educationId = data.id;
    } else {
      const { data, error } = await supabase
        .from("profile_educations")
        .insert(values)
        .select("id")
        .single();
      if (error) {
        return { ok: false, error: `Failed to add education: ${error.message}` };
      }
      educationId = data.id;
    }

    await recalculateAndPersistProfileCompleteness(user.id);
    revalidatePortfolioPaths();
    return { ok: true, data: { id: educationId } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to save education record.",
    };
  }
}

export async function deleteEducationAction(id: string): Promise<ActionResult> {
  const user = await requireUser("/profile");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, error: "Invalid education identifier." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profile_educations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: `Failed to delete education: ${error.message}` };
    }

    await recalculateAndPersistProfileCompleteness(user.id);
    revalidatePortfolioPaths();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to delete education record.",
    };
  }
}

export async function saveCredentialAction(
  payload: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser("/profile");
  const parsed = credentialInputSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your credential details.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    let credentialId = parsed.data.id;

    if (credentialId) {
      // Check whether evidence files already exist on this credential
      const { count: fileCount } = await supabase
        .from("evidence_files")
        .select("id", { count: "exact", head: true })
        .eq("credential_id", credentialId)
        .eq("user_id", user.id);

      const derivedStatus = deriveInitialCredentialStatus({
        verificationUrl: parsed.data.verificationUrl,
        hasEvidenceFile: (fileCount ?? 0) > 0,
        expiryDate: parsed.data.expiryDate,
      });

      const { data, error } = await supabase
        .from("profile_credentials")
        .update({
          name: parsed.data.name,
          issuing_organisation: parsed.data.issuingOrganisation,
          issue_date: parsed.data.issueDate,
          expiry_date: parsed.data.expiryDate,
          credential_id_code: parsed.data.credentialIdCode,
          verification_url: parsed.data.verificationUrl,
          verification_status: derivedStatus,
          visibility_scope: parsed.data.visibilityScope,
        })
        .eq("id", credentialId)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (error) {
        return { ok: false, error: `Failed to update credential: ${error.message}` };
      }
      credentialId = data.id;
    } else {
      const initialStatus = deriveInitialCredentialStatus({
        verificationUrl: parsed.data.verificationUrl,
        hasEvidenceFile: false,
        expiryDate: parsed.data.expiryDate,
      });
      // DB trigger enforces self_reported or evidence_submitted on INSERT
      const insertStatus =
        initialStatus === "expired" ? "self_reported" : initialStatus;

      const { data, error } = await supabase
        .from("profile_credentials")
        .insert({
          user_id: user.id,
          name: parsed.data.name,
          issuing_organisation: parsed.data.issuingOrganisation,
          issue_date: parsed.data.issueDate,
          expiry_date: parsed.data.expiryDate,
          credential_id_code: parsed.data.credentialIdCode,
          verification_url: parsed.data.verificationUrl,
          verification_status: insertStatus,
          visibility_scope: parsed.data.visibilityScope,
        })
        .select("id")
        .single();

      if (error) {
        return { ok: false, error: `Failed to add credential: ${error.message}` };
      }
      credentialId = data.id;
    }

    await supabase.from("credential_skills").delete().eq("credential_id", credentialId);
    const uniqueSkills = Array.from(new Set(parsed.data.skillIds));
    if (uniqueSkills.length > 0) {
      const { error: skillErr } = await supabase.from("credential_skills").insert(
        uniqueSkills.map((skillId) => ({
          credential_id: credentialId!,
          skill_id: skillId,
        }))
      );
      if (skillErr) {
        return { ok: false, error: `Failed to link credential skills: ${skillErr.message}` };
      }
    }

    await recalculateAndPersistProfileCompleteness(user.id);
    revalidatePortfolioPaths();
    return { ok: true, data: { id: credentialId } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to save credential.",
    };
  }
}

export async function deleteCredentialAction(id: string): Promise<ActionResult> {
  const user = await requireUser("/profile");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, error: "Invalid credential identifier." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    // Clean up any associated private storage objects before cascade row delete
    const { data: files } = await supabase
      .from("evidence_files")
      .select("storage_bucket, storage_path")
      .eq("credential_id", id)
      .eq("user_id", user.id);

    if (files && files.length > 0 && files[0]) {
      await supabase.storage
        .from(files[0].storage_bucket)
        .remove(files.map((f) => f.storage_path));
    }

    const { error } = await supabase
      .from("profile_credentials")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: `Failed to delete credential: ${error.message}` };
    }

    await recalculateAndPersistProfileCompleteness(user.id);
    revalidatePortfolioPaths();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to delete credential.",
    };
  }
}

export async function savePortfolioProjectAction(
  payload: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await requireUser("/profile");
  const parsed = portfolioProjectInputSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your project details.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    let projectId = parsed.data.id;
    let projectSlug = generateProjectSlug(parsed.data.title);

    if (projectId) {
      const { data: existing } = await supabase
        .from("portfolio_projects")
        .select("slug")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      projectSlug = existing?.slug ?? projectSlug;

      const { data, error } = await supabase
        .from("portfolio_projects")
        .update({
          title: parsed.data.title,
          summary: parsed.data.summary,
          description: parsed.data.description,
          category_slug: parsed.data.categorySlug,
          project_type: parsed.data.projectType,
          project_status: parsed.data.projectStatus,
          start_date: parsed.data.startDate,
          completion_date: parsed.data.completionDate,
          associated_organisation: parsed.data.associatedOrganisation,
          is_collaborative: parsed.data.isCollaborative,
          member_role: parsed.data.memberRole,
          member_contribution: parsed.data.memberContribution,
          team_members: parsed.data.teamMembers,
          outcomes: parsed.data.outcomes,
          achievements: parsed.data.achievements,
          tools_used: parsed.data.toolsUsed,
          project_url: parsed.data.projectUrl,
          repository_url: parsed.data.repositoryUrl,
          visibility_scope: parsed.data.visibilityScope,
        })
        .eq("id", projectId)
        .eq("user_id", user.id)
        .select("id, slug")
        .single();

      if (error) {
        return { ok: false, error: `Failed to update project: ${error.message}` };
      }
      projectId = data.id;
      projectSlug = data.slug;
    } else {
      // Check slug collision for this member and append deterministic short suffix if needed
      const { data: clash } = await supabase
        .from("portfolio_projects")
        .select("id")
        .eq("user_id", user.id)
        .eq("slug", projectSlug)
        .maybeSingle();

      if (clash) {
        projectSlug = generateProjectSlug(
          parsed.data.title,
          Date.now().toString(36).slice(-5)
        );
      }

      const { data, error } = await supabase
        .from("portfolio_projects")
        .insert({
          user_id: user.id,
          slug: projectSlug,
          title: parsed.data.title,
          summary: parsed.data.summary,
          description: parsed.data.description,
          category_slug: parsed.data.categorySlug,
          project_type: parsed.data.projectType,
          project_status: parsed.data.projectStatus,
          start_date: parsed.data.startDate,
          completion_date: parsed.data.completionDate,
          associated_organisation: parsed.data.associatedOrganisation,
          is_collaborative: parsed.data.isCollaborative,
          member_role: parsed.data.memberRole,
          member_contribution: parsed.data.memberContribution,
          team_members: parsed.data.teamMembers,
          outcomes: parsed.data.outcomes,
          achievements: parsed.data.achievements,
          tools_used: parsed.data.toolsUsed,
          project_url: parsed.data.projectUrl,
          repository_url: parsed.data.repositoryUrl,
          visibility_scope: parsed.data.visibilityScope,
        })
        .select("id, slug")
        .single();

      if (error) {
        return { ok: false, error: `Failed to create project: ${error.message}` };
      }
      projectId = data.id;
      projectSlug = data.slug;
    }

    // Diff canonical project skills so DB triggers accurately promote/revert portfolio_supported
    const { data: existingLinks } = await supabase
      .from("portfolio_project_skills")
      .select("skill_id")
      .eq("project_id", projectId);

    const existingIds = new Set((existingLinks ?? []).map((r) => r.skill_id));
    const targetIds = new Set(parsed.data.skillIds);
    const toRemove = [...existingIds].filter((id) => !targetIds.has(id));
    const toAdd = [...targetIds].filter((id) => !existingIds.has(id));

    if (toRemove.length > 0) {
      const { error: rmErr } = await supabase
        .from("portfolio_project_skills")
        .delete()
        .eq("project_id", projectId)
        .in("skill_id", toRemove);
      if (rmErr) {
        return { ok: false, error: `Failed to unlink removed skills: ${rmErr.message}` };
      }
    }

    if (toAdd.length > 0) {
      const { error: addErr } = await supabase.from("portfolio_project_skills").insert(
        toAdd.map((skillId) => ({
          project_id: projectId!,
          skill_id: skillId,
        }))
      );
      if (addErr) {
        return { ok: false, error: `Failed to link project skills: ${addErr.message}` };
      }
    }

    await recalculateAndPersistProfileCompleteness(user.id);
    revalidatePortfolioPaths(undefined, projectId);
    return { ok: true, data: { id: projectId, slug: projectSlug } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to save portfolio project.",
    };
  }
}

export async function deletePortfolioProjectAction(id: string): Promise<ActionResult> {
  const user = await requireUser("/profile");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false, error: "Invalid project identifier." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: files } = await supabase
      .from("evidence_files")
      .select("storage_bucket, storage_path")
      .eq("project_id", id)
      .eq("user_id", user.id);

    if (files && files.length > 0 && files[0]) {
      await supabase.storage
        .from(files[0].storage_bucket)
        .remove(files.map((f) => f.storage_path));
    }

    const { error } = await supabase
      .from("portfolio_projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: `Failed to delete project: ${error.message}` };
    }

    await recalculateAndPersistProfileCompleteness(user.id);
    revalidatePortfolioPaths(undefined, id);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to delete project.",
    };
  }
}

export async function updateEvidenceVisibilityAction(input: {
  evidenceId: string;
  visibilityScope: RecordVisibilityScope;
}): Promise<ActionResult> {
  const user = await requireUser("/profile");
  if (!/^[0-9a-f-]{36}$/i.test(input.evidenceId)) {
    return { ok: false, error: "Invalid evidence identifier." };
  }
  if (!["public", "connections", "private"].includes(input.visibilityScope)) {
    return { ok: false, error: "Invalid visibility scope." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("evidence_files")
      .update({ visibility_scope: input.visibilityScope })
      .eq("id", input.evidenceId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: `Failed to update file visibility: ${error.message}` };
    }

    revalidatePortfolioPaths();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to update file visibility.",
    };
  }
}
