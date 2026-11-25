"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/identity/guards";
import { replaceUserProfileSkills } from "@/modules/graph/skills-repo";
import {
  ensureInitialTermsConsent,
  getOwnProfileWithSkills,
  updateOwnProfile,
} from "@/modules/profiles/repo";
import {
  calculateProfileCompletionScore,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
} from "@/modules/profiles/schemas";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function saveOnboardingStep1Action(
  payload: unknown
): Promise<ActionResult<{ nextStep: number }>> {
  const user = await requireUser("/onboarding");
  const parsed = onboardingStep1Schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your profile basics.",
    };
  }

  try {
    const existing = await getOwnProfileWithSkills(user.id);
    const nextStep = Math.max(existing?.profile.onboarding_step ?? 1, 2);
    const completionScore = calculateProfileCompletionScore({
      fullName: parsed.data.fullName,
      headline: parsed.data.headline,
      countryCode: parsed.data.countryCode,
      timezone: parsed.data.timezone,
      interests: existing?.profile.interests,
      skillCount: existing?.skills.length ?? 0,
      careerGoals: existing?.profile.career_goals,
      availabilityStatus: existing?.profile.availability_status,
    });

    await updateOwnProfile(user.id, {
      full_name: parsed.data.fullName,
      headline: parsed.data.headline,
      country_code: parsed.data.countryCode,
      timezone: parsed.data.timezone,
      city: parsed.data.city || null,
      onboarding_step: nextStep,
      profile_completion_score: completionScore,
    });

    revalidatePath("/onboarding");
    return { ok: true, data: { nextStep } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save Step 1.",
    };
  }
}

export async function saveOnboardingStep2Action(
  payload: unknown
): Promise<ActionResult<{ nextStep: number }>> {
  const user = await requireUser("/onboarding");
  const parsed = onboardingStep2Schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please select at least one domain.",
    };
  }

  try {
    const existing = await getOwnProfileWithSkills(user.id);
    const nextStep = Math.max(existing?.profile.onboarding_step ?? 2, 3);
    const completionScore = calculateProfileCompletionScore({
      fullName: existing?.profile.full_name,
      headline: existing?.profile.headline,
      countryCode: existing?.profile.country_code,
      timezone: existing?.profile.timezone,
      interests: parsed.data.interests,
      skillCount: existing?.skills.length ?? 0,
      careerGoals: existing?.profile.career_goals,
      availabilityStatus: existing?.profile.availability_status,
    });

    await updateOwnProfile(user.id, {
      interests: parsed.data.interests,
      onboarding_step: nextStep,
      profile_completion_score: completionScore,
    });

    revalidatePath("/onboarding");
    return { ok: true, data: { nextStep } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save domains.",
    };
  }
}

export async function saveOnboardingStep3Action(
  payload: unknown
): Promise<ActionResult<{ nextStep: number }>> {
  const user = await requireUser("/onboarding");
  const parsed = onboardingStep3Schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please select at least one canonical skill.",
    };
  }

  try {
    await replaceUserProfileSkills(user.id, parsed.data.skills);
    const existing = await getOwnProfileWithSkills(user.id);
    const completionScore = calculateProfileCompletionScore({
      fullName: existing?.profile.full_name,
      headline: existing?.profile.headline,
      countryCode: existing?.profile.country_code,
      timezone: existing?.profile.timezone,
      interests: existing?.profile.interests,
      skillCount: parsed.data.skills.length,
      careerGoals: existing?.profile.career_goals,
      availabilityStatus: existing?.profile.availability_status,
    });

    await updateOwnProfile(user.id, {
      onboarding_step: 4,
      profile_completion_score: completionScore,
    });

    revalidatePath("/onboarding");
    return { ok: true, data: { nextStep: 4 } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save skills.",
    };
  }
}

export async function completeOnboardingAction(
  payload: unknown
): Promise<ActionResult<{ redirectTo: string }>> {
  const user = await requireUser("/onboarding");
  const parsed = onboardingStep4Schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please select your career goals and availability.",
    };
  }

  try {
    const existing = await getOwnProfileWithSkills(user.id);
    const completionScore = calculateProfileCompletionScore({
      fullName: existing?.profile.full_name,
      headline: existing?.profile.headline,
      countryCode: existing?.profile.country_code,
      timezone: existing?.profile.timezone,
      interests: existing?.profile.interests,
      skillCount: existing?.skills.length ?? 0,
      careerGoals: parsed.data.careerGoals,
      availabilityStatus: parsed.data.availabilityStatus,
    });

    await updateOwnProfile(user.id, {
      career_goals: parsed.data.careerGoals,
      career_goal: parsed.data.careerGoalSummary,
      availability_status: parsed.data.availabilityStatus,
      onboarding_step: 4,
      onboarding_completed_at: new Date().toISOString(),
      profile_completion_score: completionScore,
    });

    await ensureInitialTermsConsent(user.id);

    revalidatePath("/onboarding");
    revalidatePath("/home");
    revalidatePath("/profile");
    revalidatePath("/settings");

    return { ok: true, data: { redirectTo: "/home" } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to complete onboarding.",
    };
  }
}
