"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Calendar, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/input";
import { SkillPicker } from "@/components/profile/skill-picker";
import type {
  EmploymentType,
  RecordVisibilityScope,
  RoleWorkArrangement,
} from "@/lib/supabase/database.types";
import type { CanonicalSkillRow } from "@/modules/graph/skills-repo";
import {
  deleteExperienceAction,
  saveExperienceAction,
} from "@/modules/portfolio/actions";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  RECORD_VISIBILITY_OPTIONS,
  ROLE_WORK_ARRANGEMENT_OPTIONS,
} from "@/modules/portfolio/constants";
import type { ExperienceWithSkills } from "@/modules/portfolio/repo";
import { splitLinesOrCsv } from "@/modules/portfolio/schemas";

interface ExperienceSectionProps {
  experiences: ExperienceWithSkills[];
  skillCatalogue: CanonicalSkillRow[];
}

interface ExperienceFormState {
  id?: string;
  organisationName: string;
  roleTitle: string;
  employmentType: EmploymentType;
  location: string;
  workArrangement: RoleWorkArrangement;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  responsibilitiesText: string;
  achievementsText: string;
  skillIds: string[];
  visibilityScope: RecordVisibilityScope;
}

function emptyExperienceForm(): ExperienceFormState {
  return {
    organisationName: "",
    roleTitle: "",
    employmentType: "full_time",
    location: "",
    workArrangement: "hybrid",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
    responsibilitiesText: "",
    achievementsText: "",
    skillIds: [],
    visibilityScope: "public",
  };
}

function fromExperienceRow(row: ExperienceWithSkills): ExperienceFormState {
  return {
    id: row.id,
    organisationName: row.organisation_name,
    roleTitle: row.role_title,
    employmentType: row.employment_type,
    location: row.location,
    workArrangement: row.work_arrangement,
    startDate: row.start_date,
    endDate: row.end_date ?? "",
    isCurrent: row.is_current,
    description: row.description,
    responsibilitiesText: row.responsibilities.join("\n"),
    achievementsText: row.achievements.join("\n"),
    skillIds: row.skills.map((s) => s.skillId),
    visibilityScope: row.visibility_scope,
  };
}

