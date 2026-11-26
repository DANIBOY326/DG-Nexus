import { describe, expect, it } from "vitest";
import {
  formatDeadlineInTimeZone,
  formatOpportunityCompensation,
} from "@/modules/opportunities/constants";
import { evaluateOpportunityFit } from "@/modules/opportunities/matching";
import { upsertApplicationSchema } from "@/modules/opportunities/schemas";
import { buildPersonalDataExportPayload } from "@/modules/profiles/export";

const SKILL_FIGMA = "11111111-1111-4111-8111-111111111111";
const SKILL_NEXT = "22222222-2222-4222-8222-222222222222";
const SKILL_GIS = "33333333-3333-4333-8333-333333333333";

describe("M3 deterministic fit matching, global formatting & application schemas", () => {
  it("rewards portfolio-supported (L2+) skills higher than self-reported (L1) skills and identifies missing gaps", () => {
    const opp = {
      id: "opp-1",
      eligibleCountries: ["NG", "GH"],
      domainTags: ["design", "climate"],
      workArrangement: "remote",
      requiredSkills: [
        {
          skillId: SKILL_FIGMA,
          slug: "figma",
          name: "Figma",
          category: "Design",
          requirementLevel: "required" as const,
        },
        {
          skillId: SKILL_NEXT,
          slug: "nextjs",
          name: "Next.js",
          category: "Technology",
          requirementLevel: "required" as const,
        },
        {
          skillId: SKILL_GIS,
          slug: "environmental-data-gis",
          name: "Environmental Data & GIS",
          category: "Climate",
          requirementLevel: "preferred" as const,
        },
      ],
    };

    const withEvidence = evaluateOpportunityFit(
      {
        countryCode: "NG",
        interests: ["design", "climate"],
        workArrangement: "remote",
        skills: [
          {
            skillId: SKILL_FIGMA,
            slug: "figma",
            name: "Figma",
            evidenceStatus: "portfolio_supported",
            supportingProjectTitles: ["Lokoja FloodWatch"],
          },
          {
            skillId: SKILL_NEXT,
            slug: "nextjs",
            name: "Next.js",
            evidenceStatus: "self_reported",
            supportingProjectTitles: [],
          },
        ],
      },
      opp
    );

    const selfReportedOnly = evaluateOpportunityFit(
      {
        countryCode: "NG",
        interests: ["design", "climate"],
        workArrangement: "remote",
        skills: [
          {
            skillId: SKILL_FIGMA,
            slug: "figma",
            name: "Figma",
            evidenceStatus: "self_reported",
            supportingProjectTitles: [],
          },
          {
            skillId: SKILL_NEXT,
            slug: "nextjs",
            name: "Next.js",
            evidenceStatus: "self_reported",
            supportingProjectTitles: [],
          },
        ],
      },
      opp
    );

    expect(withEvidence.eligibilityStatus).toBe("eligible");
    expect(withEvidence.evidenceBackedMatches).toHaveLength(1);
    expect(withEvidence.selfReportedMatches).toHaveLength(1);
    expect(withEvidence.missingPreferredSkills).toHaveLength(1);
    expect(withEvidence.overallScore).toBeGreaterThan(selfReportedOnly.overallScore);
    expect(withEvidence.disclaimer).toContain("never an automated hiring");
  });

  it("flags restricted ISO-3166 country eligibility transparently", () => {
    const restricted = evaluateOpportunityFit(
      {
        countryCode: "US",
        interests: ["technology"],
        workArrangement: "remote",
        skills: [],
      },
      {
        id: "opp-ng",
        eligibleCountries: ["NG"],
        domainTags: ["technology"],
        workArrangement: "hybrid",
        requiredSkills: [],
      }
    );

    expect(restricted.eligibilityStatus).toBe("check_eligibility");
    expect(restricted.eligibilityLabel).toContain("NG");
  });

  it("formats ISO-4217 compensations and IANA time-zone deadline urgencies cleanly", () => {
    const usd = formatOpportunityCompensation({
      type: "stipend",
      min: 1800,
      max: 2400,
      currencyCode: "USD",
    });
    expect(usd).toContain("1,800");
    expect(usd).toContain("/ mo");

    const now = new Date("2026-11-26T12:00:00Z");
    const urgent = formatDeadlineInTimeZone(
      "2026-11-30T17:00:00Z",
      false,
      "Africa/Lagos",
      now
    );
    expect(urgent.urgency).toBe("urgent");
    expect(urgent.daysRemaining).toBe(5);

    const rolling = formatDeadlineInTimeZone(null, true, "Africa/Lagos", now);
    expect(rolling.urgency).toBe("rolling");
  });

  it("validates application tracker inputs and exports bookmarks & applications in v3.0.0-m3", () => {
    expect(
      upsertApplicationSchema.safeParse({
        opportunityId: "11111111-1111-4111-8111-111111111111",
        status: "submitted",
        personalNotes: "Attached Lokoja FloodWatch case study.",
        externalReference: "APP-2027-01",
        nextReminderDate: "2026-12-05",
      }).success
    ).toBe(true);

    expect(
      upsertApplicationSchema.safeParse({
        opportunityId: "11111111-1111-4111-8111-111111111111",
        status: "submitted",
        nextReminderDate: "invalid-date",
      }).success
    ).toBe(false);

    const exported = buildPersonalDataExportPayload({
      account: {
        userId: "u-1",
        email: "daniel@example.com",
        authProvider: "google",
        emailConfirmedAt: null,
        accountCreatedAt: null,
      },
      profile: null,
      skills: [],
      opportunityBookmarks: [
        {
          id: "bm-1",
          opportunity_id: "opp-1",
          opportunity_title: "Civic Tech Fellowship",
          organisation_name: "African Civic Tech",
          notes: "Great match",
          saved_at: "2026-11-26T14:00:00Z",
        },
      ],
      opportunityApplications: [
        {
          id: "app-1",
          opportunity_id: "opp-1",
          opportunity_title: "Civic Tech Fellowship",
          organisation_name: "African Civic Tech",
          status: "preparing",
          personal_notes: "Drafting cover note",
          external_reference: "",
          submitted_at: null,
          next_reminder_at: "2026-12-01T09:00:00Z",
          updated_at: "2026-11-26T14:05:00Z",
        },
      ],
      organisations: [],
      consentLogs: [],
    });

    expect(exported.export_metadata.schema_version).toBe("3.0.0-m3");
    expect(exported.opportunity_bookmarks).toHaveLength(1);
    expect(exported.opportunity_applications).toHaveLength(1);
    expect(
      exported.unavailable_categories.some(
        (c) => c.category === "opportunity_bookmarks_and_applications"
      )
    ).toBe(false);
  });
});
