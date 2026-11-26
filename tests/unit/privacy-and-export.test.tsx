import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  PrivacySettingsClient,
  type PrivacySettingsHandlers,
} from "@/components/settings/privacy-settings-client";
import { buildPersonalDataExportPayload } from "@/modules/profiles/export";
import type { ConsentLogRow } from "@/modules/profiles/repo";

const INITIAL_LOGS: ConsentLogRow[] = [
  {
    id: "log-1",
    user_id: "user-1",
    consent_type: "terms_and_privacy",
    policy_version: "2026-11-v1",
    granted: true,
    created_at: "2026-11-25T10:00:00Z",
  },
];

describe("M1.4 privacy settings, append-only consent audit & JSON data export", () => {
  it("builds a sanitised JSON personal data export excluding secrets and disclosing unavailable categories", () => {
    const payload = buildPersonalDataExportPayload({
      account: {
        userId: "user-1",
        email: "amina@example.com",
        authProvider: "email",
        emailConfirmedAt: "2026-11-25T10:00:00Z",
        accountCreatedAt: "2026-11-25T09:55:00Z",
      },
      profile: {
        user_id: "user-1",
        handle: "amina",
        full_name: "Amina Osei",
        headline: "Full-Stack Engineer",
        bio: "",
        current_focus: "",
        work_arrangement: "flexible",
        achievements: [],
        contact_links: [],
        allow_search_indexing: false,
        avatar_url: null,
        country_code: "NG",
        city: "Lagos",
        timezone: "Africa/Lagos",
        interests: ["technology"],
        career_goals: ["discover-opportunities"],
        career_goal: "Global impact",
        availability_status: "actively_looking",
        visibility_scope: "private",
        ai_context_consent: false,
        profile_completion_score: 100,
        onboarding_step: 4,
        onboarding_completed_at: "2026-11-25T10:05:00Z",
        created_at: "2026-11-25T09:55:00Z",
        updated_at: "2026-11-25T10:05:00Z",
      },
      skills: [
        {
          skillId: "skill-1",
          slug: "typescript",
          name: "TypeScript",
          category: "Technology",
          proficiencyLevel: "advanced",
          evidenceStatus: "self_reported",
          createdAt: "2026-11-25T10:02:00Z",
        },
      ],
      organisations: [],
      consentLogs: INITIAL_LOGS,
      exportedAt: "2026-11-25T12:00:00Z",
    });

    const serialised = JSON.stringify(payload);
    expect(payload.account.email).toBe("amina@example.com");
    expect(payload.profile?.visibility_scope).toBe("private");
    expect(payload.skills).toHaveLength(1);
    expect(payload.consent_history).toHaveLength(1);
    expect(payload.unavailable_categories.length).toBeGreaterThanOrEqual(1);
    expect(serialised).not.toMatch(/service_role|access_token|refresh_token|password_hash/i);
  });

  it("updates profile visibility and appends immutable AI consent audit entries in UI", async () => {
    const newLog: ConsentLogRow = {
      id: "log-2",
      user_id: "user-1",
      consent_type: "ai_context_processing",
      policy_version: "2026-11-ai-v1",
      granted: true,
      created_at: "2026-11-25T12:05:00Z",
    };

    const handlers: PrivacySettingsHandlers = {
      updateVisibility: vi
        .fn()
        .mockResolvedValue({ ok: true, data: { visibilityScope: "private" } }),
      updateAiConsent: vi
        .fn()
        .mockResolvedValue({ ok: true, data: { granted: true, logEntry: newLog } }),
    };

    render(
      <PrivacySettingsClient
        initialVisibility="public"
        initialAiConsent={false}
        initialConsentLogs={INITIAL_LOGS}
        userTimezone="Africa/Lagos"
        handlers={handlers}
      />
    );

    // Switch visibility to Private and save
    fireEvent.click(screen.getByDisplayValue("private"));
    fireEvent.click(screen.getByRole("button", { name: /save visibility/i }));

    await waitFor(() => {
      expect(handlers.updateVisibility).toHaveBeenCalledWith({
        visibilityScope: "private",
      });
    });

    // Toggle AI Consent ON and verify new audit record renders
    const aiSwitch = screen.getByRole("switch");
    expect(aiSwitch.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(aiSwitch);

    await waitFor(() => {
      expect(handlers.updateAiConsent).toHaveBeenCalledWith({ granted: true });
      expect(screen.getByText("Nexus AI Context")).toBeTruthy();
      expect(screen.getByText(/2026-11-ai-v1/)).toBeTruthy();
    });
  });
});
