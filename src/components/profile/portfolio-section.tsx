"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  FolderKanban,
  GitBranch,
  Globe,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
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
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/input";
import { EvidenceUploader } from "@/components/profile/evidence-uploader";
import { SkillPicker } from "@/components/profile/skill-picker";
import type {
  ProjectStatus,
  ProjectType,
  RecordVisibilityScope,
} from "@/lib/supabase/database.types";
import type { CanonicalSkillRow } from "@/modules/graph/skills-repo";
import {
  deletePortfolioProjectAction,
  savePortfolioProjectAction,
} from "@/modules/portfolio/actions";
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  RECORD_VISIBILITY_OPTIONS,
} from "@/modules/portfolio/constants";
import type {
  PortfolioProjectWithDetails,
  ProjectCategoryRow,
} from "@/modules/portfolio/repo";
import { splitLinesOrCsv, splitTags } from "@/modules/portfolio/schemas";

interface PortfolioSectionProps {
  projects: PortfolioProjectWithDetails[];
  categories: ProjectCategoryRow[];
  skillCatalogue: CanonicalSkillRow[];
}

interface ProjectFormState {
  id?: string;
  title: string;
  summary: string;
  description: string;
  categorySlug: string;
  projectType: ProjectType;
  projectStatus: ProjectStatus;
  startDate: string;
  completionDate: string;
  associatedOrganisation: string;
  isCollaborative: boolean;
  memberRole: string;
  memberContribution: string;
  teamMembersText: string;
  outcomesText: string;
  achievementsText: string;
  toolsUsedText: string;
  skillIds: string[];
  projectUrl: string;
  repositoryUrl: string;
  visibilityScope: RecordVisibilityScope;
}

function emptyProjectForm(defaultCategory: string): ProjectFormState {
  return {
    title: "",
    summary: "",
    description: "",
    categorySlug: defaultCategory,
    projectType: "personal",
    projectStatus: "completed",
    startDate: "",
    completionDate: "",
    associatedOrganisation: "",
    isCollaborative: false,
    memberRole: "",
    memberContribution: "",
    teamMembersText: "",
    outcomesText: "",
    achievementsText: "",
    toolsUsedText: "",
    skillIds: [],
    projectUrl: "",
    repositoryUrl: "",
    visibilityScope: "public",
  };
}

function fromProjectRow(project: PortfolioProjectWithDetails): ProjectFormState {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    description: project.description,
    categorySlug: project.category_slug,
    projectType: project.project_type,
    projectStatus: project.project_status,
    startDate: project.start_date ?? "",
    completionDate: project.completion_date ?? "",
    associatedOrganisation: project.associated_organisation,
    isCollaborative: project.is_collaborative,
    memberRole: project.member_role,
    memberContribution: project.member_contribution,
    teamMembersText: project.team_members.join(", "),
    outcomesText: project.outcomes.join("\n"),
    achievementsText: project.achievements.join("\n"),
    toolsUsedText: project.tools_used.join(", "),
    skillIds: project.skills.map((s) => s.skillId),
    projectUrl: project.project_url ?? "",
    repositoryUrl: project.repository_url ?? "",
    visibilityScope: project.visibility_scope,
  };
}

