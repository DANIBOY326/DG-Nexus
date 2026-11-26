"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Briefcase,
  CalendarClock,
  ClipboardList,
  Compass,
  Info,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import type { ApplicationStatus } from "@/lib/supabase/database.types";
import { DOMAIN_INTERESTS, getCountryName } from "@/modules/profiles/constants";
import { upsertApplicationAction } from "@/modules/opportunities/actions";
import {
  APPLICATION_STATUS_OPTIONS,
  formatDeadlineInTimeZone,
  OPPORTUNITY_TYPE_OPTIONS,
  OPPORTUNITY_WORK_ARRANGEMENT_OPTIONS,
} from "@/modules/opportunities/constants";
import type {
  MatchedOpportunityItem,
  OpportunityWorkspaceBundle,
} from "@/modules/opportunities/repo";

type WorkspaceTab = "discover" | "saved" | "applications";
type SortOption = "best_match" | "deadline_soonest" | "newest";

interface OpportunitiesWorkspaceProps {
  bundle: OpportunityWorkspaceBundle;
}

export function OpportunitiesWorkspace({ bundle }: OpportunitiesWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>("discover");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [arrangementFilter, setArrangementFilter] = React.useState<string>("all");
  const [domainFilter, setDomainFilter] = React.useState<string>("all");
  const [eligibleOnly, setEligibleOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortOption>("best_match");
  const [updatingAppId, setUpdatingAppId] = React.useState<string | null>(null);

  const [bookmarkedIds, setBookmarkedIds] = React.useState<Set<string>>(
    () =>
      new Set(
        bundle.items.filter((i) => Boolean(i.bookmark)).map((i) => i.opportunity.id)
      )
  );

  function handleBookmarkChanged(opportunityId: string, bookmarked: boolean) {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (bookmarked) next.add(opportunityId);
      else next.delete(opportunityId);
      return next;
    });
  }

  async function handleQuickStatusChange(
    item: MatchedOpportunityItem,
    status: ApplicationStatus
  ) {
    setUpdatingAppId(item.opportunity.id);
    await upsertApplicationAction({
      opportunityId: item.opportunity.id,
      status,
      personalNotes: item.application?.personal_notes ?? "",
      externalReference: item.application?.external_reference ?? "",
      nextReminderDate: item.application?.next_reminder_at
        ? item.application.next_reminder_at.slice(0, 10)
        : "",
    });
    setUpdatingAppId(null);
    router.refresh();
  }

  const savedItems = React.useMemo(
    () => bundle.items.filter((i) => bookmarkedIds.has(i.opportunity.id)),
    [bundle.items, bookmarkedIds]
  );

  const trackedItems = React.useMemo(
    () => bundle.items.filter((i) => Boolean(i.application)),
    [bundle.items]
  );

  const filteredDiscover = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = bundle.items.filter((item) => {
      const opp = item.opportunity;
      if (typeFilter !== "all" && opp.opportunity_type !== typeFilter) return false;
      if (arrangementFilter !== "all" && opp.work_arrangement !== arrangementFilter) {
        return false;
      }
      if (domainFilter !== "all" && !opp.domain_tags.includes(domainFilter)) return false;
      if (eligibleOnly && item.fit.eligibilityStatus === "check_eligibility") return false;
      if (q) {
        const haystack = [
          opp.title,
          opp.organisation_name,
          opp.summary,
          opp.location_label,
          ...opp.requiredSkills.map((s) => s.name),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === "best_match") {
      sorted.sort((a, b) => b.fit.overallScore - a.fit.overallScore);
    } else if (sortBy === "deadline_soonest") {
      sorted.sort((a, b) => {
        const aTime = a.opportunity.deadline_at
          ? new Date(a.opportunity.deadline_at).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bTime = b.opportunity.deadline_at
          ? new Date(b.opportunity.deadline_at).getTime()
          : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.opportunity.created_at).getTime() -
          new Date(a.opportunity.created_at).getTime()
      );
    }
    return sorted;
  }, [
    bundle.items,
    search,
    typeFilter,
    arrangementFilter,
    domainFilter,
    eligibleOnly,
    sortBy,
  ]);

  const tabs: Array<{
    id: WorkspaceTab;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "discover", label: "Discover", count: bundle.items.length, icon: Compass },
    { id: "saved", label: "Saved", count: savedItems.length, icon: Bookmark },
    {
      id: "applications",
      label: "My Applications",
      count: trackedItems.length,
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Verified Global Opportunities
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Explainable readiness matching grounded in your canonical skills and proof-of-work portfolio. Deadlines shown in{" "}
            <strong className="text-ink">{bundle.timezone}</strong>.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/profile">Strengthen Portfolio Evidence</Link>
        </Button>
      </div>

      {/* Transparent Deterministic Matching Notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border-base bg-subtle/60 p-3 text-xs text-ink-secondary">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
        <p>
          <strong className="text-ink">Explainable Readiness Matching:</strong> Scores weigh your{" "}
          <strong>Portfolio-Supported (L2+)</strong> skills, self-reported skills, domains, and{" "}
          {bundle.countryCode ? `${getCountryName(bundle.countryCode)} (${bundle.countryCode})` : "global"}{" "}
          eligibility transparently — never an automated hiring or admission rejection.
        </p>
      </div>

      {/* Workspace Tabs */}
      <nav
        aria-label="Opportunities sections"
        className="flex gap-1.5 overflow-x-auto border-b border-border-base pb-2"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors cursor-pointer ${
                active
                  ? "bg-brand-soft text-brand"
                  : "text-ink-secondary hover:bg-subtle hover:text-ink"
              }`}
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
              <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] text-ink-muted tabular-nums">
                {tab.count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* DISCOVER TAB */}
      {activeTab === "discover" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="relative md:col-span-5">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search roles, scholarships, organisations, or skills..."
                    aria-label="Search opportunities"
                    className="pl-9"
                  />
                </div>

                <select
                  aria-label="Filter by opportunity type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink md:col-span-2"
                >
                  <option value="all">All types</option>
                  {OPPORTUNITY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by work arrangement"
                  value={arrangementFilter}
                  onChange={(e) => setArrangementFilter(e.target.value)}
                  className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink md:col-span-2"
                >
                  <option value="all">All formats</option>
                  {OPPORTUNITY_WORK_ARRANGEMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by domain"
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink md:col-span-3"
                >
                  <option value="all">All domains</option>
                  {DOMAIN_INTERESTS.map((dom) => (
                    <option key={dom.slug} value={dom.slug}>
                      {dom.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-base pt-3 text-xs">
                <label className="inline-flex items-center gap-2 font-medium text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eligibleOnly}
                    onChange={(e) => setEligibleOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-border-strong text-brand"
                  />
                  <span>
                    Eligible for my location only (
                    {bundle.countryCode ? getCountryName(bundle.countryCode) : "Global"})
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-ink-muted">Sort by:</span>
                  <select
                    aria-label="Sort opportunities"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-xs font-medium text-ink"
                  >
                    <option value="best_match">Best Readiness Match</option>
                    <option value="deadline_soonest">Deadline Soonest</option>
                    <option value="newest">Newest Added</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredDiscover.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-6 w-6" />}
              title="No opportunities match your current filters"
              description="Try broadening your keyword search, switching opportunity type, or showing all domains."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                    setArrangementFilter("all");
                    setDomainFilter("all");
                    setEligibleOnly(false);
                  }}
                >
                  Reset Filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredDiscover.map((item) => (
                <OpportunityCard
                  key={item.opportunity.id}
                  item={item}
                  timezone={bundle.timezone}
                  onBookmarkChanged={handleBookmarkChanged}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SAVED TAB */}
      {activeTab === "saved" && (
        <>
          {savedItems.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-6 w-6" />}
              title="No saved opportunities yet"
              description="Bookmark jobs, scholarships, fellowships, grants, or hackathons to build your shortlist."
              action={
                <Button type="button" size="sm" onClick={() => setActiveTab("discover")}>
                  Explore Opportunities
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {savedItems.map((item) => (
                <OpportunityCard
                  key={item.opportunity.id}
                  item={item}
                  timezone={bundle.timezone}
                  onBookmarkChanged={handleBookmarkChanged}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* MY APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <>
          {trackedItems.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="No applications tracked yet"
              description="Open any opportunity to review your skill-gap breakdown and track your status, personal notes, and deadline reminders."
              action={
                <Button type="button" size="sm" onClick={() => setActiveTab("discover")}>
                  Browse Opportunities
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {trackedItems.map((item) => {
                const app = item.application!;
                const deadline = formatDeadlineInTimeZone(
                  item.opportunity.deadline_at,
                  item.opportunity.is_rolling,
                  bundle.timezone
                );
                const statusMeta = APPLICATION_STATUS_OPTIONS.find(
                  (s) => s.value === app.status
                );

                return (
                  <Card key={item.opportunity.id}>
                    <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/opportunities/${item.opportunity.slug}`}
                            className="text-base font-bold text-ink hover:text-brand hover:underline"
                          >
                            {item.opportunity.title}
                          </Link>
                          {statusMeta && (
                            <Badge variant={statusMeta.badgeVariant}>
                              {statusMeta.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-medium text-ink-secondary">
                          {item.opportunity.organisation_name} ·{" "}
                          <span className="tabular-nums">{item.fit.overallScore}% Readiness</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                            {deadline.label} ({deadline.formattedLocal})
                          </span>
                          {app.next_reminder_at && (
                            <span>Reminder: {app.next_reminder_at.slice(0, 10)}</span>
                          )}
                        </div>
                        {app.personal_notes && (
                          <p className="line-clamp-2 pt-1 text-xs text-ink-secondary">
                            {app.personal_notes}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <select
                          aria-label={`Update status for ${item.opportunity.title}`}
                          value={app.status}
                          disabled={updatingAppId === item.opportunity.id}
                          onChange={(e) =>
                            handleQuickStatusChange(
                              item,
                              e.target.value as ApplicationStatus
                            )
                          }
                          className="h-10 rounded-lg border border-border-strong bg-surface px-2.5 text-xs font-medium text-ink"
                        >
                          {APPLICATION_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/opportunities/${item.opportunity.slug}`}>
                            Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
