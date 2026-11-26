"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { EvidenceUploader } from "@/components/profile/evidence-uploader";
import type {
  EducationPathwayType,
  RecordVisibilityScope,
} from "@/lib/supabase/database.types";
import {
  deleteEducationAction,
  saveEducationAction,
} from "@/modules/portfolio/actions";
import {
  EDUCATION_PATHWAY_OPTIONS,
  RECORD_VISIBILITY_OPTIONS,
} from "@/modules/portfolio/constants";
import type { EducationWithDetails } from "@/modules/portfolio/repo";
import { splitLinesOrCsv } from "@/modules/portfolio/schemas";

interface EducationSectionProps {
  educations: EducationWithDetails[];
}

interface EducationFormState {
  id?: string;
  institution: string;
  qualification: string;
  pathwayType: EducationPathwayType;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  isCurrent: boolean;
  description: string;
  achievementsText: string;
  visibilityScope: RecordVisibilityScope;
}

function emptyEducationForm(): EducationFormState {
  return {
    institution: "",
    qualification: "",
    pathwayType: "degree",
    fieldOfStudy: "",
    startYear: String(new Date().getFullYear()),
    endYear: "",
    isCurrent: false,
    description: "",
    achievementsText: "",
    visibilityScope: "public",
  };
}

export function EducationSection({ educations }: EducationSectionProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState<EducationFormState>(emptyEducationForm);
  const [expandedEvidenceId, setExpandedEvidenceId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function openNew() {
    setForm(emptyEducationForm());
    setError(null);
    setFormOpen(true);
  }

  function openEdit(row: EducationWithDetails) {
    setForm({
      id: row.id,
      institution: row.institution,
      qualification: row.qualification,
      pathwayType: row.pathway_type,
      fieldOfStudy: row.field_of_study,
      startYear: String(row.start_year),
      endYear: row.end_year ? String(row.end_year) : "",
      isCurrent: row.is_current,
      description: row.description,
      achievementsText: row.achievements.join("\n"),
      visibilityScope: row.visibility_scope,
    });
    setError(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await saveEducationAction({
      id: form.id,
      institution: form.institution,
      qualification: form.qualification,
      pathwayType: form.pathwayType,
      fieldOfStudy: form.fieldOfStudy,
      startYear: Number(form.startYear),
      endYear: form.endYear.trim() ? Number(form.endYear) : null,
      isCurrent: form.isCurrent,
      description: form.description,
      achievements: splitLinesOrCsv(form.achievementsText, 8, 220),
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
    if (!window.confirm("Remove this education record?")) return;
    setDeletingId(id);
    const res = await deleteEducationAction(id);
    setDeletingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="education-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="education-heading" className="text-lg font-bold text-ink">
            Education &amp; Learning Pathways
          </h2>
          <p className="text-xs text-ink-secondary">
            Degrees, diplomas, bootcamps, vocational training, and structured programmes.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Education
        </Button>
      </div>

      {formOpen && (
        <Card className="border-brand/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{form.id ? "Edit Education" : "Add Education or Training"}</CardTitle>
                <CardDescription>
                  DG NEXUS recognises university, vocational, bootcamp, and professional pathways equally.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close education form"
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
                  <Label htmlFor="edu-institution" required>
                    Institution / Training Provider
                  </Label>
                  <Input
                    id="edu-institution"
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    placeholder="e.g. Federal University Lokoja / ALX Africa"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edu-pathway">Learning pathway</Label>
                  <select
                    id="edu-pathway"
                    value={form.pathwayType}
                    onChange={(e) =>
                      setForm({ ...form, pathwayType: e.target.value as EducationPathwayType })
                    }
                    className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink"
                  >
                    {EDUCATION_PATHWAY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edu-qualification" required>
                    Qualification / Programme
                  </Label>
                  <Input
                    id="edu-qualification"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    placeholder="e.g. B.Sc. / Product Design Fellowship"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edu-field">Field of study</Label>
                  <Input
                    id="edu-field"
                    value={form.fieldOfStudy}
                    onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
                    placeholder="e.g. Computer Science / Visual Communication"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edu-start-year" required>
                    Start year
                  </Label>
                  <Input
                    id="edu-start-year"
                    type="number"
                    min={1950}
                    max={2100}
                    value={form.startYear}
                    onChange={(e) => setForm({ ...form, startYear: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edu-end-year">Completion / Expected year</Label>
                  <Input
                    id="edu-end-year"
                    type="number"
                    min={1950}
                    max={2100}
                    value={form.endYear}
                    onChange={(e) => setForm({ ...form, endYear: e.target.value })}
                    placeholder="e.g. 2027"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isCurrent}
                      onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
                      className="h-4 w-4 rounded border-border-strong text-brand"
                    />
                    <span>Currently studying</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edu-desc">Programme summary</Label>
                <textarea
                  id="edu-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edu-ach">Notable achievements or projects (one per line)</Label>
                <textarea
                  id="edu-ach"
                  rows={2}
                  value={form.achievementsText}
                  onChange={(e) => setForm({ ...form, achievementsText: e.target.value })}
                  className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edu-visibility">Record visibility</Label>
                <select
                  id="edu-visibility"
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
                  {form.id ? "Save Changes" : "Add Education"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {educations.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-6 w-6" />}
          title="No education or training added yet"
          description="Document university degrees, diplomas, vocational training, bootcamps, or structured professional programmes."
          action={
            <Button type="button" size="sm" onClick={openNew}>
              Add First Education
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {educations.map((edu) => {
            const pathwayLabel =
              EDUCATION_PATHWAY_OPTIONS.find((p) => p.value === edu.pathway_type)?.label ??
              edu.pathway_type;
            const evidenceExpanded = expandedEvidenceId === edu.id;
            return (
              <Card key={edu.id}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink">{edu.qualification}</h3>
                        <Badge variant="default">{pathwayLabel}</Badge>
                        {edu.is_current && <Badge variant="primary">In Progress</Badge>}
                        <Badge variant="default" className="capitalize">
                          {edu.visibility_scope}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-ink-secondary">
                        {edu.institution}
                        {edu.field_of_study ? ` · ${edu.field_of_study}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted tabular-nums">
                        {edu.start_year} —{" "}
                        {edu.end_year
                          ? edu.is_current
                            ? `Expected ${edu.end_year}`
                            : edu.end_year
                          : edu.is_current
                            ? "Present"
                            : "Completed"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedEvidenceId(evidenceExpanded ? null : edu.id)
                        }
                      >
                        Files ({edu.evidenceFiles.length})
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(edu)}
                        aria-label={`Edit ${edu.qualification}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={deletingId === edu.id}
                        onClick={() => handleDelete(edu.id)}
                        aria-label={`Delete ${edu.qualification}`}
                        className="text-danger-text hover:bg-danger-soft"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  {edu.description && (
                    <p className="text-sm text-ink-secondary">{edu.description}</p>
                  )}

                  {edu.achievements.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-ink-secondary">
                      {edu.achievements.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {evidenceExpanded && (
                    <EvidenceUploader
                      entityType="education"
                      parentId={edu.id}
                      files={edu.evidenceFiles}
                      title="Supporting Transcripts or Completion Letters"
                      defaultVisibility="private"
                    />
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
