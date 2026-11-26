import { describe, expect, it } from "vitest";
import { evaluateProfileCompleteness } from "@/modules/portfolio/completeness";
import {
  credentialInputSchema,
  deriveInitialCredentialStatus,
  educationInputSchema,
  experienceInputSchema,
  generateProjectSlug,
  handleSchema,
  isSafeHttpUrl,
  portfolioProjectInputSchema,
} from "@/modules/portfolio/schemas";

const SKILL_A = "11111111-1111-4111-8111-111111111111";
const SKILL_B = "22222222-2222-4222-8222-222222222222";

describe("M2.1–M2.4 profile, experience, education, credential & project validation", () => {
  it("enforces collision-safe handles and rejects reserved routes", () => {
    expect(handleSchema.safeParse("daniel-ojo").success).toBe(true);
    expect(handleSchema.safeParse("admin").success).toBe(false);
    expect(handleSchema.safeParse("settings").success).toBe(false);
    expect(handleSchema.safeParse("a").success).toBe(false);
    expect(handleSchema.safeParse("bad handle!").success).toBe(false);
  });

  it("rejects dangerous URL schemes while allowing https URLs", () => {
    expect(isSafeHttpUrl("https://dg-nexus.vercel.app")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("validates experience dates and current-role invariants", () => {
    const valid = experienceInputSchema.safeParse({
      organisationName: "DGConcept",
      roleTitle: "Product Designer",
      employmentType: "full_time",
      workArrangement: "remote",
      startDate: "2024-01-15",
      endDate: "",
      isCurrent: true,
      visibilityScope: "private",
    });
    expect(valid.success).toBe(true);

    const endBeforeStart = experienceInputSchema.safeParse({
      organisationName: "DGConcept",
      roleTitle: "Product Designer",
      employmentType: "full_time",
      workArrangement: "remote",
      startDate: "2025-06-01",
      endDate: "2024-01-01",
      isCurrent: false,
    });
    expect(endBeforeStart.success).toBe(false);

    const currentWithEndDate = experienceInputSchema.safeParse({
      organisationName: "DGConcept",
      roleTitle: "Product Designer",
      employmentType: "full_time",
      workArrangement: "hybrid",
      startDate: "2024-01-01",
      endDate: "2025-01-01",
      isCurrent: true,
    });
    expect(currentWithEndDate.success).toBe(false);
  });

  it("supports inclusive education pathways and enforces year bounds", () => {
    const bootcamp = educationInputSchema.safeParse({
      institution: "ALX Africa",
      qualification: "Software Engineering Programme",
      pathwayType: "bootcamp",
      startYear: 2023,
      endYear: 2024,
      isCurrent: false,
    });
    expect(bootcamp.success).toBe(true);

    const invalidYears = educationInputSchema.safeParse({
      institution: "Polytechnic",
      qualification: "HND",
      pathwayType: "diploma",
      startYear: 2025,
      endYear: 2022,
      isCurrent: false,
    });
    expect(invalidYears.success).toBe(false);
  });

  it("derives honest credential status and never allows self-verification", () => {
    expect(deriveInitialCredentialStatus({})).toBe("self_reported");
    expect(
      deriveInitialCredentialStatus({ verificationUrl: "https://credly.com/badges/123" })
    ).toBe("evidence_submitted");
    expect(deriveInitialCredentialStatus({ hasEvidenceFile: true })).toBe(
      "evidence_submitted"
    );
    expect(
      deriveInitialCredentialStatus({
        expiryDate: "2020-01-01",
        now: new Date("2026-11-26T00:00:00Z"),
      })
    ).toBe("expired");

    const parsed = credentialInputSchema.safeParse({
      name: "AWS SAA",
      issuingOrganisation: "Amazon Web Services",
      issueDate: "2025-02-01",
      expiryDate: "2028-02-01",
      verificationUrl: "https://aws.amazon.com/verify/123",
      skillIds: [SKILL_A],
    });
    expect(parsed.success).toBe(true);
  });

  it("enforces explicit contribution attribution on collaborative projects and deduplicates skillIds", () => {
    const missingContrib = portfolioProjectInputSchema.safeParse({
      title: "Flood Monitoring Web Application",
      summary: "Real-time flood telemetry and community alerting dashboard.",
      categorySlug: "software-development",
      projectType: "collaborative",
      isCollaborative: true,
      memberRole: "Frontend Lead",
      memberContribution: "",
      skillIds: [SKILL_A, SKILL_A, SKILL_B],
    });
    expect(missingContrib.success).toBe(false);

    const validCollab = portfolioProjectInputSchema.safeParse({
      title: "Flood Monitoring Web Application",
      summary: "Real-time flood telemetry and community alerting dashboard.",
      categorySlug: "software-development",
      projectType: "collaborative",
      isCollaborative: true,
      memberRole: "Frontend Lead",
      memberContribution: "Designed the responsive React UI and integrated live river sensor charts.",
      skillIds: [SKILL_A, SKILL_A, SKILL_B],
    });
    expect(validCollab.success).toBe(true);
    if (validCollab.success) {
      expect(validCollab.data.skillIds).toEqual([SKILL_A, SKILL_B]);
    }

    expect(generateProjectSlug("Flood Monitoring App!")).toBe("flood-monitoring-app");
  });

  it("evaluates transparent profile completeness and rejects placeholder text", () => {
    const placeholderReport = evaluateProfileCompleteness({
      fullName: "Daniel Ojo",
      countryCode: "NG",
      timezone: "Africa/Lagos",
      headline: "TBD",
      bio: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      skillCount: 1,
      experienceCount: 0,
      educationCount: 0,
      projectCount: 0,
      credentialCount: 0,
    });
    // Only identity passes (10%); placeholder headline/bio and <3 skills do not count
    expect(placeholderReport.score).toBe(10);
    expect(placeholderReport.disclaimer).toContain("not a score of professional competence");

    const fullReport = evaluateProfileCompleteness({
      fullName: "Daniel Ojo",
      countryCode: "NG",
      timezone: "Africa/Lagos",
      headline: "Product Designer & Visual Systems Developer",
      bio: "Multidisciplinary designer building accessible civic platforms and modular design systems.",
      skillCount: 5,
      experienceCount: 1,
      educationCount: 1,
      projectCount: 2,
      credentialCount: 1,
    });
    expect(fullReport.score).toBe(100);
    expect(fullReport.completedCount).toBe(7);
  });
});
