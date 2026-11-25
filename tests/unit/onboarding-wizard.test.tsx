import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  OnboardingWizard,
  type OnboardingActionHandlers,
  type OnboardingInitialData,
  type WizardSkillOption,
} from "@/components/onboarding/onboarding-wizard";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const MOCK_SKILLS: WizardSkillOption[] = [
  { id: "11111111-1111-4111-8111-111111111111", slug: "typescript", name: "TypeScript", category: "Technology" },
  { id: "22222222-2222-4222-8222-222222222222", slug: "figma", name: "Figma", category: "Design" },
  { id: "33333333-3333-4333-8333-333333333333", slug: "grant-writing", name: "Grant Writing", category: "Research" },
];

function buildInitialData(overrides?: Partial<OnboardingInitialData>): OnboardingInitialData {
  return {
    step: 1,
    fullName: "Amina Osei",
    headline: "Full-Stack Product Engineer",
    countryCode: "NG",
    timezone: "Africa/Lagos",
    city: "Lagos",
    interests: [],
    selectedSkills: [],
    careerGoals: [],
    careerGoalSummary: "",
    availabilityStatus: "open_to_opportunities",
    isRevisit: false,
    ...overrides,
  };
}

describe("M1.3 four-step onboarding wizard", () => {
  it("resumes directly at the persisted step after an interrupted session", () => {
    render(
      <OnboardingWizard
        canonicalSkills={MOCK_SKILLS}
        initialData={buildInitialData({ step: 2, interests: ["technology"] })}
      />
    );

    expect(screen.getByText("Step 2 of 4")).toBeTruthy();
    expect(screen.getByText("What sparks your curiosity?")).toBeTruthy();
  });

  it("surfaces server validation errors and preserves user input without advancing", async () => {
    const handlers: OnboardingActionHandlers = {
      saveStep1: vi.fn().mockResolvedValue({
        ok: false,
        error: "Add a concise professional headline (at least 4 characters).",
      }),
      saveStep2: vi.fn(),
      saveStep3: vi.fn(),
      completeStep4: vi.fn(),
    };

    render(
      <OnboardingWizard
        canonicalSkills={MOCK_SKILLS}
        initialData={buildInitialData({ headline: "Hi" })}
        handlers={handlers}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /save & continue/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/professional headline/i);
    });
    expect(screen.getByText("Step 1 of 4")).toBeTruthy();
  });

  it("filters canonical skills by search query and toggles unique skill selection cleanly", async () => {
    const saveStep3 = vi.fn().mockResolvedValue({ ok: true, data: { nextStep: 4 } });
    const handlers: OnboardingActionHandlers = {
      saveStep1: vi.fn(),
      saveStep2: vi.fn(),
      saveStep3,
      completeStep4: vi.fn(),
    };

    render(
      <OnboardingWizard
        canonicalSkills={MOCK_SKILLS}
        initialData={buildInitialData({ step: 3 })}
        handlers={handlers}
      />
    );

    fireEvent.change(screen.getByLabelText("Search canonical skills"), {
      target: { value: "fig" },
    });

    expect(screen.getByRole("button", { name: "Figma" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "TypeScript" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Figma" }));
    fireEvent.click(screen.getByRole("button", { name: /save & continue/i }));

    await waitFor(() => {
      expect(saveStep3).toHaveBeenCalledWith({
        skills: [
          {
            skillId: "22222222-2222-4222-8222-222222222222",
            proficiencyLevel: "intermediate",
          },
        ],
      });
    });
    expect(screen.getByText("Step 4 of 4")).toBeTruthy();
  });

  it("completes Step 4 and redirects to /home", async () => {
    const completeStep4 = vi
      .fn()
      .mockResolvedValue({ ok: true, data: { redirectTo: "/home" } });
    const handlers: OnboardingActionHandlers = {
      saveStep1: vi.fn(),
      saveStep2: vi.fn(),
      saveStep3: vi.fn(),
      completeStep4,
    };

    render(
      <OnboardingWizard
        canonicalSkills={MOCK_SKILLS}
        initialData={buildInitialData({
          step: 4,
          careerGoals: ["discover-opportunities"],
        })}
        handlers={handlers}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /complete setup/i }));

    await waitFor(() => {
      expect(completeStep4).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith("/home");
    });
  });
});
