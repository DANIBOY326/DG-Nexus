import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProfileWorkspace } from "@/components/profile/profile-workspace";
import { evaluateProfileCompleteness } from "@/modules/portfolio/completeness";
import type { MemberPortfolioBundle } from "@/modules/portfolio/repo";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

const MOCK_BUNDLE: MemberPortfolioBundle = {
  profile: {
    user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    handle: "daniel-ojo",
    full_name: "Daniel Temitope Ojo",
    headline: "Creative Designer & Visual Systems Developer",
    bio: "Building human-centred interfaces and evidence-backed design systems across global web applications.",
    current_focus: "Civic & Enterprise Design Systems",
    work_arrangement: "remote",
    achievements: ["Designed DG NEXUS Design System"],
    contact_links: [{ kind: "portfolio", label: "Portfolio", url: "https://dgconcept.example" }],
    allow_search_indexing: false,
    avatar_url: null,
    country_code: "NG",
    city: "Lokoja",
    timezone: "Africa/Lagos",
    interests: ["design", "technology"],
    career_goals: ["build-portfolio"],
    career_goal: "Build verified proof-of-work",
    availability_status: "actively_looking",
    visibility_scope: "public",
    ai_context_consent: false,
    profile_completion_score: 70,
    onboarding_step: 4,
    onboarding_completed_at: "2026-11-26T09:00:00Z",
    created_at: "2026-11-26T08:00:00Z",
    updated_at: "2026-11-26T09:00:00Z",
  },
  contactLinks: [{ kind: "portfolio", label: "Portfolio", url: "https://dgconcept.example" }],
  avatarEvidenceFile: null,
  skills: [
    {
      skillId: "11111111-1111-4111-8111-111111111111",
      slug: "figma",
      name: "Figma",
      category: "Design",
      proficiencyLevel: "advanced",
      evidenceStatus: "portfolio_supported",
      createdAt: "2026-11-26T08:30:00Z",
      supportingProjects: [
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          slug: "flood-monitoring-app",
          title: "Flood Monitoring Web Application",
          visibilityScope: "public",
        },
      ],
    },
    {
      skillId: "22222222-2222-4222-8222-222222222222",
      slug: "typescript",
      name: "TypeScript",
      category: "Technology",
      proficiencyLevel: "intermediate",
      evidenceStatus: "self_reported",
      createdAt: "2026-11-26T08:31:00Z",
      supportingProjects: [],
    },
  ],
  experiences: [],
  educations: [],
  credentials: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Google UX Design Certificate",
      issuing_organisation: "Coursera / Google",
      issue_date: "2025-05-01",
      expiry_date: null,
      credential_id_code: "UX-2025-11",
      verification_url: "https://coursera.org/verify/ux-2025",
      verification_status: "evidence_submitted",
      visibility_scope: "public",
      created_at: "2026-11-26T09:00:00Z",
      updated_at: "2026-11-26T09:00:00Z",
      skills: [],
      evidenceFiles: [],
    },
  ],
  projects: [
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      slug: "flood-monitoring-app",
      title: "Flood Monitoring Web Application",
      summary: "Community flood alert dashboard with live river telemetry.",
      description: "Detailed case study.",
      category_slug: "ui-ux-design",
      categoryName: "UI/UX Design",
      project_type: "collaborative",
      project_status: "completed",
      start_date: "2025-01-01",
      completion_date: "2025-06-01",
      associated_organisation: "Civic Resilience Lab",
      is_collaborative: true,
      member_role: "Lead UI/UX Designer",
      member_contribution: "Designed all alert views and component tokens.",
      team_members: ["Ada Nwosu"],
      outcomes: ["Faster community alert response"],
      achievements: ["Regional civic design finalist"],
      tools_used: ["Figma", "Next.js"],
      project_url: "https://example.com/flood",
      repository_url: null,
      visibility_scope: "public",
      display_order: 0,
      created_at: "2026-11-26T09:00:00Z",
      updated_at: "2026-11-26T09:00:00Z",
      skills: [
        {
          skillId: "11111111-1111-4111-8111-111111111111",
          slug: "figma",
          name: "Figma",
          category: "Design",
        },
      ],
      evidenceFiles: [],
    },
  ],
  completeness: evaluateProfileCompleteness({
    fullName: "Daniel Temitope Ojo",
    countryCode: "NG",
    timezone: "Africa/Lagos",
    headline: "Creative Designer & Visual Systems Developer",
    bio: "Building human-centred interfaces and evidence-backed design systems across global web applications.",
    skillCount: 2,
    experienceCount: 0,
    educationCount: 0,
    projectCount: 1,
    credentialCount: 1,
  }),
};

describe("M2 Proof-of-Work Profile & Portfolio Workspace UI", () => {
  it("distinguishes portfolio-supported from self-reported skills and enforces transparent completeness & credential status", () => {
    render(
      <ProfileWorkspace
        bundle={MOCK_BUNDLE}
        categories={[
          {
            id: "cat-1",
            slug: "ui-ux-design",
            name: "UI/UX Design",
            description: "Interfaces and design systems",
            sort_order: 20,
            is_active: true,
            created_at: "2026-11-26T00:00:00Z",
            updated_at: "2026-11-26T00:00:00Z",
          },
        ]}
        skillCatalogue={[]}
      />
    );

    expect(screen.getByText("Daniel Temitope Ojo")).toBeTruthy();
    expect(screen.getByText("L2 · Portfolio-Supported")).toBeTruthy();
    expect(screen.getByText("L1 · Self-Reported")).toBeTruthy();
    expect(
      screen.getByText(/not a score of professional competence/i)
    ).toBeTruthy();

    // Switch to Credentials tab and verify honest verification integrity guidance
    fireEvent.click(screen.getByRole("tab", { name: /Credentials/i }));
    expect(screen.getByText("Google UX Design Certificate")).toBeTruthy();
    expect(screen.getAllByText("Evidence Submitted").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/cannot self-assign/i)).toBeTruthy();
  });
});
