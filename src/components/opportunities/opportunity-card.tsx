"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  Globe2,
  MapPin,
  ShieldCheck,
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
import { toggleBookmarkAction } from "@/modules/opportunities/actions";
import {
  APPLICATION_STATUS_OPTIONS,
  formatDeadlineInTimeZone,
  formatOpportunityCompensation,
  OPPORTUNITY_TYPE_OPTIONS,
  OPPORTUNITY_VERIFICATION_META,
} from "@/modules/opportunities/constants";
import type { MatchedOpportunityItem } from "@/modules/opportunities/repo";

interface OpportunityCardProps {
  item: MatchedOpportunityItem;
  timezone: string;
  onBookmarkChanged?: (opportunityId: string, bookmarked: boolean) => void;
}

export function OpportunityCard({
  item,
  timezone,
  onBookmarkChanged,
}: OpportunityCardProps) {
  const router = useRouter();
  const { opportunity, fit, bookmark, application } = item;
  const [overrideBookmarked, setOverrideBookmarked] = React.useState<boolean | null>(null);
  const [toggling, setToggling] = React.useState(false);
  const isBookmarked = overrideBookmarked ?? Boolean(bookmark);

  const typeLabel =
    OPPORTUNITY_TYPE_OPTIONS.find((t) => t.value === opportunity.opportunity_type)?.label ??
    opportunity.opportunity_type;
  const verificationMeta = OPPORTUNITY_VERIFICATION_META[opportunity.verification_status];
  const compensation = formatOpportunityCompensation({
    type: opportunity.compensation_type,
    min: opportunity.compensation_min,
    max: opportunity.compensation_max,
    currencyCode: opportunity.currency_code,
  });
  const deadline = formatDeadlineInTimeZone(
    opportunity.deadline_at,
    opportunity.is_rolling,
    timezone
  );
  const appMeta = application
    ? APPLICATION_STATUS_OPTIONS.find((s) => s.value === application.status)
    : null;

  async function handleToggleBookmark() {
    setToggling(true);
    const nextState = !isBookmarked;
    setOverrideBookmarked(nextState);
    const res = await toggleBookmarkAction({ opportunityId: opportunity.id });
    setToggling(false);
    if (!res.ok) {
      setOverrideBookmarked(null);
      return;
    }
    const confirmed = res.data?.bookmarked ?? nextState;
    setOverrideBookmarked(confirmed);
    onBookmarkChanged?.(opportunity.id, confirmed);
    router.refresh();
  }

  return (
    <Card className="flex min-w-0 flex-col justify-between transition-shadow hover:shadow-[var(--shadow-2)]">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant={verificationMeta.badgeVariant}
              showIcon={opportunity.verification_status === "partner_verified"}
              title={verificationMeta.description}
            >
              {verificationMeta.label}
            </Badge>
            <Badge variant="default">{typeLabel}</Badge>
            {appMeta && <Badge variant={appMeta.badgeVariant}>{appMeta.label}</Badge>}
          </div>

          <Badge
            variant={
              fit.overallScore >= 75
                ? "verified"
                : fit.overallScore >= 50
                  ? "primary"
                  : "default"
            }
            className="tabular-nums"
          >
            {fit.overallScore}% Readiness
          </Badge>
        </div>

        <div>
          <CardTitle className="text-base leading-snug">
            <Link
              href={`/opportunities/${opportunity.slug}`}
              className="hover:text-brand hover:underline"
            >
              {opportunity.title}
            </Link>
          </CardTitle>
          <p className="mt-0.5 text-xs font-semibold text-ink-secondary">
            {opportunity.organisation_name}
          </p>
        </div>

        <CardDescription className="line-clamp-2 text-xs leading-relaxed">
          {opportunity.summary}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-secondary">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
            {opportunity.location_label}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-ink">
            {compensation}
          </span>
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              deadline.urgency === "urgent"
                ? "text-warning-text"
                : deadline.urgency === "closed"
                  ? "text-danger-text"
                  : "text-ink-muted"
            }`}
            title={`Deadline (${timezone}): ${deadline.formattedLocal}`}
          >
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            {deadline.label}
          </span>
        </div>

        {/* Explainable Eligibility & Evidence Match Summary */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border-base bg-canvas/60 px-2.5 py-2 text-[11px]">
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              fit.eligibilityStatus === "check_eligibility"
                ? "text-warning-text"
                : "text-success-text"
            }`}
          >
            <Globe2 className="h-3 w-3 shrink-0" aria-hidden="true" />
            {fit.eligibilityLabel}
          </span>
          <span className="text-border-strong" aria-hidden="true">
            ·
          </span>
          <span className="inline-flex items-center gap-1 text-ink-secondary">
            <ShieldCheck className="h-3 w-3 shrink-0 text-brand" aria-hidden="true" />
            {fit.evidenceBackedMatches.length} evidence-backed
            {fit.selfReportedMatches.length > 0
              ? `, ${fit.selfReportedMatches.length} self-reported`
              : ""}
          </span>
        </div>

        {opportunity.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {opportunity.requiredSkills.slice(0, 5).map((req) => {
              const isEvidence = fit.evidenceBackedMatches.some(
                (m) => m.skillId === req.skillId
              );
              const isSelf = fit.selfReportedMatches.some(
                (m) => m.skillId === req.skillId
              );
              return (
                <Badge
                  key={req.skillId}
                  variant={isEvidence ? "verified" : isSelf ? "primary" : "default"}
                >
                  {isEvidence && (
                    <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                  )}
                  {req.name}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-2 border-t border-border-base pt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={toggling}
          onClick={handleToggleBookmark}
          aria-pressed={isBookmarked}
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

        <Button size="sm" asChild>
          <Link href={`/opportunities/${opportunity.slug}`}>
            View Fit &amp; Track
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
