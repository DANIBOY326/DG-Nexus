import { z } from "zod";
import {
  isValidCountryCode,
  isValidIanaTimeZone,
} from "@/modules/profiles/constants";
import { RESERVED_PROFILE_HANDLES } from "@/modules/portfolio/constants";

/**
 * Strict HTTPS URL validator — rejects javascript:, data:, file:, and non-HTTP schemes.
 */
export function isSafeHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

const optionalSafeUrlSchema = z
  .string()
  .trim()
  .max(500, "URL must be 500 characters or fewer.")
  .optional()
  .default("")
  .refine((val) => val === "" || isSafeHttpUrl(val), {
    message: "Enter a valid https:// or http:// URL.",
  })
  .transform((val) => (val === "" ? null : val));

const isoDateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid YYYY-MM-DD date.");

const optionalIsoDateSchema = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Use a valid YYYY-MM-DD date.",
  })
  .transform((val) => (val === "" ? null : val));

export const contactLinkSchema = z.object({
  kind: z.enum(["portfolio", "github", "linkedin", "behance", "scholar", "other"]),
  label: z
    .string()
    .trim()
    .min(2, "Link label must be at least 2 characters.")
    .max(60, "Link label must be 60 characters or fewer."),
  url: z
    .string()
    .trim()
    .max(500, "URL is too long.")
    .refine(isSafeHttpUrl, "Link must start with https:// or http://."),
});

export type ContactLink = z.infer<typeof contactLinkSchema>;

export function normaliseHandleSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function generateProjectSlug(title: string, suffix?: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  const cleanBase = base.length >= 2 ? base : "project";
  if (suffix) {
    const cleanSuffix = suffix.replace(/[^a-z0-9]/g, "").slice(0, 8);
    return `${cleanBase}-${cleanSuffix}`;
  }
  return cleanBase;
}

export function splitLinesOrCsv(raw: string, maxItems = 12, maxItemLen = 180): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•\-*]\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, maxItems)
    .map((line) => line.slice(0, maxItemLen));
}

export function splitTags(raw: string, maxItems = 20, maxItemLen = 50): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(/[,;\r\n]+/)) {
    const cleaned = part.trim().slice(0, maxItemLen);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
    if (result.length >= maxItems) break;
  }
  return result;
}

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    (val) => val === "" || /^[a-z0-9][a-z0-9-]{2,38}[a-z0-9]$/.test(val),
    "Handle must be 4–40 characters using lowercase letters, numbers, and hyphens."
  )
  .refine(
    (val) => val === "" || !RESERVED_PROFILE_HANDLES.has(val),
    "That profile handle is reserved. Please choose another."
  )
  .transform((val) => (val === "" ? null : val));

export const profileCoreUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(120, "Full name must be 120 characters or fewer."),
  handle: handleSchema.optional().default(""),
  headline: z
    .string()
    .trim()
    .min(4, "Professional headline must be at least 4 characters.")
    .max(160, "Headline must be 160 characters or fewer."),
  bio: z
    .string()
    .trim()
    .max(2000, "Professional biography must be 2,000 characters or fewer.")
    .default(""),
  currentFocus: z
    .string()
    .trim()
    .max(240, "Current professional focus must be 240 characters or fewer.")
    .default(""),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .refine(isValidCountryCode, "Select a valid ISO-3166 country."),
  city: z.string().trim().max(100, "City name is too long.").optional().default(""),
  timezone: z
    .string()
    .trim()
    .refine(isValidIanaTimeZone, "Select a valid IANA time zone."),
  workArrangement: z.enum(["onsite", "hybrid", "remote", "flexible"]).default("flexible"),
  availabilityStatus: z.enum([
    "actively_looking",
    "open_to_opportunities",
    "collaborating",
    "mentoring",
    "unavailable",
  ]),
  visibilityScope: z.enum(["public", "connections", "private"]),
  allowSearchIndexing: z.boolean().default(false),
  achievements: z.array(z.string().trim().min(2).max(200)).max(10).default([]),
  contactLinks: z.array(contactLinkSchema).max(6).default([]),
});

