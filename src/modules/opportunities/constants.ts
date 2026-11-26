import type {
  ApplicationStatus,
  CompensationType,
  ExperienceLevel,
  OpportunityType,
  OpportunityVerificationStatus,
  OpportunityWorkArrangement,
} from "@/lib/supabase/database.types";

export const OPPORTUNITY_TYPE_OPTIONS: readonly {
  value: OpportunityType;
  label: string;
}[] = [
  { value: "job", label: "Job" },
  { value: "internship", label: "Internship" },
  { value: "scholarship", label: "Scholarship" },
  { value: "fellowship", label: "Fellowship" },
  { value: "grant", label: "Grant" },
  { value: "hackathon", label: "Hackathon" },
  { value: "accelerator", label: "Accelerator" },
  { value: "competition", label: "Competition" },
  { value: "volunteer", label: "Volunteer" },
] as const;

export const OPPORTUNITY_WORK_ARRANGEMENT_OPTIONS: readonly {
  value: OpportunityWorkArrangement;
  label: string;
}[] = [
  { value: "remote", label: "Remote" },
  { value: "global_online", label: "Global Online" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
] as const;

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: "Entry Level",
  early_career: "Early Career",
  mid_level: "Mid-Level",
  senior: "Senior / Lead",
  any: "All Experience Levels",
};

export const OPPORTUNITY_VERIFICATION_META: Record<
  OpportunityVerificationStatus,
  {
    label: string;
    description: string;
    badgeVariant: "default" | "primary" | "verified";
  }
> = {
  partner_verified: {
    label: "Partner Verified",
    description: "Published directly by a domain-verified or officially verified DG NEXUS partner organisation.",
    badgeVariant: "verified",
  },
  curated: {
    label: "Curated Listing",
    description: "Reviewed and structured for the DG NEXUS launch catalogue. Always verify final terms on the official host site.",
    badgeVariant: "primary",
  },
  unverified: {
    label: "Unverified Submission",
    description: "Community or draft posting not yet verified by DG NEXUS.",
    badgeVariant: "default",
  },
};

export const APPLICATION_STATUS_OPTIONS: readonly {
  value: ApplicationStatus;
  label: string;
  badgeVariant: "default" | "primary" | "warning" | "verified" | "danger";
}[] = [
  { value: "saved", label: "Saved to Track", badgeVariant: "default" },
  { value: "preparing", label: "Preparing Application", badgeVariant: "primary" },
  { value: "submitted", label: "Submitted", badgeVariant: "primary" },
  { value: "interviewing", label: "Interviewing / Shortlisted", badgeVariant: "warning" },
  { value: "offer", label: "Offer / Award Received", badgeVariant: "verified" },
  { value: "accepted", label: "Accepted", badgeVariant: "verified" },
  { value: "rejected", label: "Not Selected", badgeVariant: "danger" },
  { value: "withdrawn", label: "Withdrawn", badgeVariant: "default" },
] as const;

export const COMPENSATION_TYPE_LABELS: Record<CompensationType, string> = {
  salary: "Annual Salary",
  stipend: "Monthly Stipend",
  grant_award: "Grant / Award",
  tuition_funding: "Scholarship Funding",
  equity: "Equity",
  unpaid: "Unpaid",
  unspecified: "Compensation Unspecified",
};

/**
 * Formats ISO-4217 compensation ranges cleanly for international readers (TDR-001).
 */
export function formatOpportunityCompensation(input: {
  type: CompensationType;
  min: number | null;
  max: number | null;
  currencyCode: string | null;
}): string {
  if (input.type === "unpaid") return "Unpaid";
  if (input.min === null && input.max === null) {
    return COMPENSATION_TYPE_LABELS[input.type];
  }
  const currency = input.currencyCode && /^[A-Z]{3}$/.test(input.currencyCode)
    ? input.currencyCode
    : "USD";

  const fmt = (amount: number) => {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString("en-GB")}`;
    }
  };

  const range =
    input.min !== null && input.max !== null
      ? `${fmt(input.min)} – ${fmt(input.max)}`
      : input.min !== null
        ? `From ${fmt(input.min)}`
        : `Up to ${fmt(input.max!)}`;

  const suffix =
    input.type === "stipend"
      ? " / mo"
      : input.type === "salary"
        ? " / yr"
        : "";

  return `${range}${suffix}`;
}

export interface DeadlineDisplay {
  label: string;
  formattedLocal: string;
  urgency: "closed" | "urgent" | "soon" | "normal" | "rolling";
  daysRemaining: number | null;
}

/**
 * Formats UTC deadline into the member's IANA time zone with transparent urgency state.
 */
export function formatDeadlineInTimeZone(
  deadlineAt: string | null,
  isRolling: boolean,
  timezone: string,
  now: Date = new Date()
): DeadlineDisplay {
  if (isRolling || !deadlineAt) {
    return {
      label: isRolling ? "Rolling applications" : "No fixed deadline",
      formattedLocal: isRolling ? "Open on a rolling basis" : "Check host listing",
      urgency: "rolling",
      daysRemaining: null,
    };
  }

  const deadlineDate = new Date(deadlineAt);
  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      label: "Check listing",
      formattedLocal: deadlineAt,
      urgency: "normal",
      daysRemaining: null,
    };
  }

  let formattedLocal: string;
  try {
    formattedLocal = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone || "UTC",
    }).format(deadlineDate);
  } catch {
    formattedLocal = deadlineDate.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  }

  const diffMs = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    return {
      label: "Closed",
      formattedLocal,
      urgency: "closed",
      daysRemaining: 0,
    };
  }
  if (daysRemaining <= 7) {
    return {
      label: daysRemaining === 1 ? "Closes tomorrow" : `Closes in ${daysRemaining} days`,
      formattedLocal,
      urgency: "urgent",
      daysRemaining,
    };
  }
  if (daysRemaining <= 14) {
    return {
      label: `Closes in ${daysRemaining} days`,
      formattedLocal,
      urgency: "soon",
      daysRemaining,
    };
  }
  return {
    label: `${daysRemaining} days left`,
    formattedLocal,
    urgency: "normal",
    daysRemaining,
  };
}
