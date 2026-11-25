import type { AvailabilityStatus, SkillProficiency } from "@/lib/supabase/database.types";

export const AI_CONSENT_POLICY_VERSION = "2026-11-ai-v1";
export const PRIVACY_POLICY_VERSION = "2026-11-v1";

export interface CountryOption {
  code: string; // ISO-3166-1 alpha-2
  name: string;
}

/**
 * Standardised ISO-3166-1 alpha-2 country list for global-first onboarding (TDR-001).
 */
export const ISO_COUNTRIES: readonly CountryOption[] = [
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "KE", name: "Kenya" },
  { code: "MY", name: "Malaysia" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "NA", name: "Namibia" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RW", name: "Rwanda" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
] as const;

const COUNTRY_CODE_SET = new Set(ISO_COUNTRIES.map((c) => c.code));

export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code) && COUNTRY_CODE_SET.has(code);
}

export function getCountryName(code: string | null | undefined): string {
  if (!code) return "Not set";
  return ISO_COUNTRIES.find((c) => c.code === code.toUpperCase())?.name ?? code;
}

const FALLBACK_IANA_TIMEZONES = [
  "UTC",
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Kigali",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Amsterdam",
  "Europe/Dublin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export function getSupportedTimeZones(): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
    try {
      const supported = Intl.supportedValuesOf("timeZone");
      if (supported.length > 0) {
        return supported.includes("UTC") ? supported : ["UTC", ...supported];
      }
    } catch {
      // Fallback below
    }
  }
  return [...FALLBACK_IANA_TIMEZONES];
}

export function isValidIanaTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64) return false;
  if (tz === "UTC") return true;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export interface DomainInterestOption {
  slug: string;
  label: string;
  description: string;
}

/**
 * Maintainable, extensible domain/interest taxonomy (Flowstep Screen 7 + M1 spec).
 */
export const DOMAIN_INTERESTS: readonly DomainInterestOption[] = [
  {
    slug: "technology",
    label: "Technology",
    description: "Software engineering, cloud, mobile, data & systems.",
  },
  {
    slug: "artificial-intelligence",
    label: "Artificial Intelligence",
    description: "Machine learning, LLMs, data science & responsible AI.",
  },
  {
    slug: "design",
    label: "Design",
    description: "Product design, UX research, brand & design systems.",
  },
  {
    slug: "business",
    label: "Business",
    description: "Strategy, product management, operations & ventures.",
  },
  {
    slug: "research",
    label: "Research",
    description: "Academic research, fellowships, grants & publications.",
  },
  {
    slug: "climate",
    label: "Climate",
    description: "Climate tech, clean energy, ESG & sustainable impact.",
  },
  {
    slug: "finance-fintech",
    label: "Finance & FinTech",
    description: "Digital payments, financial modelling & capital markets.",
  },
  {
    slug: "healthcare-biotech",
    label: "Healthcare & Biotech",
    description: "Digital health, bioinformatics & public health innovation.",
  },
  {
    slug: "education-edtech",
    label: "Education & EdTech",
    description: "Learning design, workforce upskilling & academic tech.",
  },
  {
    slug: "policy-governance",
    label: "Policy & Governance",
    description: "Public policy, regulation, civic tech & NGO leadership.",
  },
] as const;

export const DOMAIN_INTEREST_SLUGS = new Set(DOMAIN_INTERESTS.map((d) => d.slug));

export interface CareerGoalOption {
  slug: string;
  label: string;
  description: string;
}

/**
 * Career goals aligned with Flowstep Screen 9 ("What do you want to achieve?").
 */
export const CAREER_GOALS: readonly CareerGoalOption[] = [
  {
    slug: "discover-opportunities",
    label: "Find Verified Opportunities",
    description: "Discover jobs, internships, scholarships, fellowships & grants.",
  },
  {
    slug: "close-skill-gaps",
    label: "Learn New Skills",
    description: "Identify missing competencies and follow structured pathways.",
  },
  {
    slug: "find-mentorship",
    label: "Get Mentored",
    description: "Connect with experienced practitioners for career guidance.",
  },
  {
    slug: "build-portfolio",
    label: "Build Proof-of-Work Portfolio",
    description: "Showcase tangible projects and verifiable achievements.",
  },
  {
    slug: "find-collaborators",
    label: "Find Collaborators",
    description: "Meet complementary peers for hackathons, research or ventures.",
  },
  {
    slug: "advance-leadership",
    label: "Advance to Senior / Leadership Roles",
    description: "Benchmark readiness for higher-impact international roles.",
  },
] as const;

export const CAREER_GOAL_SLUGS = new Set(CAREER_GOALS.map((g) => g.slug));

export const AVAILABILITY_OPTIONS: readonly {
  value: AvailabilityStatus;
  label: string;
  description: string;
}[] = [
  {
    value: "actively_looking",
    label: "Actively looking",
    description: "Ready for new roles, internships, fellowships or contracts now.",
  },
  {
    value: "open_to_opportunities",
    label: "Open to opportunities",
    description: "Not urgently searching, but open to strong verified matches.",
  },
  {
    value: "collaborating",
    label: "Open to collaboration",
    description: "Interested in projects, research teams, hackathons or advisory.",
  },
  {
    value: "mentoring",
    label: "Available to mentor",
    description: "Willing to guide early-career talent and peer builders.",
  },
  {
    value: "unavailable",
    label: "Not currently available",
    description: "Focused on current commitments; hide active-search signals.",
  },
] as const;

export const SKILL_PROFICIENCY_OPTIONS: readonly {
  value: SkillProficiency;
  label: string;
}[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
] as const;

export type M1VisibilityOption = "public" | "connections" | "private";

export const VISIBILITY_OPTIONS: readonly {
  value: M1VisibilityOption;
  label: string;
  summary: string;
  enforcementDetail: string;
}[] = [
  {
    value: "public",
    label: "Public",
    summary: "Discoverable across DG NEXUS and public profile links.",
    enforcementDetail:
      "Your headline, bio, country, interests, and skills can be viewed by members and public visitors. Your email, settings, and consent history remain private.",
  },
  {
    value: "connections",
    label: "Connections",
    summary: "Visible to your accepted connections only.",
    enforcementDetail:
      "Hidden from public visitors and non-connected members via PostgreSQL RLS. Until the Connections network launches in Milestone M5, only you can view this profile.",
  },
  {
    value: "private",
    label: "Private",
    summary: "Visible strictly to you.",
    enforcementDetail:
      "Completely hidden from public discovery, search, and other members at the database RLS level. Only your authenticated session can read your profile and skills.",
  },
] as const;