export type ProfileCoreUpdateInput = z.infer<typeof profileCoreUpdateSchema>;

export const experienceInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    organisationName: z
      .string()
      .trim()
      .min(2, "Organisation name must be at least 2 characters.")
      .max(140, "Organisation name is too long."),
    roleTitle: z
      .string()
      .trim()
      .min(2, "Role or job title must be at least 2 characters.")
      .max(140, "Role title is too long."),
    employmentType: z.enum([
      "full_time",
      "part_time",
      "contract",
      "freelance",
      "internship",
      "volunteer",
      "fellowship",
      "apprenticeship",
      "other",
    ]),
    location: z.string().trim().max(120, "Location is too long.").optional().default(""),
    workArrangement: z.enum(["onsite", "hybrid", "remote"]).default("hybrid"),
    startDate: isoDateStringSchema,
    endDate: optionalIsoDateSchema,
    isCurrent: z.boolean().default(false),
    description: z.string().trim().max(1500, "Description is too long.").optional().default(""),
    responsibilities: z.array(z.string().trim().min(2).max(220)).max(10).default([]),
    achievements: z.array(z.string().trim().min(2).max(220)).max(10).default([]),
    skillIds: z.array(z.string().uuid()).max(15).default([]),
    visibilityScope: z.enum(["public", "connections", "private"]).default("public"),
  })
  .superRefine((data, ctx) => {
    if (data.isCurrent && data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Clear the end date when marking a role as current.",
      });
    }
    if (!data.isCurrent && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date cannot be earlier than start date.",
      });
    }
  });

export type ExperienceInput = z.infer<typeof experienceInputSchema>;

export const educationInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    institution: z
      .string()
      .trim()
      .min(2, "Institution or training provider must be at least 2 characters.")
      .max(160, "Institution name is too long."),
    qualification: z
      .string()
      .trim()
      .min(2, "Qualification or programme name must be at least 2 characters.")
      .max(160, "Qualification name is too long."),
    pathwayType: z
      .enum([
        "degree",
        "diploma",
        "bootcamp",
        "vocational",
        "professional_training",
        "certification_programme",
        "self_directed",
        "other",
      ])
      .default("degree"),
    fieldOfStudy: z.string().trim().max(140, "Field of study is too long.").optional().default(""),
    startYear: z.coerce.number().int().min(1950, "Enter a valid start year.").max(2100),
    endYear: z
      .union([z.literal(""), z.null(), z.undefined(), z.coerce.number().int().min(1950).max(2100)])
      .transform((val) => (val === "" || val === undefined ? null : val)),
    isCurrent: z.boolean().default(false),
    description: z.string().trim().max(1200, "Description is too long.").optional().default(""),
    achievements: z.array(z.string().trim().min(2).max(220)).max(8).default([]),
    visibilityScope: z.enum(["public", "connections", "private"]).default("public"),
  })
  .superRefine((data, ctx) => {
    if (data.endYear !== null && data.endYear < data.startYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endYear"],
        message: "Completion year cannot be earlier than start year.",
      });
    }
  });

export type EducationInput = z.infer<typeof educationInputSchema>;

/**
 * Credential validation strictly forbids user-submitted 'verified', 'under_review', or 'rejected' statuses.
 * Status is derived transparently from whether supporting evidence/verification URL exists.
 */
