import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FolderKanban,
  Globe2,
  Info,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApplicationTrackerPanel } from "@/components/opportunities/application-tracker-panel";
import { requireUser } from "@/modules/identity/guards";
import { DOMAIN_INTERESTS } from "@/modules/profiles/constants";
import {
  EXPERIENCE_LEVEL_LABELS,
  formatDeadlineInTimeZone,
  formatOpportunityCompensation,
  OPPORTUNITY_TYPE_OPTIONS,
  OPPORTUNITY_VERIFICATION_META,
} from "@/modules/opportunities/constants";
import { getMatchedOpportunityBySlug } from "@/modules/opportunities/repo";

export default async function OpportunityDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser("/opportunities");
  const { slug } = await props.params;

  const result = await getMatchedOpportunityBySlug(user.id, slug);
  if (!result) {
    notFound();
  }

  const { item, timezone } = result;
  const { opportunity, fit } = item;

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
  const domainLabels = opportunity.domain_tags.map(
    (tag) => DOMAIN_INTERESTS.find((d) => d.slug === tag)?.label ?? tag
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/opportunities">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Opportunities
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Opportunity Brief + Explainable Fit Breakdown */}
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={verificationMeta.badgeVariant}
                  showIcon={opportunity.verification_status === "partner_verified"}
                  title={verificationMeta.description}
                >
                  {verificationMeta.label}
                </Badge>
                <Badge variant="default">{typeLabel}</Badge>
                <Badge variant="default">
                  {EXPERIENCE_LEVEL_LABELS[opportunity.experience_level]}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{opportunity.title}</CardTitle>
              <CardDescription className="text-sm font-medium text-ink-secondary">
                {opportunity.organisation_name}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border-base bg-canvas/60 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Location &amp; Format
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                    <MapPin className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                    {opportunity.location_label}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Compensation / Funding
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{compensation}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Deadline ({timezone})
                  </p>
                  <p
                    className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold ${
                      deadline.urgency === "urgent"
                        ? "text-warning-text"
                        : deadline.urgency === "closed"
                          ? "text-danger-text"
                          : "text-ink"
                    }`}
                  >
                    <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {deadline.label}
                  </p>
                  <p className="text-[11px] text-ink-muted">{deadline.formattedLocal}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold text-ink">Overview</h2>
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {opportunity.summary}
                </p>
                {opportunity.description && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
                    {opportunity.description}
                  </p>
                )}
              </div>

              {opportunity.eligibility_criteria.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-ink">Eligibility Criteria</h2>
                  <ul className="space-y-1.5 text-sm text-ink-secondary">
                    {opportunity.eligibility_criteria.map((criterion, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                          aria-hidden="true"
                        />
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {domainLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {domainLabels.map((label) => (
                    <Badge key={label} variant="primary">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Explainable Skill-Gap & Evidence Readiness Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" />
                    Explainable Readiness &amp; Skill-Gap Breakdown
                  </CardTitle>
                  <CardDescription>
                    Grounded strictly in your canonical skills, portfolio evidence, and ISO-3166 location.
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    fit.overallScore >= 75
                      ? "verified"
                      : fit.overallScore >= 50
                        ? "primary"
                        : "warning"
                  }
                  className="text-sm tabular-nums"
                >
                  {fit.overallScore}% Readiness
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Eligibility Status */}
              <div className="flex items-center gap-2.5 rounded-xl border border-border-base bg-canvas/60 p-3 text-sm">
                <Globe2
                  className={`h-4 w-4 shrink-0 ${
                    fit.eligibilityStatus === "check_eligibility"
                      ? "text-warning-text"
                      : "text-success"
                  }`}
                  aria-hidden="true"
                />
                <span className="font-semibold text-ink">{fit.eligibilityLabel}</span>
              </div>

              {/* Evidence-Backed Matches */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-success-text">
                  Evidence-Backed Skill Matches ({fit.evidenceBackedMatches.length})
                </h3>
                {fit.evidenceBackedMatches.length === 0 ? (
                  <p className="text-xs text-ink-muted">
                    No required/preferred skills are backed by a linked portfolio project yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {fit.evidenceBackedMatches.map((skill) => (
                      <div
                        key={skill.skillId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/30 bg-success-soft/40 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className="h-4 w-4 shrink-0 text-success"
                            aria-hidden="true"
                          />
                          <strong className="text-ink">{skill.name}</strong>
                          <Badge variant="default" className="capitalize">
                            {skill.requirementLevel}
                          </Badge>
                        </div>
                        {skill.supportingProjectTitles.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-ink-secondary">
                            <FolderKanban className="h-3.5 w-3.5" aria-hidden="true" />
                            Backed by: {skill.supportingProjectTitles[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Self-Reported Matches */}
              {fit.selfReportedMatches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand">
                    Self-Reported Matches — Strengthen with Portfolio Evidence (
                    {fit.selfReportedMatches.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {fit.selfReportedMatches.map((skill) => (
                      <Badge key={skill.skillId} variant="primary">
                        {skill.name} ({skill.requirementLevel})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skill Gaps */}
              {(fit.missingRequiredSkills.length > 0 ||
                fit.missingPreferredSkills.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-warning-text">
                    Skill Gaps to Address
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {fit.missingRequiredSkills.map((req) => (
                      <Badge key={req.skillId} variant="warning">
                        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {req.name} (Required)
                      </Badge>
                    ))}
                    {fit.missingPreferredSkills.map((pref) => (
                      <Badge key={pref.skillId} variant="default">
                        <CircleDashed className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {pref.name} (Preferred)
                      </Badge>
                    ))}
                  </div>
                  <div className="pt-1">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/profile">
                        Add Supporting Project or Update Skills on Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-subtle/80 p-3 text-xs text-ink-secondary">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <p>{fit.disclaimer}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Application Tracker Rail */}
        <aside className="space-y-4 lg:col-span-4" aria-label="Application Tracker">
          <ApplicationTrackerPanel item={item} />
        </aside>
      </div>
    </div>
  );
}
