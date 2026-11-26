"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Briefcase,
  ExternalLink,
  FolderKanban,
  Globe2,
  GraduationCap,
  Layers,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
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
import { CompletenessCard } from "@/components/profile/completeness-card";
import { CredentialsSection } from "@/components/profile/credentials-section";
import { EducationSection } from "@/components/profile/education-section";
import { ExperienceSection } from "@/components/profile/experience-section";
import { PortfolioSection } from "@/components/profile/portfolio-section";
import { ProfileCoreEditor } from "@/components/profile/profile-core-editor";
import type { CanonicalSkillRow } from "@/modules/graph/skills-repo";
import {
  AVAILABILITY_OPTIONS,
  DOMAIN_INTERESTS,
  getCountryName,
} from "@/modules/profiles/constants";
import {
  SKILL_EVIDENCE_META,
  WORK_ARRANGEMENT_OPTIONS,
} from "@/modules/portfolio/constants";
import type {
  MemberPortfolioBundle,
  ProjectCategoryRow,
} from "@/modules/portfolio/repo";

type ProfileTab = "overview" | "portfolio" | "experience" | "education" | "credentials";

interface ProfileWorkspaceProps {
  bundle: MemberPortfolioBundle;
  categories: ProjectCategoryRow[];
  skillCatalogue: CanonicalSkillRow[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "DG";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? first;
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function ProfileWorkspace({
  bundle,
  categories,
  skillCatalogue,
}: ProfileWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState<ProfileTab>("overview");
  const [editingProfile, setEditingProfile] = React.useState(false);

  const { profile, skills, experiences, educations, credentials, projects, completeness } =
    bundle;

  const availabilityLabel =
    AVAILABILITY_OPTIONS.find((a) => a.value === profile.availability_status)?.label ??
    profile.availability_status;
  const workArrangementLabel =
    WORK_ARRANGEMENT_OPTIONS.find((w) => w.value === profile.work_arrangement)?.label ??
    profile.work_arrangement;
  const domainLabels = (profile.interests ?? []).map(
    (slug) => DOMAIN_INTERESTS.find((d) => d.slug === slug)?.label ?? slug
  );
  const portfolioSupportedCount = skills.filter(
    (s) => s.evidenceStatus !== "self_reported"
  ).length;

  const tabs: Array<{
    id: ProfileTab;
    label: string;
    count?: number;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "portfolio", label: "Portfolio", count: projects.length, icon: FolderKanban },
    { id: "experience", label: "Experience", count: experiences.length, icon: Briefcase },
    { id: "education", label: "Education", count: educations.length, icon: GraduationCap },
    { id: "credentials", label: "Credentials", count: credentials.length, icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Structured Professional Header */}
      <Card className="overflow-hidden">
        <div
          className="h-24 w-full"
          style={{ background: "var(--color-brand-gradient)" }}
          aria-hidden="true"
        />
        <CardContent className="-mt-12 space-y-4 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {profile.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Member avatar"}
                  className="h-20 w-20 rounded-2xl border-4 border-surface bg-surface object-cover shadow-[var(--shadow-2)]"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-surface bg-brand-soft text-xl font-bold text-brand shadow-[var(--shadow-2)]">
                  {getInitials(profile.full_name)}
                </div>
              )}

              <div className="pb-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    {profile.full_name || "Complete your profile"}
                  </h1>
                  <Badge variant="default" className="capitalize">
                    {profile.visibility_scope}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm font-medium text-ink-secondary">
                  {profile.headline || "Add a professional headline to describe your craft."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {profile.handle && profile.visibility_scope === "public" && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/u/${profile.handle}`} target="_blank">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Public Profile
                  </Link>
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => setEditingProfile((prev) => !prev)}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                {editingProfile ? "Close Editor" : "Edit Profile"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-secondary">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
              {profile.city
                ? `${profile.city}, ${getCountryName(profile.country_code)}`
                : getCountryName(profile.country_code)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
              {profile.timezone}
            </span>
            <Badge variant="primary">{availabilityLabel}</Badge>
            <Badge variant="default">{workArrangementLabel}</Badge>
            {profile.handle ? (
              <span className="font-mono text-[11px] text-ink-muted">/u/{profile.handle}</span>
            ) : (
              <button
                type="button"
                onClick={() => setEditingProfile(true)}
                className="text-xs font-semibold text-brand hover:underline cursor-pointer"
              >
                + Claim public /u/handle
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {editingProfile && (
        <ProfileCoreEditor
          profile={profile}
          initialContactLinks={bundle.contactLinks}
          onClose={() => setEditingProfile(false)}
        />
      )}

      {/* Responsive Horizontal Tab Bar */}
      <nav
        aria-label="Profile sections"
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
              {typeof tab.count === "number" && (
                <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] text-ink-muted tabular-nums">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content + Desktop Contextual Rail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {activeTab === "overview" && (
            <>
              {/* Professional Introduction & External Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Introduction</CardTitle>
                  {profile.current_focus && (
                    <CardDescription>
                      Current focus: <strong className="text-ink">{profile.current_focus}</strong>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.bio ? (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
                      {profile.bio}
                    </p>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border-strong bg-canvas/50 p-4 text-sm text-ink-muted">
                      Add a concise professional biography describing your background, strengths, and focus areas.{" "}
                      <button
                        type="button"
                        onClick={() => setEditingProfile(true)}
                        className="font-semibold text-brand hover:underline cursor-pointer"
                      >
                        Write bio
                      </button>
                    </div>
                  )}

                  {profile.achievements.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Selected Achievements
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-secondary">
                        {profile.achievements.map((ach, idx) => (
                          <li key={idx}>{ach}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {domainLabels.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Domains &amp; Areas of Expertise
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

                  {bundle.contactLinks.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        External Portfolio &amp; Professional Links
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {bundle.contactLinks.map((link, idx) => (
                          <Button key={idx} variant="outline" size="sm" asChild>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              {link.label}
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Evidence-Backed Canonical Skills Matrix */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle>Canonical Skills &amp; Evidence Levels</CardTitle>
                      <CardDescription>
                        Distinguishes self-reported declarations from portfolio-supported capabilities.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/onboarding?revisit=1">Manage Skills</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {skills.length === 0 ? (
                    <p className="text-sm text-ink-muted">
                      No canonical skills selected yet. Complete Step 3 of onboarding or link skills to a portfolio project.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {skills.map((skill) => {
                        const meta = SKILL_EVIDENCE_META[skill.evidenceStatus];
                        return (
                          <div
                            key={skill.skillId}
                            className="rounded-xl border border-border-base bg-canvas/50 p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-ink">{skill.name}</p>
                                <p className="text-[11px] capitalize text-ink-muted">
                                  {skill.category} · {skill.proficiencyLevel}
                                </p>
                              </div>
                              <Badge
                                variant={meta.badgeVariant}
                                showIcon={skill.evidenceStatus === "credential_verified"}
                                title={meta.description}
                              >
                                L{meta.level} · {meta.shortLabel}
                              </Badge>
                            </div>
                            {skill.supportingProjects.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border-base pt-2">
                                {skill.supportingProjects.map((proj) => (
                                  <Link
                                    key={proj.id}
                                    href={`/profile/projects/${proj.id}`}
                                    className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-brand hover:underline"
                                  >
                                    <FolderKanban className="h-3 w-3" aria-hidden="true" />
                                    {proj.title}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Featured Portfolio Projects Preview */}
              <PortfolioSection
                projects={projects}
                categories={categories}
                skillCatalogue={skillCatalogue}
              />
            </>
          )}

          {activeTab === "portfolio" && (
            <PortfolioSection
              projects={projects}
              categories={categories}
              skillCatalogue={skillCatalogue}
            />
          )}

          {activeTab === "experience" && (
            <ExperienceSection
              experiences={experiences}
              skillCatalogue={skillCatalogue}
            />
          )}

          {activeTab === "education" && <EducationSection educations={educations} />}

          {activeTab === "credentials" && (
            <CredentialsSection
              credentials={credentials}
              skillCatalogue={skillCatalogue}
            />
          )}
        </div>

        {/* Right Contextual Rail */}
        <aside className="space-y-4 lg:col-span-4" aria-label="Profile status and governance">
          <CompletenessCard report={completeness} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
                Evidence Graph Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-ink-secondary">
              <div className="flex items-center justify-between">
                <span>Portfolio Projects</span>
                <strong className="text-ink tabular-nums">{projects.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Evidence-Backed Skills (L2+)</span>
                <strong className="text-ink tabular-nums">
                  {portfolioSupportedCount} / {skills.length}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Experience Records</span>
                <strong className="text-ink tabular-nums">{experiences.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Education Pathways</span>
                <strong className="text-ink tabular-nums">{educations.length}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Credentials Recorded</span>
                <strong className="text-ink tabular-nums">{credentials.length}</strong>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-brand" aria-hidden="true" />
                Privacy &amp; Data Governance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-ink-secondary">
              <p>
                Overall visibility is <strong className="capitalize text-ink">{profile.visibility_scope}</strong>.
                Individual roles, projects, and uploaded files can be set even more restrictively — never more open than your profile.
              </p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/settings">Manage Privacy &amp; Export</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
