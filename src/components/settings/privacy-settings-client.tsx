"use client";

import * as React from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  History,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  VISIBILITY_OPTIONS,
  type M1VisibilityOption,
} from "@/modules/profiles/constants";
import type { ActionResult } from "@/modules/profiles/actions";
import {
  updateAiContextConsentAction,
  updateProfileVisibilityAction,
} from "@/modules/profiles/privacy-actions";
import type { ConsentLogRow } from "@/modules/profiles/repo";
import { cn, formatUtcDate } from "@/lib/utils";

export interface PrivacySettingsHandlers {
  updateVisibility: (
    payload: unknown
  ) => Promise<ActionResult<{ visibilityScope: M1VisibilityOption }>>;
  updateAiConsent: (
    payload: unknown
  ) => Promise<ActionResult<{ granted: boolean; logEntry: ConsentLogRow }>>;
}

interface PrivacySettingsClientProps {
  initialVisibility: M1VisibilityOption;
  initialAiConsent: boolean;
  initialConsentLogs: ConsentLogRow[];
  userTimezone: string;
  handlers?: PrivacySettingsHandlers;
}

function formatConsentLabel(consentType: string): string {
  if (consentType === "ai_context_processing") return "Nexus AI Context";
  if (consentType === "terms_and_privacy") return "Terms & Privacy";
  if (consentType === "marketing_emails") return "Product Updates";
  return consentType;
}

