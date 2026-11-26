import { isValidCountryCode, isValidIanaTimeZone } from "@/modules/profiles/constants";

export interface CompletenessSection {
  key:
    | "identity"
    | "headline_bio"
    | "skills"
    | "experience"
    | "education"
    | "portfolio"
    | "credentials";
  label: string;
  weight: number;
  completed: boolean;
  hint: string;
}

export interface ProfileCompletenessReport {
  score: number;
  completedCount: number;
  totalSections: number;
  sections: CompletenessSection[];
  disclaimer: string;
}

const PLACEHOLDER_PATTERN = /^(tbd|todo|n\/a|none|test|placeholder|lorem ipsum|\.+|-+)$/i;

function isMeaningfulText(value: string | null | undefined, minLength: number): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < minLength) return false;
  if (PLACEHOLDER_PATTERN.test(trimmed)) return false;
  // Guard against repeated single characters like "aaaaaaa"
  if (/^(.)\1{4,}$/.test(trimmed)) return false;
  return true;
}

/**
 * Transparent professional profile completeness evaluator.
 * Rejects placeholder text and explicitly distinguishes profile completeness
 * from verified professional competence (M2 Section 9).
 */
export function evaluateProfileCompleteness(input: {
  fullName?: string | null;
  countryCode?: string | null;
  timezone?: string | null;
  headline?: string | null;
  bio?: string | null;
  skillCount: number;
  experienceCount: number;
  educationCount: number;
  projectCount: number;
  credentialCount: number;
}): ProfileCompletenessReport {
  const sections: CompletenessSection[] = [
    {
      key: "identity",
      label: "Core Identity & Location",
      weight: 10,
      completed:
        isMeaningfulText(input.fullName, 2) &&
        Boolean(input.countryCode && isValidCountryCode(input.countryCode)) &&
        Boolean(input.timezone && isValidIanaTimeZone(input.timezone)),
      hint: "Add your full name, ISO-3166 country, and IANA time zone.",
    },
    {
      key: "headline_bio",
      label: "Headline & Professional Bio",
      weight: 15,
      completed:
        isMeaningfulText(input.headline, 6) && isMeaningfulText(input.bio, 40),
      hint: "Write a clear professional headline and at least a 40-character biography describing your work.",
    },
    {
      key: "skills",
      label: "Canonical Skills",
      weight: 15,
      completed: input.skillCount >= 3,
      hint: "Select at least 3 canonical skills that reflect your active capabilities.",
    },
    {
      key: "experience",
      label: "Professional Experience",
      weight: 20,
      completed: input.experienceCount >= 1,
      hint: "Document at least 1 role, fellowship, freelance engagement, or internship.",
    },
    {
      key: "education",
      label: "Education & Training",
      weight: 10,
      completed: input.educationCount >= 1,
      hint: "Add your university degree, diploma, bootcamp, vocational or structured training.",
    },
    {
      key: "portfolio",
      label: "Proof-of-Work Portfolio Projects",
      weight: 20,
      completed: input.projectCount >= 1,
      hint: "Publish at least 1 structured project or case study linked to canonical skills.",
    },
    {
      key: "credentials",
      label: "Certifications & Credentials",
      weight: 10,
      completed: input.credentialCount >= 1,
      hint: "Record at least 1 certification, licence, or professional credential.",
    },
  ];

  const score = sections.reduce((sum, s) => sum + (s.completed ? s.weight : 0), 0);
  const completedCount = sections.filter((s) => s.completed).length;

  return {
    score: Math.min(100, score),
    completedCount,
    totalSections: sections.length,
    sections,
    disclaimer:
      "Profile completeness tracks how thoroughly your profile is documented. It is not a score of professional competence or independent verification.",
  };
}
