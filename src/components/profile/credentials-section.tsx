"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Award, ExternalLink, Pencil, Plus, ShieldAlert, Trash2, X } from "lucide-react";
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
import { SkillPicker } from "@/components/profile/skill-picker";
import type { RecordVisibilityScope } from "@/lib/supabase/database.types";
import type { CanonicalSkillRow } from "@/modules/graph/skills-repo";
import {
  deleteCredentialAction,
  saveCredentialAction,
} from "@/modules/portfolio/actions";
import {
  CREDENTIAL_STATUS_META,
  RECORD_VISIBILITY_OPTIONS,
} from "@/modules/portfolio/constants";
import type { CredentialWithDetails } from "@/modules/portfolio/repo";

interface CredentialsSectionProps {
  credentials: CredentialWithDetails[];
  skillCatalogue: CanonicalSkillRow[];
}

interface CredentialFormState {
  id?: string;
  name: string;
  issuingOrganisation: string;
  issueDate: string;
  expiryDate: string;
  credentialIdCode: string;
  verificationUrl: string;
  skillIds: string[];
  visibilityScope: RecordVisibilityScope;
}

function emptyCredentialForm(): CredentialFormState {
  return {
    name: "",
    issuingOrganisation: "",
    issueDate: "",
    expiryDate: "",
    credentialIdCode: "",
    verificationUrl: "",
    skillIds: [],
    visibilityScope: "public",
  };
}

export function CredentialsSection({
  credentials,
  skillCatalogue,
}: CredentialsSectionProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState<CredentialFormState>(emptyCredentialForm);
  const [expandedEvidenceId, setExpandedEvidenceId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function openNew() {
    setForm(emptyCredentialForm());
    setError(null);
    setFormOpen(true);
  }

  function openEdit(row: CredentialWithDetails) {
    setForm({
      id: row.id,
      name: row.name,
      issuingOrganisation: row.issuing_organisation,
      issueDate: row.issue_date ?? "",
      expiryDate: row.expiry_date ?? "",
      credentialIdCode: row.credential_id_code,
      verificationUrl: row.verification_url ?? "",
      skillIds: row.skills.map((s) => s.skillId),
      visibilityScope: row.visibility_scope,
    });
    setError(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await saveCredentialAction({
      id: form.id,
      name: form.name,
      issuingOrganisation: form.issuingOrganisation,
      issueDate: form.issueDate,
      expiryDate: form.expiryDate,
      credentialIdCode: form.credentialIdCode,
      verificationUrl: form.verificationUrl,
      skillIds: form.skillIds,
      visibilityScope: form.visibilityScope,
    });

    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }

    setFormOpen(false);
    if (res.data?.id && !form.id) {
      // Immediately open file uploader so member can attach certificate privately
      setExpandedEvidenceId(res.data.id);
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this credential and any attached certificate files?")) return;
    setDeletingId(id);
    const res = await deleteCredentialAction(id);
    setDeletingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="credentials-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="credentials-heading" className="text-lg font-bold text-ink">
            Certifications &amp; Credentials
          </h2>
          <p className="text-xs text-ink-secondary">
            Uploaded certificates are marked as <strong className="text-ink">Evidence Submitted</strong> — never automatically verified until an authorised check completes.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Credential
        </Button>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-border-base bg-subtle/60 p-3 text-xs text-ink-secondary">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
        <p>
          <strong className="text-ink">Verification Integrity:</strong> Members cannot self-assign a{" "}
          <em>Verified</em> status. Records remain <em>Self-Reported</em> or{" "}
          <em>Evidence Submitted</em> until an authoritative verification workflow confirms them.
          Attached certificates default to <strong>Private</strong> storage.
        </p>
      </div>

      {formOpen && (
        <Card className="border-brand/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{form.id ? "Edit Credential" : "Add Certification or Credential"}</CardTitle>
                <CardDescription>
                  Save the credential first, then upload supporting PDF or image certificates to private storage.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close credential form"
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
                  <Label htmlFor="cred-name" required>
                    Credential name
                  </Label>
                  <Input
                    id="cred-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. AWS Solutions Architect Associate"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cred-issuer" required>
                    Issuing organisation
                  </Label>
                  <Input
                    id="cred-issuer"
                    value={form.issuingOrganisation}
                    onChange={(e) =>
                      setForm({ ...form, issuingOrganisation: e.target.value })
                    }
                    placeholder="e.g. Amazon Web Services"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cred-issue">Issue date</Label>
                  <Input
                    id="cred-issue"
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cred-expiry">Expiry date (optional)</Label>
                  <Input
                    id="cred-expiry"
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cred-id">Credential ID (optional)</Label>
                  <Input
                    id="cred-id"
                    value={form.credentialIdCode}
                    onChange={(e) =>
                      setForm({ ...form, credentialIdCode: e.target.value })
                    }
                    placeholder="e.g. CERT-2026-9041"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cred-url">Official verification URL (optional)</Label>
                <Input
                  id="cred-url"
                  type="url"
                  value={form.verificationUrl}
                  onChange={(e) => setForm({ ...form, verificationUrl: e.target.value })}
                  placeholder="https://www.credly.com/badges/..."
                />
              </div>

              <SkillPicker
                idPrefix="cred"
                catalogue={skillCatalogue}
                selectedIds={form.skillIds}
                onChange={(skillIds) => setForm({ ...form, skillIds })}
                label="Related canonical skills"
                maxSelection={12}
              />

              <div className="space-y-1.5">
                <Label htmlFor="cred-visibility">Record visibility</Label>
                <select
                  id="cred-visibility"
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
                  {form.id ? "Save Changes" : "Save Credential"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {credentials.length === 0 ? (
        <EmptyState
          icon={<Award className="h-6 w-6" />}
          title="No credentials recorded yet"
          description="Document certifications, licences, or professional credentials with optional verification URLs and private supporting certificates."
          action={
            <Button type="button" size="sm" onClick={openNew}>
              Add First Credential
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {credentials.map((cred) => {
            const statusMeta = CREDENTIAL_STATUS_META[cred.verification_status];
            const evidenceExpanded = expandedEvidenceId === cred.id;
            return (
              <Card key={cred.id}>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink">{cred.name}</h3>
                        <Badge
                          variant={statusMeta.badgeVariant}
                          showIcon={cred.verification_status === "verified"}
                          title={statusMeta.description}
                        >
                          {statusMeta.label}
                        </Badge>
                        <Badge variant="default" className="capitalize">
                          {cred.visibility_scope}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-ink-secondary">
                        {cred.issuing_organisation}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {cred.issue_date ? `Issued ${cred.issue_date}` : "Issue date not specified"}
                        {cred.expiry_date ? ` · Expires ${cred.expiry_date}` : ""}
                        {cred.credential_id_code ? ` · ID: ${cred.credential_id_code}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {cred.verification_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={cred.verification_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            Verify Link
                          </a>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedEvidenceId(evidenceExpanded ? null : cred.id)
                        }
                      >
                        Certificates ({cred.evidenceFiles.length})
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(cred)}
                        aria-label={`Edit ${cred.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={deletingId === cred.id}
                        onClick={() => handleDelete(cred.id)}
                        aria-label={`Delete ${cred.name}`}
                        className="text-danger-text hover:bg-danger-soft"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  {cred.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cred.skills.map((skill) => (
                        <Badge key={skill.skillId} variant="primary">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {evidenceExpanded && (
                    <EvidenceUploader
                      entityType="credential"
                      parentId={cred.id}
                      files={cred.evidenceFiles}
                      title="Supporting Certificate Files (Private by Default)"
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
