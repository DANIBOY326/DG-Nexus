import {
  getOwnProfileWithSkills,
  type ProfileWithSkills,
} from "@/modules/profiles/repo";

export interface AuthorisedAiContextPayload {
  headline: string;
  countryCode: string | null;
  interests: string[];
  careerGoals: string[];
  careerGoalSummary: string;
  availabilityStatus: string;
  skills: Array<{
    name: string;
    category: string;
    proficiencyLevel: string;
    evidenceStatus: string;
  }>;
}

export type AiContextAccessResult =
  | {
      allowed: true;
      reason: "CONSENT_GRANTED";
      context: AuthorisedAiContextPayload;
    }
  | {
      allowed: false;
      reason: "PROFILE_NOT_FOUND" | "AI_CONTEXT_CONSENT_REQUIRED";
      context: null;
    };

/**
 * Pure server-side consent gate enforcing that NO downstream Nexus AI service
 * receives personal profile, skills, or goals context unless `ai_context_consent === true`.
 * Notice direct PII (email, full name, city, handles) is intentionally excluded even when opted in.
 */
export function evaluateAiContextAccess(
  record: ProfileWithSkills | null
): AiContextAccessResult {
  if (!record) {
    return {
      allowed: false,
      reason: "PROFILE_NOT_FOUND",
      context: null,
    };
  }

  if (!record.profile.ai_context_consent) {
    return {
      allowed: false,
      reason: "AI_CONTEXT_CONSENT_REQUIRED",
      context: null,
    };
  }

  return {
    allowed: true,
    reason: "CONSENT_GRANTED",
    context: {
      headline: record.profile.headline,
      countryCode: record.profile.country_code,
      interests: record.profile.interests,
      careerGoals: record.profile.career_goals,
      careerGoalSummary: record.profile.career_goal,
      availabilityStatus: record.profile.availability_status,
      skills: record.skills.map((skill) => ({
        name: skill.name,
        category: skill.category,
        proficiencyLevel: skill.proficiencyLevel,
        evidenceStatus: skill.evidenceStatus,
      })),
    },
  };
}

/**
 * Single server-side entry point for all Nexus AI services to request member context.
 */
export async function getAuthorisedAiProfileContext(
  userId: string
): Promise<AiContextAccessResult> {
  const record = await getOwnProfileWithSkills(userId);
  return evaluateAiContextAccess(record);
}
