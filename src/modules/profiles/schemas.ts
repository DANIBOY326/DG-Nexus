import { z } from "zod";
import {
  CAREER_GOAL_SLUGS,
  DOMAIN_INTEREST_SLUGS,
  isValidCountryCode,
  isValidIanaTimeZone,
} from "@/modules/profiles/constants";

export const onboardingStep1Schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(120, "Full name must be 120 characters or fewer."),
  headline: z
    .string()
    .trim()
    .min(4, "Add a concise professional headline (at least 4 characters).")
    .max(160, "Headline must be 160 characters or fewer."),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine((val) => isValidCountryCode(val), "Select a valid ISO-3166 country."),
  timezone: z
    .string()
    .trim()
    .refine((val) => isValidIanaTimeZone(val), "Select a valid IANA time zone."),
  city: z.string().trim().max(100, "City name is too long.").optional().default(""),
});

export const onboardingStep2Schema = z.object({
  interests: z
    .array(
      z
        .string()
        .trim()
        .refine((slug) => DOMAIN_INTEREST_SLUGS.has(slug), "Invalid domain selection.")
    )
    .min(1, "Select at least 1 domain or area of curiosity.")
    .max(6, "Select up to 6 domains to keep recommendations focused."),
});

export const skillSelectionSchema = z.object({
  skillId: z.string().uuid("Invalid canonical skill identifier."),
  proficiencyLevel: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .default("intermediate"),
});

export const onboardingStep3Schema = z.object({
  skills: z
    .array(skillSelectionSchema)
    .min(1, "Select at least 1 canonical skill.")
    .max(15, "Select up to 15 skills during onboarding.")
    .transform((items) => {
      // Deduplicate by skillId while preserving first-selected order
      const seen = new Set<string>();
      return items.filter((item) => {
        if (seen.has(item.skillId)) return false;
        seen.add(item.skillId);
        return true;
      });
    }),
});

export const onboardingStep4Schema = z.object({
  careerGoals: z
    .array(
      z
        .string()
        .trim()
        .refine((slug) => CAREER_GOAL_SLUGS.has(slug), "Invalid career goal selection.")
    )
    .min(1, "Select at least 1 career goal.")
    .max(6, "Select up to 6 career goals."),
  careerGoalSummary: z
    .string()
    .trim()
    .max(240, "Goal statement must be 240 characters or fewer.")
    .optional()
    .default(""),
  availabilityStatus: z.enum([
    "actively_looking",
    "open_to_opportunities",
    "collaborating",
    "mentoring",
    "unavailable",
  ]),
});

export const visibilityUpdateSchema = z.object({
  visibilityScope: z.enum(["public", "connections", "private"]),
});

export const aiConsentUpdateSchema = z.object({
  granted: z.boolean(),
});

export function calculateProfileCompletionScore(input: {
  fullName?: string | null;
  headline?: string | null;
  countryCode?: string | null;
  timezone?: string | null;
  interests?: string[] | null;
  skillCount?: number;
  careerGoals?: string[] | null;
  availabilityStatus?: string | null;
}): number {
  let score = 0;
  if (input.fullName && input.fullName.trim().length >= 2) score += 15;
  if (input.headline && input.headline.trim().length >= 4) score += 15;
  if (input.countryCode && isValidCountryCode(input.countryCode)) score += 15;
  if (input.timezone && isValidIanaTimeZone(input.timezone)) score += 10;
  if (input.interests && input.interests.length > 0) score += 15;
  if ((input.skillCount ?? 0) > 0) score += 15;
  if (input.careerGoals && input.careerGoals.length > 0) score += 10;
  if (input.availabilityStatus) score += 5;
  return Math.min(100, score);
}
