import type {
  CredentialVerificationStatus,
  EducationPathwayType,
  EmploymentType,
  ProjectStatus,
  ProjectType,
  RecordVisibilityScope,
  RoleWorkArrangement,
  SkillEvidenceStatus,
  WorkArrangement,
} from "@/lib/supabase/database.types";

export const WORK_ARRANGEMENT_OPTIONS: readonly {
  value: WorkArrangement;
  label: string;
}[] = [
  { value: "flexible", label: "Flexible (Remote / Hybrid / Onsite)" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
] as const;

export const ROLE_WORK_ARRANGEMENT_OPTIONS: readonly {
  value: RoleWorkArrangement;
  label: string;
}[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
] as const;

export const EMPLOYMENT_TYPE_OPTIONS: readonly {
  value: EmploymentType;
  label: string;
}[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance / Consulting" },
  { value: "internship", label: "Internship" },
  { value: "fellowship", label: "Fellowship" },
  { value: "apprenticeship", label: "Apprenticeship" },
  { value: "volunteer", label: "Volunteer" },
  { value: "other", label: "Other" },
] as const;

export const EDUCATION_PATHWAY_OPTIONS: readonly {
  value: EducationPathwayType;
  label: string;
}[] = [
  { value: "degree", label: "University Degree" },
  { value: "diploma", label: "Diploma / HND / Associate" },
  { value: "bootcamp", label: "Technical / Design Bootcamp" },
  { value: "vocational", label: "Vocational / Trade Training" },
  { value: "professional_training", label: "Professional Training Programme" },
  { value: "certification_programme", label: "Structured Certification Pathway" },
  { value: "self_directed", label: "Structured Self-Directed Study" },
  { value: "other", label: "Other Learning Pathway" },
] as const;

export const PROJECT_TYPE_OPTIONS: readonly {
  value: ProjectType;
  label: string;
  description: string;
}[] = [
  { value: "personal", label: "Personal Project", description: "Self-initiated build or creative study" },
  { value: "client_professional", label: "Professional / Client", description: "Delivered for an employer or client" },
  { value: "collaborative", label: "Collaborative", description: "Built with peers or multidisciplinary team" },
  { value: "academic", label: "Academic / Thesis", description: "Coursework, capstone or university project" },
  { value: "open_source", label: "Open-Source Contribution", description: "Public code, design or documentation contribution" },
  { value: "research", label: "Research Study", description: "Applied, scientific or policy research output" },
  { value: "volunteer", label: "Community / Volunteer", description: "Pro-bono or civic impact initiative" },
] as const;

export const PROJECT_STATUS_OPTIONS: readonly {
  value: ProjectStatus;
  label: string;
}[] = [
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "ongoing", label: "Ongoing / Maintained" },
  { value: "archived", label: "Archived" },
] as const;

export const RECORD_VISIBILITY_OPTIONS: readonly {
  value: RecordVisibilityScope;
  label: string;
  hint: string;
}[] = [
  {
    value: "public",
    label: "Public",
    hint: "Visible on your public profile when your overall profile is Public.",
  },
  {
    value: "connections",
    label: "Connections",
    hint: "Fails closed to owner-only until the Connections graph launches in M5.",
  },
  {
    value: "private",
    label: "Private",
    hint: "Visible strictly to you.",
  },
] as const;

export const SKILL_EVIDENCE_META: Record<
  SkillEvidenceStatus,
  {
    level: 1 | 2 | 3 | 4 | 5;
    label: string;
    shortLabel: string;
    description: string;
    badgeVariant: "default" | "primary" | "warning" | "verified";
  }
> = {
  self_reported: {
    level: 1,
    label: "Self-Reported",
    shortLabel: "Self-Reported",
    description: "Declared by the member without linked portfolio work yet.",
    badgeVariant: "default",
  },
  portfolio_supported: {
    level: 2,
    label: "Portfolio-Supported",
    shortLabel: "Portfolio-Supported",
    description: "Backed by one or more documented portfolio projects (not independently assessed).",
    badgeVariant: "primary",
  },
  assessed: {
    level: 3,
    label: "Assessed",
    shortLabel: "Assessed",
    description: "Evaluated through a defined competency assessment.",
    badgeVariant: "warning",
  },
  mentor_reviewed: {
    level: 4,
    label: "Mentor-Reviewed",
    shortLabel: "Mentor-Reviewed",
    description: "Reviewed by a qualified domain mentor or practitioner.",
    badgeVariant: "warning",
  },
  credential_verified: {
    level: 5,
    label: "Credential-Verified",
    shortLabel: "Verified",
    description: "Verified against an authoritative issuing body or credential check.",
    badgeVariant: "verified",
  },
};

export const CREDENTIAL_STATUS_META: Record<
  CredentialVerificationStatus,
  {
    label: string;
    description: string;
    badgeVariant: "default" | "primary" | "warning" | "verified" | "danger";
  }
> = {
  self_reported: {
    label: "Self-Reported",
    description: "Entered by member; no supporting evidence attached yet.",
    badgeVariant: "default",
  },
  evidence_submitted: {
    label: "Evidence Submitted",
    description: "Supporting certificate or verification URL provided; not yet independently verified.",
    badgeVariant: "primary",
  },
  under_review: {
    label: "Under Review",
    description: "Queued for authorised verification review.",
    badgeVariant: "warning",
  },
  verified: {
    label: "Verified",
    description: "Independently verified against an authoritative issuer.",
    badgeVariant: "verified",
  },
  rejected: {
    label: "Not Verified",
    description: "Submitted evidence could not be verified.",
    badgeVariant: "danger",
  },
  expired: {
    label: "Expired",
    description: "Credential validity window has elapsed.",
    badgeVariant: "danger",
  },
};

export const CONTACT_LINK_KINDS = [
  { value: "portfolio", label: "Portfolio / Website" },
  { value: "github", label: "GitHub" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "behance", label: "Behance / Dribbble" },
  { value: "scholar", label: "Google Scholar / ORCID" },
  { value: "other", label: "Other Professional Link" },
] as const;

export const EVIDENCE_STORAGE_BUCKET = "portfolio-evidence";

export const ALLOWED_EVIDENCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_IMAGE_EVIDENCE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PDF_EVIDENCE_BYTES = 10 * 1024 * 1024; // 10 MB

export const RESERVED_PROFILE_HANDLES = new Set([
  "admin",
  "api",
  "auth",
  "dev",
  "dg-nexus",
  "dgnexus",
  "dgconcept",
  "home",
  "login",
  "network",
  "notifications",
  "onboarding",
  "opportunities",
  "portfolio",
  "privacy",
  "profile",
  "public",
  "settings",
  "signin",
  "signup",
  "support",
  "terms",
  "u",
]);
