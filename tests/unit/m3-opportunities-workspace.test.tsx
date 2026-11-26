import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OpportunitiesWorkspace } from "@/components/opportunities/opportunities-workspace";
import type { OpportunityWorkspaceBundle } from "@/modules/opportunities/repo";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

const MOCK_BUNDLE: OpportunityWorkspaceBundle = {
  timezone: "Africa/Lagos",
  countryCode: "NG",
  savedCount: 1,
  applicationCount: 1,
  items: [
    {
      opportunity: {
        id: "11111111-1111-4111-8111-111111111111",
        slug: "civic-climate-ux-fellowship",
        organisation_id: null,
        organisation_name: "African Civic Tech Network",
        opportunity_type: "fellowship",
        title: "Civic Tech & Climate UI/UX Fellowship",
        summary: "Six-month remote fellowship for accessible climate tools.",
        description: "Full description",
        domain_tags: ["design", "climate"],
        work_arrangement: "remote",
        location_label: "Remote · Africa",
        eligible_countries: ["NG", "GH"],
        compensation_type: "stipend",
        compensation_min: 1800,
        compensation_max: 2400,
        currency_code: "USD",
        experience_level: "early_career",
        eligibility_criteria: ["Portfolio required"],
        application_url: "https://example.org/apply",
        application_method: "external_link",
        deadline_at: "2026-12-15T23:59:00Z",
        is_rolling: false,
        verification_status: "curated",
        publication_status: "published",
        created_by: null,
        created_at: "2026-11-26T10:00:00Z",
        updated_at: "2026-11-26T10:00:00Z",
        requiredSkills: [
          {
            skillId: "s-1",
            slug: "figma",
            name: "Figma",
            category: "Design",
            requirementLevel: "required",
          },
        ],
      },
      fit: {
        overallScore: 92,
        eligibilityStatus: "eligible",
        eligibilityLabel: "Eligible in Nigeria (NG)",
        evidenceBackedMatches: [
          {
            skillId: "s-1",
            name: "Figma",
            requirementLevel: "required",
            evidenceStatus: "portfolio_supported",
            supportingProjectTitles: ["Lokoja FloodWatch"],
          },
        ],
        selfReportedMatches: [],
        missingRequiredSkills: [],
        missingPreferredSkills: [],
        domainMatches: ["design", "climate"],
        reasons: ["1 skill backed by your portfolio evidence (Figma)"],
        disclaimer: "Deterministic readiness estimate — never an automated hiring decision.",
      },
      bookmark: {
        id: "bm-1",
        user_id: "u-1",
        opportunity_id: "11111111-1111-4111-8111-111111111111",
        notes: "",
        created_at: "2026-11-26T12:00:00Z",
      },
      application: {
        id: "app-1",
        user_id: "u-1",
        opportunity_id: "11111111-1111-4111-8111-111111111111",
        status: "preparing",
        personal_notes: "Highlighting Lokoja FloodWatch case study",
        external_reference: "",
        submitted_at: null,
        next_reminder_at: "2026-12-10T09:00:00Z",
        fit_snapshot: {},
        created_at: "2026-11-26T12:05:00Z",
        updated_at: "2026-11-26T12:05:00Z",
      },
    },
    {
      opportunity: {
        id: "22222222-2222-4222-8222-222222222222",
        slug: "uk-only-research-grant",
        organisation_id: null,
        organisation_name: "UK Research Council",
        opportunity_type: "grant",
        title: "UK-Only Domestic Research Grant",
        summary: "Domestic grant restricted to UK residents.",
        description: "",
        domain_tags: ["research"],
        work_arrangement: "onsite",
        location_label: "London, UK",
        eligible_countries: ["GB"],
        compensation_type: "grant_award",
        compensation_min: 10000,
        compensation_max: 20000,
        currency_code: "GBP",
        experience_level: "any",
        eligibility_criteria: [],
        application_url: "https://example.org/uk",
        application_method: "external_link",
        deadline_at: "2026-12-20T23:59:00Z",
        is_rolling: false,
        verification_status: "curated",
        publication_status: "published",
        created_by: null,
        created_at: "2026-11-26T09:00:00Z",
        updated_at: "2026-11-26T09:00:00Z",
        requiredSkills: [],
      },
      fit: {
        overallScore: 45,
        eligibilityStatus: "check_eligibility",
        eligibilityLabel: "Restricted to GB",
        evidenceBackedMatches: [],
        selfReportedMatches: [],
        missingRequiredSkills: [],
        missingPreferredSkills: [],
        domainMatches: [],
        reasons: ["Restricted to GB"],
        disclaimer: "Deterministic readiness estimate — never an automated hiring decision.",
      },
      bookmark: null,
      application: null,
    },
  ],
};

describe("M3 Verified Global Opportunities Workspace UI", () => {
  it("renders explainable readiness scores, filters by eligibility, and switches across Saved & Applications tabs", () => {
    render(<OpportunitiesWorkspace bundle={MOCK_BUNDLE} />);

    expect(screen.getByText("Civic Tech & Climate UI/UX Fellowship")).toBeTruthy();
    expect(screen.getByText("UK-Only Domestic Research Grant")).toBeTruthy();
    expect(screen.getByText("92% Readiness")).toBeTruthy();

    // Filter to eligible-for-my-location only
    fireEvent.click(screen.getByLabelText(/Eligible for my location only/i));
    expect(screen.getByText("Civic Tech & Climate UI/UX Fellowship")).toBeTruthy();
    expect(screen.queryByText("UK-Only Domestic Research Grant")).toBeNull();

    // Switch to My Applications tab
    fireEvent.click(screen.getByRole("tab", { name: /My Applications/i }));
    expect(screen.getByText("Highlighting Lokoja FloodWatch case study")).toBeTruthy();
  });
});
