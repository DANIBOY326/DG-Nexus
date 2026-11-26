import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  Briefcase,
  ExternalLink,
  FileText,
  FolderKanban,
  GitBranch,
  Globe,
  Globe2,
  GraduationCap,
  MapPin,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AVAILABILITY_OPTIONS,
  DOMAIN_INTERESTS,
  getCountryName,
} from "@/modules/profiles/constants";
import {
  CREDENTIAL_STATUS_META,
  EDUCATION_PATHWAY_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  SKILL_EVIDENCE_META,
  WORK_ARRANGEMENT_OPTIONS,
} from "@/modules/portfolio/constants";
import { getPublicProfileBundleByHandle } from "@/modules/portfolio/repo";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await props.params;
  const bundle = await getPublicProfileBundleByHandle(handle);

  if (!bundle) {
    return {
      title: "Profile Not Found · DG NEXUS",
      robots: { index: false, follow: false },
    };
  }

  const allowIndex = bundle.profile.allow_search_indexing;

  return {
    title: `${bundle.profile.full_name} — ${bundle.profile.headline || "Professional Profile"} · DG NEXUS`,
    description:
      bundle.profile.bio.slice(0, 155) ||
      `${bundle.profile.full_name}'s structured proof-of-work profile on DG NEXUS.`,
    robots: {
      index: allowIndex,
      follow: allowIndex,
    },
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "DG";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? first;
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default async function PublicProfilePage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  const bundle = await getPublicProfileBundleByHandle(handle);

  // Private, connections-only, or non-existent handles all return 404 (no enumeration)
  if (!bundle) {
    notFound();
  }

  const {
    profile,
    contactLinks,
    avatarSignedUrl,
    skills,
    experiences,
    educations,
    credentials,
    projects,
    signedEvidenceUrls,
  } = bundle;

  const avatarSrc =
    avatarSignedUrl ??
    (profile.avatar_url && profile.avatar_url.startsWith("https://")
      ? profile.avatar_url
      : null);

  const availabilityLabel =
    AVAILABILITY_OPTIONS.find((a) => a.value === profile.availability_status)?.label ??
    profile.availability_status;
  const workArrangementLabel =
    WORK_ARRANGEMENT_OPTIONS.find((w) => w.value === profile.work_arrangement)?.label ??
    profile.work_arrangement;
  const domainLabels = profile.interests.map(
    (slug) => DOMAIN_INTERESTS.find((d) => d.slug === slug)?.label ?? slug
  );

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Public Top Bar */}
      <header className="sticky top-0 z-20 border-b border-border-base bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="DG NEXUS Home">
            <BrandMark size={30} showWordmark />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Join DG NEXUS</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {/* Public Identity Header */}
        <Card className="overflow-hidden">
          <div
            className="h-24 w-full sm:h-28"
            style={{ background: "var(--color-brand-gradient)" }}
            aria-hidden="true"
          />
          <CardContent className="space-y-4 pt-0 pb-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="-mt-12 shrink-0">
                {avatarSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarSrc}
                    alt={profile.full_name}
                    className="h-24 w-24 rounded-2xl border-4 border-surface bg-surface object-cover object-top shadow-[var(--shadow-2)]"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-surface bg-brand-soft text-2xl font-bold text-brand shadow-[var(--shadow-2)]">
                    {getInitials(profile.full_name)}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-3">
                <Badge variant="primary">{availabilityLabel}</Badge>
                <Badge variant="default">{workArrangementLabel}</Badge>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                {profile.full_name}
              </h1>
              {profile.headline && (
                <p className="max-w-3xl text-sm font-medium leading-relaxed text-ink-secondary">
                  {profile.headline}
                </p>
              )}
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
              {profile.current_focus && (
                <span>
                  Focus: <strong className="text-ink">{profile.current_focus}</strong>
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
                {profile.bio}
              </p>
            )}

            {contactLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {contactLinks.map((link, idx) => (
                  <Button key={idx} variant="outline" size="sm" asChild>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.label}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Public Portfolio Projects */}
            <section aria-labelledby="public-portfolio-heading" className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-brand" aria-hidden="true" />
                <h2 id="public-portfolio-heading" className="text-lg font-bold text-ink">
                  Proof-of-Work Portfolio ({projects.length})
                </h2>
              </div>

              {projects.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-sm text-ink-muted">
                    No public portfolio projects shared yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => {
                    const publicImages = project.evidenceFiles.filter(
                      (f) => f.mime_type.startsWith("image/") && signedEvidenceUrls[f.id]
                    );
                    const publicPdfs = project.evidenceFiles.filter(
                      (f) => f.mime_type === "application/pdf" && signedEvidenceUrls[f.id]
                    );

                    return (
                      <Card key={project.id}>
                        <CardHeader>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="primary">{project.categoryName}</Badge>
                            {project.is_collaborative && (
                              <Badge variant="default" className="gap-1">
                                <Users className="h-3 w-3" aria-hidden="true" />
                                Collaborative
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="mt-1 text-lg">{project.title}</CardTitle>
                          <CardDescription>{project.summary}</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <p className="text-xs text-ink-secondary">
                            <strong className="text-ink">Role:</strong> {project.member_role}
                            {project.associated_organisation
                              ? ` · ${project.associated_organisation}`
                              : ""}
                          </p>

                          {project.member_contribution && (
                            <p className="text-sm text-ink-secondary">
                              <strong className="text-ink">Specific contribution:</strong>{" "}
                              {project.member_contribution}
                            </p>
                          )}

                          {project.outcomes.length > 0 && (
                            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-secondary">
                              {project.outcomes.map((o, idx) => (
                                <li key={idx}>{o}</li>
                              ))}
                            </ul>
                          )}

                          {publicImages.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {publicImages.slice(0, 2).map((img) => (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  key={img.id}
                                  src={signedEvidenceUrls[img.id]}
                                  alt={img.caption || img.file_name}
                                  className="h-44 w-full rounded-lg border border-border-base object-cover"
                                />
                              ))}
                            </div>
                          )}

                          {project.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {project.skills.map((skill) => (
                                <Badge key={skill.skillId} variant="default">
                                  {skill.name}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                            {project.project_url && (
                              <a
                                href={project.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                              >
                                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                                Live Project
                              </a>
                            )}
                            {project.repository_url && (
                              <a
                                href={project.repository_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                              >
                                <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                                Source Repository
                              </a>
                            )}
                            {publicPdfs.map((pdf) => (
                              <a
                                key={pdf.id}
                                href={`/api/evidence/${pdf.id}/url?download=1`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                              >
                                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                                {pdf.caption || pdf.file_name}
                              </a>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Public Experience */}
            {experiences.length > 0 && (
              <section aria-labelledby="public-exp-heading" className="space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-brand" aria-hidden="true" />
                  <h2 id="public-exp-heading" className="text-lg font-bold text-ink">
                    Professional Experience
                  </h2>
                </div>
                <div className="space-y-3">
                  {experiences.map((exp) => {
                    const typeLabel =
                      EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === exp.employment_type)
                        ?.label ?? exp.employment_type;
                    return (
                      <Card key={exp.id}>
                        <CardContent className="space-y-2 pt-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-ink">{exp.role_title}</h3>
                            <span className="text-xs text-ink-muted">
                              {exp.start_date.slice(0, 7)} —{" "}
                              {exp.is_current
                                ? "Present"
                                : exp.end_date?.slice(0, 7) ?? "Completed"}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-ink-secondary">
                            {exp.organisation_name} · {typeLabel} ·{" "}
                            <span className="capitalize">{exp.work_arrangement}</span>
                          </p>
                          {exp.description && (
                            <p className="text-sm text-ink-secondary">{exp.description}</p>
                          )}
                          {exp.achievements.length > 0 && (
                            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-secondary">
                              {exp.achievements.map((a, idx) => (
                                <li key={idx}>{a}</li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Public Education */}
            {educations.length > 0 && (
              <section aria-labelledby="public-edu-heading" className="space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-brand" aria-hidden="true" />
                  <h2 id="public-edu-heading" className="text-lg font-bold text-ink">
                    Education &amp; Training
                  </h2>
                </div>
                <div className="space-y-3">
                  {educations.map((edu) => {
                    const pathwayLabel =
                      EDUCATION_PATHWAY_OPTIONS.find((p) => p.value === edu.pathway_type)
                        ?.label ?? edu.pathway_type;
                    return (
                      <Card key={edu.id}>
                        <CardContent className="space-y-1.5 pt-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-ink">{edu.qualification}</h3>
                            <Badge variant="default">{pathwayLabel}</Badge>
                          </div>
                          <p className="text-sm font-medium text-ink-secondary">
                            {edu.institution}
                            {edu.field_of_study ? ` · ${edu.field_of_study}` : ""}
                          </p>
                          <p className="text-xs text-ink-muted tabular-nums">
                            {edu.start_year} —{" "}
                            {edu.end_year ?? (edu.is_current ? "Present" : "Completed")}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Public Right Rail: Skills & Evidence + Credentials */}
          <aside className="space-y-6 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills &amp; Evidence</CardTitle>
                <CardDescription>
                  Explicitly distinguishes self-reported skills from portfolio-supported work.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {skills.length === 0 ? (
                  <p className="text-xs text-ink-muted">No skills listed yet.</p>
                ) : (
                  skills.map((skill) => {
                    const meta = SKILL_EVIDENCE_META[skill.evidenceStatus];
                    return (
                      <div
                        key={skill.skillId}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border-base bg-canvas/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">{skill.name}</p>
                          <p className="text-[11px] capitalize text-ink-muted">
                            {skill.proficiencyLevel}
                            {skill.supportingProjects.length > 0
                              ? ` · ${skill.supportingProjects.length} project${skill.supportingProjects.length === 1 ? "" : "s"}`
                              : ""}
                          </p>
                        </div>
                        <Badge
                          variant={meta.badgeVariant}
                          showIcon={skill.evidenceStatus === "credential_verified"}
                        >
                          {meta.shortLabel}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {credentials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Award className="h-4 w-4 text-brand" aria-hidden="true" />
                    Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {credentials.map((cred) => {
                    const meta = CREDENTIAL_STATUS_META[cred.verification_status];
                    return (
                      <div
                        key={cred.id}
                        className="space-y-1 rounded-lg border border-border-base bg-canvas/50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-ink">{cred.name}</p>
                          <Badge
                            variant={meta.badgeVariant}
                            showIcon={cred.verification_status === "verified"}
                          >
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-secondary">
                          {cred.issuing_organisation}
                        </p>
                        {cred.verification_url && (
                          <a
                            href={cred.verification_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                          >
                            Verification reference
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {domainLabels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Domains</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {domainLabels.map((label) => (
                    <Badge key={label} variant="primary">
                      {label}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