function formatMonthYear(dateStr: string): string {
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ExperienceSection({
  experiences,
  skillCatalogue,
}: ExperienceSectionProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState<ExperienceFormState>(emptyExperienceForm);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function openNew() {
    setForm(emptyExperienceForm());
    setError(null);
    setFormOpen(true);
  }

  function openEdit(row: ExperienceWithSkills) {
    setForm(fromExperienceRow(row));
    setError(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await saveExperienceAction({
      id: form.id,
      organisationName: form.organisationName,
      roleTitle: form.roleTitle,
      employmentType: form.employmentType,
      location: form.location,
      workArrangement: form.workArrangement,
      startDate: form.startDate,
      endDate: form.isCurrent ? "" : form.endDate,
      isCurrent: form.isCurrent,
      description: form.description,
      responsibilities: splitLinesOrCsv(form.responsibilitiesText, 10, 220),
      achievements: splitLinesOrCsv(form.achievementsText, 10, 220),
      skillIds: form.skillIds,
      visibilityScope: form.visibilityScope,
    });

    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    setFormOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this professional experience record?")) return;
    setDeletingId(id);
    setError(null);
    const res = await deleteExperienceAction(id);
    setDeletingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="experience-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="experience-heading" className="text-lg font-bold text-ink">
            Professional Experience
          </h2>
          <p className="text-xs text-ink-secondary">
            Roles, fellowships, freelance work, and internships with per-record visibility.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Experience
        </Button>
      </div>

      {error && !formOpen && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-text"
        >
          {error}
        </div>
      )}

      {formOpen && (
        <Card className="border-brand/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{form.id ? "Edit Experience" : "Add Professional Experience"}</CardTitle>
                <CardDescription>
                  Control whether each role is Public, Connections-only, or Private.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close experience form"
                onClick={() => setFormOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="exp-role" required>
                    Job title / Role
                  </Label>
                  <Input
                    id="exp-role"
                    value={form.roleTitle}
                    onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
                    placeholder="e.g. Senior UI/UX Designer"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exp-org" required>
                    Organisation / Employer
                  </Label>
                  <Input
                    id="exp-org"
                    value={form.organisationName}
                    onChange={(e) => setForm({ ...form, organisationName: e.target.value })}
                    placeholder="e.g. DGConcept Studio"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="exp-type">Employment type</Label>
                  <select
                    id="exp-type"
                    value={form.employmentType}
                    onChange={(e) =>
                      setForm({ ...form, employmentType: e.target.value as EmploymentType })
                    }
                    className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink"
                  >
                    {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="exp-arrangement">Work arrangement</Label>
                  <select
                    id="exp-arrangement"
                    value={form.workArrangement}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        workArrangement: e.target.value as RoleWorkArrangement,
                      })
                    }
                    className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink"
                  >
                    {ROLE_WORK_ARRANGEMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="exp-location">Location</Label>
                  <Input
                    id="exp-location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Lagos, Nigeria"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="exp-start" required>
                    Start date
                  </Label>
                  <Input
                    id="exp-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="exp-end">End date</Label>
                  <Input
                    id="exp-end"
                    type="date"
                    disabled={form.isCurrent}
                    value={form.isCurrent ? "" : form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isCurrent}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          isCurrent: e.target.checked,
                          endDate: e.target.checked ? "" : form.endDate,
                        })
                      }
                      className="h-4 w-4 rounded border-border-strong text-brand"
                    />
                    <span>I currently hold this role</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp-desc">Role summary</Label>
                <textarea
                  id="exp-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Context, scope, and core mission of your role..."
                  className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="exp-resp">Key responsibilities (one per line)</Label>
                  <textarea
                    id="exp-resp"
                    rows={3}
                    value={form.responsibilitiesText}
                    onChange={(e) =>
                      setForm({ ...form, responsibilitiesText: e.target.value })
                    }
                    className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exp-ach">Key achievements (one per line)</Label>
                  <textarea
                    id="exp-ach"
                    rows={3}
                    value={form.achievementsText}
                    onChange={(e) =>
                      setForm({ ...form, achievementsText: e.target.value })
                    }
                    className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
                  />
                </div>
              </div>

              <SkillPicker
                idPrefix="exp"
                catalogue={skillCatalogue}
                selectedIds={form.skillIds}
                onChange={(skillIds) => setForm({ ...form, skillIds })}
                label="Canonical skills applied in this role"
              />

              <div className="space-y-1.5">
                <Label htmlFor="exp-visibility">Record visibility</Label>
                <select
                  id="exp-visibility"
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
                  {form.id ? "Save Changes" : "Add Experience"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {experiences.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="No professional experience documented yet"
          description="Add roles, fellowships, consulting engagements, or internships. You can keep sensitive employers Private at any time."
          action={
            <Button type="button" size="sm" onClick={openNew}>
              Add First Experience
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => {
            const typeLabel =
              EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === exp.employment_type)?.label ??
              exp.employment_type;
            return (
              <Card key={exp.id}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink">{exp.role_title}</h3>
                        {exp.is_current && <Badge variant="verified">Current</Badge>}
                        <Badge variant="default" className="capitalize">
                          {exp.visibility_scope}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-ink-secondary">
                        {exp.organisation_name} · {typeLabel}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatMonthYear(exp.start_date)} —{" "}
                          {exp.is_current
                            ? "Present"
                            : exp.end_date
                              ? formatMonthYear(exp.end_date)
                              : "Completed"}
                        </span>
                        <span className="inline-flex items-center gap-1 capitalize">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {exp.location ? `${exp.location} (${exp.work_arrangement})` : exp.work_arrangement}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(exp)}
                        aria-label={`Edit ${exp.role_title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={deletingId === exp.id}
                        onClick={() => handleDelete(exp.id)}
                        aria-label={`Delete ${exp.role_title}`}
                        className="text-danger-text hover:bg-danger-soft"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  {exp.description && (
                    <p className="text-sm leading-relaxed text-ink-secondary">{exp.description}</p>
                  )}

                  {exp.achievements.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Key Achievements
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-secondary">
                        {exp.achievements.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exp.responsibilities.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Responsibilities
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-secondary">
                        {exp.responsibilities.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {exp.skills.map((skill) => (
                        <Badge key={skill.skillId} variant="primary">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
