"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import type { ApplicationStatus } from "@/lib/supabase/database.types";
import {
  deleteApplicationAction,
  toggleBookmarkAction,
  upsertApplicationAction,
} from "@/modules/opportunities/actions";
import { APPLICATION_STATUS_OPTIONS } from "@/modules/opportunities/constants";
import type { MatchedOpportunityItem } from "@/modules/opportunities/repo";

interface ApplicationTrackerPanelProps {
  item: MatchedOpportunityItem;
}

export function ApplicationTrackerPanel({ item }: ApplicationTrackerPanelProps) {
  const router = useRouter();
  const { opportunity, fit, bookmark, application } = item;

  const [isBookmarked, setIsBookmarked] = React.useState(Boolean(bookmark));
  const [status, setStatus] = React.useState<ApplicationStatus>(
    application?.status ?? "preparing"
  );
  const [personalNotes, setPersonalNotes] = React.useState(
    application?.personal_notes ?? ""
  );
  const [externalReference, setExternalReference] = React.useState(
    application?.external_reference ?? ""
  );
  const [nextReminderDate, setNextReminderDate] = React.useState(
    application?.next_reminder_at ? application.next_reminder_at.slice(0, 10) : ""
  );
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [togglingBookmark, setTogglingBookmark] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "" });

  async function handleBookmark() {
    setTogglingBookmark(true);
    const res = await toggleBookmarkAction({ opportunityId: opportunity.id });
    setTogglingBookmark(false);
    if (res.ok) {
      setIsBookmarked(res.data?.bookmarked ?? !isBookmarked);
      router.refresh();
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "idle", text: "" });

    const res = await upsertApplicationAction(
      {
        opportunityId: opportunity.id,
        status,
        personalNotes,
        externalReference,
        nextReminderDate,
      },
      {
        overallScore: fit.overallScore,
        eligibilityStatus: fit.eligibilityStatus,
        evidenceBackedCount: fit.evidenceBackedMatches.length,
        selfReportedCount: fit.selfReportedMatches.length,
        missingRequiredCount: fit.missingRequiredSkills.length,
      }
    );

    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "error", text: res.error });
      return;
    }

    setMessage({ type: "success", text: "Application tracker saved privately." });
    router.refresh();
  }

  async function handleRemove() {
    if (!window.confirm("Remove this opportunity from your Application Tracker?")) return;
    setDeleting(true);
    const res = await deleteApplicationAction(opportunity.id);
    setDeleting(false);
    if (!res.ok) {
      setMessage({ type: "error", text: res.error });
      return;
    }
    setMessage({ type: "success", text: "Removed from application tracker." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Application &amp; Deadline Tracker</CardTitle>
        <CardDescription>
          Strictly private to your account (RLS-protected). Track status, notes, and follow-up dates.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {opportunity.application_url && (
              <Button className="flex-1" asChild>
                <a
                  href={opportunity.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apply on Host Site
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              loading={togglingBookmark}
              onClick={handleBookmark}
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck className="h-4 w-4 text-brand" aria-hidden="true" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                  Save
                </>
              )}
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app-status">Application stage</Label>
            <select
              id="app-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink"
            >
              {APPLICATION_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app-reminder">Personal reminder date (optional)</Label>
            <Input
              id="app-reminder"
              type="date"
              value={nextReminderDate}
              onChange={(e) => setNextReminderDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app-ref">Confirmation / Reference ID (optional)</Label>
            <Input
              id="app-ref"
              value={externalReference}
              onChange={(e) => setExternalReference(e.target.value)}
              placeholder="e.g. APP-2027-4491"
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="app-notes">Private preparation notes</Label>
            <textarea
              id="app-notes"
              rows={3}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="Key portfolio projects to highlight, referee contacts, or essay checklist..."
              maxLength={2000}
              className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink"
            />
          </div>

          {message.type === "error" && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger-text"
            >
              {message.text}
            </div>
          )}
          {message.type === "success" && (
            <div
              role="status"
              className="rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs text-success-text"
            >
              {message.text}
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-between gap-2">
          {application ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={deleting}
              onClick={handleRemove}
              className="text-danger-text hover:bg-danger-soft"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          ) : (
            <span className="text-xs text-ink-muted">Not tracked yet</span>
          )}

          <Button type="submit" size="sm" loading={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {application ? "Update Tracker" : "Track Application"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
