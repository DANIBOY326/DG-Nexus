import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  Globe2,
  ShieldCheck,
  Sparkles,
  UserCheck,
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
import { getCurrentUser } from "@/modules/identity/guards";
import {
  formatDeadlineInTimeZone,
  OPPORTUNITY_TYPE_OPTIONS,
} from "@/modules/opportunities/constants";
import { getOpportunityWorkspaceBundle } from "@/modules/opportunities/repo";
import {
  AVAILABILITY_OPTIONS,
  DOMAIN_INTERESTS,
  getCountryName,
} from "@/modules/profiles/constants";
import { getOwnProfileWithSkills } from "@/modules/profiles/repo";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [record, oppBundle] = user
    ? await Promise.all([
        getOwnProfileWithSkills(user.id).catch(() => null),
        getOpportunityWorkspaceBundle(user.id).catch(() => null),
      ])
    : [null, null];

  if (user && record && !record.profile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const profile = record?.profile;
  const skills = record?.skills ?? [];
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "there";
  const availabilityLabel =
    AVAILABILITY_OPTIONS.find((a) => a.value === profile?.availability_status)?.label ??
    "Open to opportunities";
  const domainLabels = (profile?.interests ?? []).map(
    (slug) => DOMAIN_INTERESTS.find((d) => d.slug === slug)?.label ?? slug
  );
  const topOpportunities = (oppBundle?.items ?? []).slice(0, 3);
  const timezone = profile?.timezone || "UTC";

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-6 text-white shadow-[var(--shadow-2)]"
        style={{ background: "var(--color-brand-gradient)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
            Connected Professional Operating Environment
          </p>
          {profile && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              {getCountryName(profile.country_code)} · {profile.timezone}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-blue-50/90">
          {profile?.headline
            ? `${profile.headline} — ${availabilityLabel}.`
            : "Your unified workspace for verified global opportunities, proof-of-work profiles, and explainable Nexus AI career readiness."}
        </p>
      </section>

      {/* Responsive 12-column Desktop (8 + 4) / Tablet (2-col) / Mobile (1-col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Top Matched Verified Global Opportunities (Live in M3) */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-brand" aria-hidden="true" />
                    Top Matched Global Opportunities
                  </CardTitle>
                  <CardDescription>
                    Ranked deterministically from your canonical skills, portfolio evidence, and{" "}
                    {getCountryName(profile?.country_code)} eligibility.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/opportunities">
                    View All ({oppBundle?.items.length ?? 0})
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {topOpportunities.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Explore curated jobs, scholarships, fellowships, and grants in the Opportunities workspace.
                </p>
              ) : (
                topOpportunities.map((item) => {
                  const deadline = formatDeadlineInTimeZone(
                    item.opportunity.deadline_at,
                    item.opportunity.is_rolling,
                    timezone
                  );
                  const typeLabel =
                    OPPORTUNITY_TYPE_OPTIONS.find(
                      (t) => t.value === item.opportunity.opportunity_type
                    )?.label ?? item.opportunity.opportunity_type;

                  return (
                    <div
                      key={item.opportunity.id}
                      className="flex flex-col gap-2 rounded-xl border border-border-base bg-canvas/50 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="default">{typeLabel}</Badge>
                          <Badge
                            variant={
                              item.fit.overallScore >= 75 ? "verified" : "primary"
                            }
                            className="tabular-nums"
                          >
                            {item.fit.overallScore}% Readiness
                          </Badge>
                        </div>
                        <Link
                          href={`/opportunities/${item.opportunity.slug}`}
                          className="block truncate text-sm font-bold text-ink hover:text-brand hover:underline"
                        >
                          {item.opportunity.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                          <span>{item.opportunity.organisation_name}</span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" aria-hidden="true" />
                            {deadline.label}
                          </span>
                        </div>
                      </div>

                      <Button size="sm" variant="outline" className="shrink-0" asChild>
                        <Link href={`/opportunities/${item.opportunity.slug}`}>
                          Inspect Fit
                        </Link>
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {profile && (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Your Unified Graph Snapshot</CardTitle>
                  <Badge variant="verified" showIcon className="tabular-nums">
                    {profile.profile_completion_score}% Documented
                  </Badge>
                </div>
                <CardDescription>
                  Structured domains and canonical skills powering explainable opportunity matching.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {domainLabels.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Focus Domains
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {domainLabels.map((label) => (
                        <Badge key={label} variant="primary">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Canonical Skills ({skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <Badge
                          key={skill.skillId}
                          variant={
                            skill.evidenceStatus !== "self_reported"
                              ? "primary"
                              : "default"
                          }
                        >
                          {skill.name} · {skill.proficiencyLevel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href="/profile">Open Proof-of-Work Profile</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/onboarding?revisit=1">Update Onboarding</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/settings">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Privacy ({profile.visibility_scope})
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <aside className="space-y-4 lg:col-span-4" aria-label="Contextual Workspace Rail">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarClock className="h-4 w-4 text-brand" aria-hidden="true" />
                Opportunity Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-ink-secondary">
              <div className="flex items-center justify-between">
                <span>Saved Shortlist</span>
                <strong className="text-ink tabular-nums">
                  {oppBundle?.savedCount ?? 0}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Tracked Applications</span>
                <strong className="text-ink tabular-nums">
                  {oppBundle?.applicationCount ?? 0}
                </strong>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/opportunities">Open Opportunities Engine</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card variant="ai">
            <CardHeader>
              <Badge variant="ai" showIcon>
                Nexus AI Context
              </Badge>
              <CardTitle className="mt-1">
                {profile?.ai_context_consent ? "AI Context Enabled" : "AI Context Opted Out"}
              </CardTitle>
              <CardDescription>
                {profile?.ai_context_consent
                  ? "Authorised non-PII skills and goals are available for Nexus AI readiness insights."
                  : "Privacy-protective default active. Nexus AI will not access your profile until you opt in."}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="primary" size="sm" asChild>
                <Link href="/settings">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Manage AI Consent
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-brand" aria-hidden="true" />
                Identity &amp; Privacy Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-ink-secondary">
              <div className="flex items-center justify-between">
                <span>Profile Visibility</span>
                <Badge variant="default" className="capitalize">
                  {profile?.visibility_scope ?? "public"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Context Consent</span>
                <Badge variant={profile?.ai_context_consent ? "verified" : "warning"}>
                  {profile?.ai_context_consent ? "Opted In" : "Opted Out"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