export function PortfolioSection({
  projects,
  categories,
  skillCatalogue,
}: PortfolioSectionProps) {
  const router = useRouter();
  const defaultCategory = categories[0]?.slug ?? "software-development";
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState<ProjectFormState>(() =>
    emptyProjectForm(defaultCategory)
  );
  const [expandedEvidenceId, setExpandedEvidenceId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const visibleProjects = React.useMemo(() => {
    if (activeCategory === "all") return projects;
    return projects.filter((p) => p.category_slug === activeCategory);
  }, [projects, activeCategory]);

  function openNew() {
    setForm(emptyProjectForm(defaultCategory));
    setError(null);
    setFormOpen(true);
  }

  function openEdit(project: PortfolioProjectWithDetails) {
    setForm(fromProjectRow(project));
    setError(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await savePortfolioProjectAction({
      id: form.id,
      title: form.title,
      summary: form.summary,
      description: form.description,
      categorySlug: form.categorySlug,
      projectType: form.projectType,
      projectStatus: form.projectStatus,
      startDate: form.startDate,
      completionDate: form.completionDate,
      associatedOrganisation: form.associatedOrganisation,
      isCollaborative: form.isCollaborative,
      memberRole: form.memberRole,
      memberContribution: form.memberContribution,
      teamMembers: splitTags(form.teamMembersText, 15, 80),
      outcomes: splitLinesOrCsv(form.outcomesText, 10, 240),
      achievements: splitLinesOrCsv(form.achievementsText, 10, 240),
      toolsUsed: splitTags(form.toolsUsedText, 20, 60),
      skillIds: form.skillIds,
      projectUrl: form.projectUrl,
      repositoryUrl: form.repositoryUrl,
      visibilityScope: form.visibilityScope,
    });

    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    setFormOpen(false);
    if (res.data?.id && !form.id) {
      setExpandedEvidenceId(res.data.id);
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Delete this portfolio project and its attached evidence files? Any skills backed solely by this project will revert to Self-Reported."
      )
    ) {
      return;
    }
    setDeletingId(id);
    const res = await deletePortfolioProjectAction(id);
    setDeletingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="portfolio-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="portfolio-heading" className="text-lg font-bold text-ink">
            Proof-of-Work Portfolio &amp; Case Studies
          </h2>
          <p className="text-xs text-ink-secondary">
            Demonstrate capabilities through documented projects linked to canonical skills and supporting evidence.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Project
        </Button>
      </div>

      {/* Category Filter Pills */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter projects by category">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors cursor-pointer ${
              activeCategory === "all"
                ? "bg-brand text-white"
                : "bg-subtle text-ink-secondary hover:text-ink"
            }`}
          >
            All ({projects.length})
          </button>
          {categories
            .filter((cat) => projects.some((p) => p.category_slug === cat.slug))
            .map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors cursor-pointer ${
                  activeCategory === cat.slug
                    ? "bg-brand text-white"
                    : "bg-subtle text-ink-secondary hover:text-ink"
                }`}
              >
                {cat.name}
              </button>
            ))}
        </div>
      )}

      {formOpen && (
        <Card className="border-brand/30 shadow-[var(--shadow-2)]">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>
                  {form.id ? "Edit Portfolio Project" : "Create Portfolio Project / Case Study"}
                </CardTitle>
                <CardDescription>
                  Linking canonical skills marks them as <strong>Portfolio-Supported</strong> (Level 2) without overstating independent assessment.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close project form"
                onClick={() => setFormOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="proj-title" required>
                    Project title
                  </Label>
                  <Input
                    id="proj-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Design and Implementation of a Flood Monitoring Web Application"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proj-category" required>
                    Project category
                  </Label>
                  <select
                    id="proj-category"
                    value={form.categorySlug}
                    onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink"
                  >
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proj-type">Project type</Label>
                  <select
                    id="proj-type"
                    value={form.projectType}
                    onChange={(e) =>
                      setForm({ ...form, projectType: e.target.value as ProjectType })
                    }
                    className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink"
                  >
                    {PROJECT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-summary" required>
                  Executive summary
                </Label>
                <Input
                  id="proj-summary"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Concise overview of the problem solved and what you built or delivered..."
                  maxLength={320}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-description">Detailed case study &amp; approach</Label>
                <textarea
                  id="proj-description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the context, research/design decisions, architecture, trade-offs, and methodology..."
                  maxLength={5000}
                  className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-status">Status</Label>
                  <select
                    id="proj-status"
                    value={form.projectStatus}
                    onChange={(e) =>
                      setForm({ ...form, projectStatus: e.target.value as ProjectStatus })
                    }
                    className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink"
                  >
                    {PROJECT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proj-start">Start date</Label>
                  <Input
                    id="proj-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proj-end">Completion date</Label>
                  <Input
                    id="proj-end"
                    type="date"
                    value={form.completionDate}
                    onChange={(e) => setForm({ ...form, completionDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Explicit Ownership & Attribution Block */}
              <div className="space-y-3 rounded-xl border border-border-base bg-canvas/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Ownership &amp; Contribution Attribution
                    </p>
                    <p className="text-xs text-ink-muted">
                      Clearly distinguish your exact contribution from the overall team outcome.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isCollaborative}
                      onChange={(e) =>
                        setForm({ ...form, isCollaborative: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border-strong text-brand"
                    />
                    <span>Collaborative / Team Project</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="proj-role" required>
                      Your specific role
                    </Label>
                    <Input
                      id="proj-role"
                      value={form.memberRole}
                      onChange={(e) => setForm({ ...form, memberRole: e.target.value })}
                      placeholder="e.g. Lead UI/UX Designer & Frontend Developer"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="proj-org">Associated organisation / client (optional)</Label>
                    <Input
                      id="proj-org"
                      value={form.associatedOrganisation}
                      onChange={(e) =>
                        setForm({ ...form, associatedOrganisation: e.target.value })
                      }
                      placeholder="e.g. Kogi State Climate Initiative / Independent"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proj-contribution" required={form.isCollaborative}>
                    Your specific contribution
                  </Label>
                  <textarea
                    id="proj-contribution"
                    rows={2}
                    value={form.memberContribution}
                    onChange={(e) =>
                      setForm({ ...form, memberContribution: e.target.value })
                    }
                    required={form.isCollaborative}
                    placeholder="What specific deliverables, components, research, or decisions were yours?"
                    className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
                  />
                </div>

                {form.isCollaborative && (
                  <div className="space-y-1.5">
                    <Label htmlFor="proj-team">Collaborators / team members (comma-separated)</Label>
                    <Input
                      id="proj-team"
                      value={form.teamMembersText}
                      onChange={(e) =>
                        setForm({ ...form, teamMembersText: e.target.value })
                      }
                      placeholder="e.g. Ada Nwosu (Backend), Musa Bello (GIS Analyst)"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-outcomes">Measurable outcomes (one per line)</Label>
                  <textarea
                    id="proj-outcomes"
                    rows={3}
                    value={form.outcomesText}
                    onChange={(e) => setForm({ ...form, outcomesText: e.target.value })}
                    placeholder="Reduced flood alert response lag from 4 hours to 12 minutes"
                    className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-achievements">Key achievements (one per line)</Label>
                  <textarea
                    id="proj-achievements"
                    rows={3}
                    value={form.achievementsText}
                    onChange={(e) =>
                      setForm({ ...form, achievementsText: e.target.value })
                    }
                    className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-tools">Tools &amp; technologies used (comma-separated)</Label>
                <Input
                  id="proj-tools"
                  value={form.toolsUsedText}
                  onChange={(e) => setForm({ ...form, toolsUsedText: e.target.value })}
                  placeholder="e.g. React, TypeScript, Figma, PostgreSQL, Leaflet"
                />
              </div>

              <SkillPicker
                idPrefix="proj"
                catalogue={skillCatalogue}
                selectedIds={form.skillIds}
                onChange={(skillIds) => setForm({ ...form, skillIds })}
                label="Canonical skills evidenced by this project"
                helperText="Linking canonical skills elevates them from Self-Reported (Level 1) to Portfolio-Supported (Level 2) without altering your proficiency rating."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="proj-url">Live project / demo URL (optional)</Label>
                  <Input
                    id="proj-url"
                    type="url"
                    value={form.projectUrl}
                    onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-repo">Repository / source URL (optional)</Label>
                  <Input
                    id="proj-repo"
                    type="url"
                    value={form.repositoryUrl}
                    onChange={(e) => setForm({ ...form, repositoryUrl: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-visibility">Project visibility</Label>
                <select
                  id="proj-visibility"
                  value={form.visibilityScope}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      visibilityScope: e.target.value as RecordVisibilityScope,
                    })
                  }
                  className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink"
                >
                  {RECORD_VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.hint}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-text"
                >
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {form.id ? "Save Project Changes" : "Publish Project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {visibleProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="No portfolio projects documented yet"
          description="Turn your real work into structured, evidence-backed proof. Link canonical skills, clarify your contribution, and attach screenshots or PDF case studies."
          action={
            <Button type="button" size="sm" onClick={openNew}>
              Create First Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleProjects.map((project) => {
            const evidenceExpanded = expandedEvidenceId === project.id;
            return (
              <Card key={project.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="primary">{project.categoryName}</Badge>
                      <Badge variant="default" className="capitalize">
                        {project.visibility_scope}
                      </Badge>
                      {project.is_collaborative && (
                        <Badge variant="default" className="gap-1">
                          <Users className="h-3 w-3" aria-hidden="true" />
                          Team
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-medium capitalize text-ink-muted">
                      {project.project_status.replace("_", " ")}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-base">
                    <Link
                      href={`/profile/projects/${project.id}`}
                      className="hover:text-brand hover:underline"
                    >
                      {project.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{project.summary}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-xs text-ink-secondary">
                    <strong className="text-ink">Role:</strong> {project.member_role}
                    {project.associated_organisation
                      ? ` · ${project.associated_organisation}`
                      : ""}
                  </p>

                  {project.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.skills.slice(0, 6).map((skill) => (
                        <Badge key={skill.skillId} variant="default">
                          {skill.name}
                        </Badge>
                      ))}
                      {project.skills.length > 6 && (
                        <Badge variant="default">+{project.skills.length - 6} more</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                      {project.evidenceFiles.length} evidence{" "}
                      {project.evidenceFiles.length === 1 ? "file" : "files"}
                    </span>
                    {project.project_url && (
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                        Live Demo
                      </a>
                    )}
                    {project.repository_url && (
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                      >
                        <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                        Source
                      </a>
                    )}
                  </div>

                  {evidenceExpanded && (
                    <EvidenceUploader
                      entityType="project"
                      parentId={project.id}
                      files={project.evidenceFiles}
                      title="Project Images & PDF Case Studies"
                      defaultVisibility="private"
                    />
                  )}
                </CardContent>

                <CardFooter className="flex-wrap justify-between gap-2 border-t border-border-base pt-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profile/projects/${project.id}`}>
                      Open Case Study
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedEvidenceId(evidenceExpanded ? null : project.id)
                      }
                    >
                      <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                      Files
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(project)}
                      aria-label={`Edit ${project.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={deletingId === project.id}
                      onClick={() => handleDelete(project.id)}
                      aria-label={`Delete ${project.title}`}
                      className="text-danger-text hover:bg-danger-soft"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
