import type { SkillEvidenceStatus } from "@/lib/supabase/database.types";
import { getCountryName } from "@/modules/profiles/constants";

export interface OpportunitySkillRequirement {
  skillId: string;
  slug: string;
  name: string;
  category: string;
  requirementLevel: "required" | "preferred";
}

export interface MemberSkillSignal {
  skillId: string;
  slug: string;
  name: string;
  evidenceStatus: SkillEvidenceStatus;
  supportingProjectTitles: string[];
}

export interface MatchCandidateProfile {
  countryCode: string | null;
  interests: string[];
  workArrangement: string;
  skills: MemberSkillSignal[];
}

export interface MatchableOpportunity {
  id: string;
  eligibleCountries: string[];
  domainTags: string[];
  workArrangement: string;
  requiredSkills: OpportunitySkillRequirement[];
}

export interface MatchedSkillDetail {
  skillId: string;
  name: string;
  requirementLevel: "required" | "preferred";
  evidenceStatus: SkillEvidenceStatus;
  supportingProjectTitles: string[];
}

export interface OpportunityFitBreakdown {
  overallScore: number;
  eligibilityStatus: "eligible" | "open_globally" | "check_eligibility";
  eligibilityLabel: string;
  evidenceBackedMatches: MatchedSkillDetail[];
  selfReportedMatches: MatchedSkillDetail[];
  missingRequiredSkills: OpportunitySkillRequirement[];
  missingPreferredSkills: OpportunitySkillRequirement[];
  domainMatches: string[];
  reasons: string[];
  disclaimer: string;
}

const EVIDENCE_BACKED_STATUSES = new Set<SkillEvidenceStatus>([
  "portfolio_supported",
  "assessed",
  "mentor_reviewed",
  "credential_verified",
]);

/**
 * Deterministic, explainable readiness & skill-gap evaluator grounded strictly in the
 * member's structured M1/M2 profile & portfolio graph.
 *
 * Weighting:
 * - Required & preferred canonical skills (65%): Evidence-backed skills (L2+) earn full
 *   credit (1.0); Self-reported skills (L1) earn partial credit (0.7) to reward proof-of-work
 *   without unfairly excluding new members.
 * - Domain alignment (20%): Overlap between profile domains and opportunity domain tags.
 * - Location / country eligibility (15%): Open globally or matching ISO-3166 country code.
 *
 * NEVER makes an autonomous hiring rejection or claims authoritative screening.
 */
export function evaluateOpportunityFit(
  member: MatchCandidateProfile,
  opportunity: MatchableOpportunity
): OpportunityFitBreakdown {
  const memberSkillById = new Map(member.skills.map((s) => [s.skillId, s]));
  const evidenceBackedMatches: MatchedSkillDetail[] = [];
  const selfReportedMatches: MatchedSkillDetail[] = [];
  const missingRequiredSkills: OpportunitySkillRequirement[] = [];
  const missingPreferredSkills: OpportunitySkillRequirement[] = [];

  let earnedSkillWeight = 0;
  let totalSkillWeight = 0;

  for (const req of opportunity.requiredSkills) {
    const baseWeight = req.requirementLevel === "required" ? 2.0 : 1.0;
    totalSkillWeight += baseWeight;
    const match = memberSkillById.get(req.skillId);

    if (match) {
      const isEvidenceBacked = EVIDENCE_BACKED_STATUSES.has(match.evidenceStatus);
      earnedSkillWeight += baseWeight * (isEvidenceBacked ? 1.0 : 0.7);

      const detail: MatchedSkillDetail = {
        skillId: req.skillId,
        name: req.name,
        requirementLevel: req.requirementLevel,
        evidenceStatus: match.evidenceStatus,
        supportingProjectTitles: match.supportingProjectTitles,
      };
      if (isEvidenceBacked) {
        evidenceBackedMatches.push(detail);
      } else {
        selfReportedMatches.push(detail);
      }
    } else if (req.requirementLevel === "required") {
      missingRequiredSkills.push(req);
    } else {
      missingPreferredSkills.push(req);
    }
  }

  const skillScore =
    totalSkillWeight > 0 ? Math.round((earnedSkillWeight / totalSkillWeight) * 65) : 45;

  // Domain overlap (20 pts)
  const memberDomains = new Set(member.interests);
  const domainMatches = opportunity.domainTags.filter((tag) => memberDomains.has(tag));
  const domainScore =
    opportunity.domainTags.length > 0
      ? Math.round((domainMatches.length / opportunity.domainTags.length) * 20)
      : 10;

  // ISO-3166 country eligibility (15 pts)
  let eligibilityStatus: OpportunityFitBreakdown["eligibilityStatus"];
  let eligibilityLabel: string;
  let eligibilityScore = 0;

  const userCountry = member.countryCode?.toUpperCase() ?? null;
  if (opportunity.eligibleCountries.length === 0) {
    eligibilityStatus = "open_globally";
    eligibilityLabel = "Open globally";
    eligibilityScore = 15;
  } else if (
    userCountry &&
    opportunity.eligibleCountries.map((c) => c.toUpperCase()).includes(userCountry)
  ) {
    eligibilityStatus = "eligible";
    eligibilityLabel = `Eligible in ${getCountryName(userCountry)} (${userCountry})`;
    eligibilityScore = 15;
  } else {
    eligibilityStatus = "check_eligibility";
    eligibilityLabel = `Restricted to ${opportunity.eligibleCountries.join(", ")}`;
    eligibilityScore = 0;
  }

  const overallScore = Math.min(100, Math.max(0, skillScore + domainScore + eligibilityScore));

  const reasons: string[] = [];
  if (evidenceBackedMatches.length > 0) {
    reasons.push(
      `${evidenceBackedMatches.length} skill${evidenceBackedMatches.length === 1 ? "" : "s"} backed by your portfolio evidence (${evidenceBackedMatches
        .slice(0, 3)
        .map((s) => s.name)
        .join(", ")})`
    );
  }
  if (selfReportedMatches.length > 0) {
    reasons.push(
      `${selfReportedMatches.length} self-reported skill match${selfReportedMatches.length === 1 ? "" : "es"} — link a portfolio project to strengthen proof`
    );
  }
  if (missingRequiredSkills.length > 0) {
    reasons.push(
      `Missing required skill${missingRequiredSkills.length === 1 ? "" : "s"}: ${missingRequiredSkills
        .map((s) => s.name)
        .join(", ")}`
    );
  }
  if (domainMatches.length > 0) {
    reasons.push(`Matches ${domainMatches.length} of your focus domains`);
  }
  reasons.push(eligibilityLabel);

  return {
    overallScore,
    eligibilityStatus,
    eligibilityLabel,
    evidenceBackedMatches,
    selfReportedMatches,
    missingRequiredSkills,
    missingPreferredSkills,
    domainMatches,
    reasons,
    disclaimer:
      "Deterministic readiness estimate based strictly on your structured profile, canonical skills, and portfolio evidence — never an automated hiring or admission decision.",
  };
}