export const credentialInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z
      .string()
      .trim()
      .min(2, "Credential name must be at least 2 characters.")
      .max(160, "Credential name is too long."),
    issuingOrganisation: z
      .string()
      .trim()
      .min(2, "Issuing organisation must be at least 2 characters.")
      .max(160, "Issuing organisation is too long."),
    issueDate: optionalIsoDateSchema,
    expiryDate: optionalIsoDateSchema,
    credentialIdCode: z.string().trim().max(100, "Credential ID is too long.").optional().default(""),
    verificationUrl: optionalSafeUrlSchema,
    skillIds: z.array(z.string().uuid()).max(12).default([]),
    visibilityScope: z.enum(["public", "connections", "private"]).default("public"),
  })
  .superRefine((data, ctx) => {
    if (data.issueDate && data.expiryDate && data.expiryDate < data.issueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiryDate"],
        message: "Expiry date cannot be earlier than issue date.",
      });
    }
  });

export type CredentialInput = z.infer<typeof credentialInputSchema>;

export function deriveInitialCredentialStatus(input: {
  verificationUrl?: string | null;
  hasEvidenceFile?: boolean;
  expiryDate?: string | null;
  now?: Date;
}): "self_reported" | "evidence_submitted" | "expired" {
  if (input.expiryDate) {
    const today = (input.now ?? new Date()).toISOString().slice(0, 10);
    if (input.expiryDate < today) {
      return "expired";
    }
  }
  if (input.hasEvidenceFile || (input.verificationUrl && input.verificationUrl.trim().length > 0)) {
    return "evidence_submitted";
  }
  return "self_reported";
}

export const portfolioProjectInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z
      .string()
      .trim()
      .min(3, "Project title must be at least 3 characters.")
      .max(140, "Project title must be 140 characters or fewer."),
    summary: z
      .string()
      .trim()
      .min(12, "Add a clear summary of the project (at least 12 characters).")
      .max(320, "Summary must be 320 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(5000, "Detailed description must be 5,000 characters or fewer.")
      .optional()
      .default(""),
    categorySlug: z
      .string()
      .trim()
      .min(2, "Select a project category.")
      .max(80),
    projectType: z.enum([
      "personal",
      "client_professional",
      "academic",
      "open_source",
      "collaborative",
      "volunteer",
      "research",
    ]),
    projectStatus: z.enum(["in_progress", "completed", "ongoing", "archived"]).default("completed"),
    startDate: optionalIsoDateSchema,
    completionDate: optionalIsoDateSchema,
    associatedOrganisation: z.string().trim().max(140).optional().default(""),
    isCollaborative: z.boolean().default(false),
    memberRole: z
      .string()
      .trim()
      .min(2, "Specify your role on this project.")
      .max(120, "Role must be 120 characters or fewer."),
    memberContribution: z
      .string()
      .trim()
      .max(1500, "Contribution details are too long.")
      .optional()
      .default(""),
    teamMembers: z.array(z.string().trim().min(1).max(80)).max(15).default([]),
    outcomes: z.array(z.string().trim().min(2).max(240)).max(10).default([]),
    achievements: z.array(z.string().trim().min(2).max(240)).max(10).default([]),
    toolsUsed: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    skillIds: z
      .array(z.string().uuid())
      .max(15)
      .default([])
      .transform((ids) => Array.from(new Set(ids))),
    projectUrl: optionalSafeUrlSchema,
    repositoryUrl: optionalSafeUrlSchema,
    visibilityScope: z.enum(["public", "connections", "private"]).default("public"),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.completionDate && data.completionDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["completionDate"],
        message: "Completion date cannot be earlier than start date.",
      });
    }
    if (data.isCollaborative && data.memberContribution.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["memberContribution"],
        message:
          "For collaborative projects, describe your specific contribution (at least 10 characters) so attribution is accurate.",
      });
    }
  });

export type PortfolioProjectInput = z.infer<typeof portfolioProjectInputSchema>;

export function parseContactLinks(raw: unknown): ContactLink[] {
  if (!Array.isArray(raw)) return [];
  const valid: ContactLink[] = [];
  for (const item of raw) {
    const parsed = contactLinkSchema.safeParse(item);
    if (parsed.success) {
      valid.push(parsed.data);
    }
  }
  return valid;
}
