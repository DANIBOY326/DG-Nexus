import { PrivacySettingsClient } from "@/components/settings/privacy-settings-client";
import { requireUser } from "@/modules/identity/guards";
import type { M1VisibilityOption } from "@/modules/profiles/constants";
import { getOwnProfile, listOwnConsentLogs } from "@/modules/profiles/repo";

export default async function SettingsPage() {
  const user = await requireUser("/settings");

  const [profile, consentLogs] = await Promise.all([
    getOwnProfile(user.id).catch(() => null),
    listOwnConsentLogs(user.id).catch(() => []),
  ]);

  const rawVis = profile?.visibility_scope;
  const initialVisibility: M1VisibilityOption =
    rawVis === "public" || rawVis === "connections" || rawVis === "private"
      ? rawVis
      : "public";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Privacy, Consent &amp; Data Settings
        </h1>
        <p className="text-sm text-ink-secondary">
          Manage your database-enforced profile visibility, Nexus AI context permissions, and
          personal data portability exports.
        </p>
      </header>

      <PrivacySettingsClient
        initialVisibility={initialVisibility}
        initialAiConsent={profile?.ai_context_consent ?? false}
        initialConsentLogs={consentLogs}
        userTimezone={profile?.timezone ?? "UTC"}
      />
    </div>
  );
}
