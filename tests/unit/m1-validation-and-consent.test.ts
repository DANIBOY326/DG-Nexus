import { describe, expect, it } from "vitest";
import { deduplicateSkillSelections } from "@/modules/graph/skills-repo";
import { evaluateAiContextAccess } from "@/modules/nexus-ai/consent";
import {
  getSupportedTimeZones,
  isValidCountryCode,
  isValidIanaTimeZone,
} from "@/modules/profiles/constants";
import type { ProfileWithSkills } from "@/modules/profiles/repo";
import {
  calculateProfileCompletionScore,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
  visibilityUpdateSchema,
} from "@/modules/profiles/schemas";

const SKILL_UUID_1 = "11111111-1111-4111-8111-111111111111";
const SKILL_UUID_2 = "22222222-2222-4222-8222-222222222222";

function buildMockRecord(aiConsent: boolean): ProfileWithSkills {
  return {
    profile: {
      user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      handle: "amina",
      full_name: "Amina Osei",
      headline: "Full-Stack Engineer",
      bio: "",
      avatar_url: null,
      country_code: "NG",
      city: "Lagos",
      timezone: "Africa/Lagos",
      interests: ["technology", "artificial-intelligence"],
      career_goals: ["discover-opportunities"],
      career_goal: "Lead global distributed systems",
      availability_status: "open_to_opportunities",
      visibility_scope: "private",
      ai_context_consent: aiConsent,
      profile_completion_score: 100,
      onboarding_step: 4,
      onboarding_completed_at: "2026-11-25T10:00:00Z",
      created_at: "2026-11-25T09:00:00Z",
      updated_at: "2026-11-25T10:00:00Z",
    },
    skills: [
      {
        skillId: SKILL_UUID_1,
        slug: "typescript",
        name: "TypeScript",
        category: "Technology",
        proficiencyLevel: "advanced",
        evidenceStatus: "self_reported",
        createdAt: "2026-11-25T09:30:00Z",
      },
    ],
  };
}

describe("M1.1 onboarding schemas, global standards & AI consent guard", () => {
  it("validates standardised ISO-3166 country codes and rejects free text", () => {
    expect(isValidCountryCode("NG")).toBe(true);
    expect(isValidCountryCode("GB")).toBe(true);
    expect(isValidCountryCode("US")).toBe(true);
    expect(isValidCountryCode("Nigeria")).toBe(false);
    expect(isValidCountryCode("ZZ")).toBe(false);
  });

  it("validates standardised IANA time zones and rejects invalid strings", () => {
    expect(isValidIanaTimeZone("Africa/Lagos")).toBe(true);
    expect(isValidIanaTimeZone("Europe/London")).toBe(true);
    expect(isValidIanaTimeZone("UTC")).toBe(true);
    expect(isValidIanaTimeZone("Mars/Olympus")).toBe(false);
    expect(getSupportedTimeZones().length).toBeGreaterThan(15);
  });

  it("validates onboarding Steps 1–4 and deduplicates duplicate canonical skills", () => {
    expect(
      onboardingStep1Schema.safeParse({
        fullName: "Amina Osei",
        headline: "Product Designer & Researcher",
        countryCode: "ng",
        timezone: "Africa/Lagos",
        city: "Lagos",
      }).success
    ).toBe(true);

    expect(
      onboardingStep2Schema.safeParse({
        interests: ["technology", "climate"],
      }).success
    ).toBe(true);

    expect(
      onboardingStep2Schema.safeParse({
        interests: ["unrecognised-domain"],
      }).success
    ).toBe(false);

    const step3 = onboardingStep3Schema.parse({
      skills: [
        { skillId: SKILL_UUID_1, proficiencyLevel: "advanced" },
        { skillId: SKILL_UUID_1, proficiencyLevel: "beginner" },
        { skillId: SKILL_UUID_2, proficiencyLevel: "intermediate" },
      ],
    });
    expect(step3.skills).toHaveLength(2);
    expect(step3.skills[0]?.proficiencyLevel).toBe("advanced");

    expect(
      deduplicateSkillSelections([
        { skillId: SKILL_UUID_1, proficiencyLevel: "expert" },
        { skillId: SKILL_UUID_1, proficiencyLevel: "beginner" },
      ])
    ).toHaveLength(1);

    expect(
      onboardingStep4Schema.safeParse({
        careerGoals: ["discover-opportunities", "find-mentorship"],
        careerGoalSummary: "Target international AI fellowships",
        availabilityStatus: "actively_looking",
      }).success
    ).toBe(true);
  });

  it("validates the three M1 profile visibility levels strictly", () => {
    expect(visibilityUpdateSchema.safeParse({ visibilityScope: "public" }).success).toBe(true);
    expect(visibilityUpdateSchema.safeParse({ visibilityScope: "connections" }).success).toBe(
      true
    );
    expect(visibilityUpdateSchema.safeParse({ visibilityScope: "private" }).success).toBe(true);
    expect(visibilityUpdateSchema.safeParse({ visibilityScope: "everyone" }).success).toBe(false);
  });

  it("blocks Nexus AI context when ai_context_consent is false and strips direct PII when true", () => {
    const denied = evaluateAiContextAccess(buildMockRecord(false));
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe("AI_CONTEXT_CONSENT_REQUIRED");
    expect(denied.context).toBeNull();

    const granted = evaluateAiContextAccess(buildMockRecord(true));
    expect(granted.allowed).toBe(true);
    expect(granted.context?.skills[0]?.name).toBe("TypeScript");
    // Direct PII must never be included in AI context payload
    expect("full_name" in (granted.context as unknown as Record<string, unknown>)).toBe(false);
    expect("city" in (granted.context as unknown as Record<string, unknown>)).toBe(false);
  });

  it("computes profile completion score consistently", () => {
    const score = calculateProfileCompletionScore({
      fullName: "Amina Osei",
      headline: "Software Engineer",
      countryCode: "NG",
      timezone: "Africa/Lagos",
      interests: ["technology"],
      skillCount: 3,
      careerGoals: ["discover-opportunities"],
      availabilityStatus: "actively_looking",
    });
    expect(score).toBe(100);
  });
});