export function PrivacySettingsClient({
  initialVisibility,
  initialAiConsent,
  initialConsentLogs,
  userTimezone,
  handlers,
}: PrivacySettingsClientProps) {
  const [visibility, setVisibility] = React.useState<M1VisibilityOption>(initialVisibility);
  const [savedVisibility, setSavedVisibility] =
    React.useState<M1VisibilityOption>(initialVisibility);
  const [savingVisibility, setSavingVisibility] = React.useState(false);
  const [visibilityStatus, setVisibilityStatus] = React.useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "" });

  const [aiConsent, setAiConsent] = React.useState<boolean>(initialAiConsent);
  const [savingAi, setSavingAi] = React.useState(false);
  const [aiStatus, setAiStatus] = React.useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "" });
  const [consentLogs, setConsentLogs] = React.useState<ConsentLogRow[]>(initialConsentLogs);

  const [exporting, setExporting] = React.useState(false);
  const [exportStatus, setExportStatus] = React.useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "" });

  const activeHandlers: PrivacySettingsHandlers = handlers ?? {
    updateVisibility: updateProfileVisibilityAction,
    updateAiConsent: updateAiContextConsentAction,
  };

  async function handleSaveVisibility() {
    setSavingVisibility(true);
    setVisibilityStatus({ type: "idle", text: "" });

    try {
      const res = await activeHandlers.updateVisibility({ visibilityScope: visibility });
      if (!res.ok) {
        setVisibilityStatus({ type: "error", text: res.error });
        return;
      }
      setSavedVisibility(visibility);
      setVisibilityStatus({
        type: "success",
        text: `Profile visibility updated to "${visibility}" and enforced at database RLS level.`,
      });
    } finally {
      setSavingVisibility(false);
    }
  }

  async function handleToggleAiConsent(nextValue: boolean) {
    setSavingAi(true);
    setAiStatus({ type: "idle", text: "" });

    try {
      const res = await activeHandlers.updateAiConsent({ granted: nextValue });
      if (!res.ok) {
        setAiStatus({ type: "error", text: res.error });
        return;
      }
      setAiConsent(nextValue);
      if (res.data?.logEntry) {
        setConsentLogs((prev) => [res.data!.logEntry, ...prev]);
      }
      setAiStatus({
        type: "success",
        text: nextValue
          ? "Nexus AI context access enabled and recorded in your immutable consent log."
          : "Nexus AI context access revoked and recorded in your immutable consent log.",
      });
    } finally {
      setSavingAi(false);
    }
  }

  async function handleDownloadExport() {
    setExporting(true);
    setExportStatus({ type: "idle", text: "" });

    try {
      const response = await fetch("/api/account/export", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        setExportStatus({
          type: "error",
          text:
            (errorBody && typeof errorBody.error === "string" && errorBody.error) ||
            "Unable to export personal data right now.",
        });
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const dateStamp = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `dg-nexus-personal-data-${dateStamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setExportStatus({
        type: "success",
        text: "Personal data JSON export downloaded securely.",
      });
    } catch {
      setExportStatus({
        type: "error",
        text: "Network error while requesting your personal data export.",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Primary Column (8 cols desktop) */}
      <div className="space-y-6 lg:col-span-8">
        {/* 1. PROFILE VISIBILITY */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-brand" aria-hidden="true" />
                Profile Visibility
              </CardTitle>
              <Badge variant="verified" showIcon>
                RLS Enforced
              </Badge>
            </div>
            <CardDescription>
              Control who can view your professional profile and canonical skills across DG
              NEXUS. Enforced server-side via PostgreSQL Row-Level Security.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <fieldset className="space-y-2.5">
              <legend className="sr-only">Select profile visibility level</legend>
              {VISIBILITY_OPTIONS.map((option) => {
                const selected = visibility === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
                      selected
                        ? "border-brand bg-brand-soft"
                        : "border-border-base bg-surface hover:border-border-strong"
                    )}
                  >
                    <input
                      type="radio"
                      name="visibilityScope"
                      value={option.value}
                      checked={selected}
                      onChange={() => setVisibility(option.value)}
                      className="mt-1 h-4 w-4 accent-brand"
                    />
                    <span className="space-y-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                        {option.label}
                        {savedVisibility === option.value && (
                          <Badge variant="primary">Active</Badge>
                        )}
                      </span>
                      <span className="block text-xs font-medium text-ink">
                        {option.summary}
                      </span>
                      <span className="block text-xs text-ink-secondary">
                        {option.enforcementDetail}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {visibilityStatus.type === "error" && (
              <div
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-text"
              >
                {visibilityStatus.text}
              </div>
            )}
            {visibilityStatus.type === "success" && (
              <div
                role="status"
                className="rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success-text"
              >
                {visibilityStatus.text}
              </div>
            )}
          </CardContent>

          <CardFooter>
            <span className="text-xs text-ink-muted">
              Changes take effect immediately on all profile &amp; skills queries.
            </span>
            <Button
              type="button"
              loading={savingVisibility}
              disabled={visibility === savedVisibility}
              onClick={handleSaveVisibility}
            >
              Save Visibility
            </Button>
          </CardFooter>
        </Card>

        {/* 2. NEXUS AI CONTEXT CONSENT */}
        <Card variant="ai">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="ai" showIcon>
                Nexus AI Governance
              </Badge>
              <Badge variant={aiConsent ? "verified" : "warning"}>
                {aiConsent ? "Opted In" : "Opted Out (Default)"}
              </Badge>
            </div>
            <CardTitle className="mt-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-ai-accent" aria-hidden="true" />
              Nexus AI Context Consent
            </CardTitle>
            <CardDescription>
              Choose whether Nexus AI services may read your authorised skills, domains,
              country code, and career goals to generate explainable opportunity-fit and
              skills-gap insights.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-ai-border bg-surface p-4">
              <div className="space-y-1">
                <p id="ai-consent-label" className="text-sm font-semibold text-ink">
                  Allow Nexus AI to use my structured profile context
                </p>
                <p className="text-xs text-ink-secondary">
                  Privacy-protective default is <strong>Off</strong>. Direct PII (email, full
                  name, city) is stripped before external inference even when enabled. Every
                  change is logged immutably.
                </p>
              </div>
              <Switch
                id="ai-consent-switch"
                aria-labelledby="ai-consent-label"
                checked={aiConsent}
                disabled={savingAi}
                onCheckedChange={handleToggleAiConsent}
              />
            </div>

            {aiStatus.type === "error" && (
              <div
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-text"
              >
                {aiStatus.text}
              </div>
            )}
            {aiStatus.type === "success" && (
              <div
                role="status"
                className="rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success-text"
              >
                {aiStatus.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. SELF-SERVICE PERSONAL DATA EXPORT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-brand" aria-hidden="true" />
              Personal Data Export (JSON)
            </CardTitle>
            <CardDescription>
              Download a structured JSON copy of your authorised DG NEXUS personal records,
              supporting GDPR and Nigeria Data Protection Act (NDPA) data portability
              readiness.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs text-ink-secondary">
            <div className="rounded-xl border border-border-base bg-canvas p-4 space-y-2">
              <p className="font-semibold text-ink">Included in Milestone M3 export (v3.0.0-m3):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account metadata (user ID, email, auth provider, timestamps)</li>
                <li>Profile basics, biography, public handle, links, domains, goals &amp; availability</li>
                <li>Canonical skills, proficiency levels &amp; evidence status</li>
                <li>Professional experience, education pathways, credentials, portfolio projects &amp; evidence file metadata</li>
                <li>Saved opportunity bookmarks &amp; private application tracker records</li>
                <li>Organisation memberships and full append-only consent audit history</li>
              </ul>
              <p className="pt-1 text-ink-muted">
                Excluded by security design: passwords, session tokens, privileged keys,
                internal storage paths, internal security logs, and other users&rsquo; data. Raw
                binary files and categories from later milestones (AI logs [M4], messages [M5])
                are explicitly disclosed in the export manifest.
              </p>
            </div>

            {exportStatus.type === "error" && (
              <div
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-text"
              >
                {exportStatus.text}
              </div>
            )}
            {exportStatus.type === "success" && (
              <div
                role="status"
                className="rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success-text"
              >
                {exportStatus.text}
              </div>
            )}
          </CardContent>

          <CardFooter>
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Served dynamically with <code className="font-mono">no-store</code> headers
            </span>
            <Button
              type="button"
              variant="outline"
              loading={exporting}
              onClick={handleDownloadExport}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export Personal Data (JSON)
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Right Audit Column (4 cols desktop) */}
      <aside className="space-y-4 lg:col-span-4" aria-label="Consent Audit History">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-brand" aria-hidden="true" />
              Consent Audit Trail
            </CardTitle>
            <CardDescription>
              Append-only record of your consent decisions. Protected against editing or
              deletion by PostgreSQL triggers and RLS.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {consentLogs.length === 0 ? (
              <p className="text-xs text-ink-muted">
                No consent events recorded yet. Toggling Nexus AI consent will append a
                timestamped entry here.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {consentLogs.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-border-base bg-canvas p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink">
                        {formatConsentLabel(entry.consent_type)}
                      </span>
                      <Badge variant={entry.granted ? "verified" : "warning"}>
                        {entry.granted ? "Granted" : "Revoked"}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Policy: {entry.policy_version}</span>
                      <span className="tabular-nums">
                        {formatUtcDate(entry.created_at, { timeZone: userTimezone })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>

          <CardFooter className="text-[11px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              Append-only ledger · Immutable
            </span>
          </CardFooter>
        </Card>

        <Card variant="subtle">
          <CardContent className="p-4 text-xs text-ink-secondary space-y-1.5">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
              Transparency Notice
            </p>
            <p>
              DG NEXUS implements privacy-by-design controls (RLS, consent auditing, and JSON
              portability) to support GDPR and NDPA readiness. Formal legal compliance also
              depends on published policies and operational procedures.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
