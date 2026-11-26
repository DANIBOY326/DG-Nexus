"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Lock,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EvidenceEntityType, RecordVisibilityScope } from "@/lib/supabase/database.types";
import { updateEvidenceVisibilityAction } from "@/modules/portfolio/actions";
import type { EvidenceFileRow } from "@/modules/portfolio/repo";

interface EvidenceUploaderProps {
  entityType: Exclude<EvidenceEntityType, "avatar">;
  parentId: string;
  files: EvidenceFileRow[];
  title?: string;
  defaultVisibility?: RecordVisibilityScope;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function EvidenceUploader({
  entityType,
  parentId,
  files,
  title = "Supporting Evidence Files",
  defaultVisibility = "private",
}: EvidenceUploaderProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [caption, setCaption] = React.useState("");
  const [visibility, setVisibility] = React.useState<RecordVisibilityScope>(defaultVisibility);
  const [uploading, setUploading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("parentId", parentId);
      formData.append("caption", caption.trim());
      formData.append("visibilityScope", visibility);

      const response = await fetch("/api/evidence/upload", {
        method: "POST",
        body: formData,
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Upload failed. Check file type and size.");
        return;
      }

      setCaption("");
      setSuccess("Evidence file uploaded securely to private storage.");
      router.refresh();
    } catch {
      setError("Network error while uploading file. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleVisibilityChange(
    fileId: string,
    nextVisibility: RecordVisibilityScope
  ) {
    setBusyId(fileId);
    setError(null);
    setSuccess(null);
    try {
      const res = await updateEvidenceVisibilityAction({
        evidenceId: fileId,
        visibilityScope: nextVisibility,
      });
      if (!res.ok) {
        setError(res.error);
      } else {
        setSuccess("File visibility updated.");
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(fileId: string) {
    setBusyId(fileId);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/evidence/${fileId}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not delete file.");
        return;
      }
      setSuccess("Evidence file permanently removed.");
      router.refresh();
    } catch {
      setError("Network error while deleting file.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border-base bg-canvas/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-ink">{title}</h4>
          <p className="text-xs text-ink-muted">
            Permitted: JPEG, PNG, WebP (up to 5 MB) or PDF (up to 10 MB). Stored in private storage
            with short-lived signed access.
          </p>
        </div>
        <Badge variant="default" className="gap-1">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Signed Access Only
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
        <div className="sm:col-span-5">
          <Input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional file caption or description"
            aria-label="Evidence file caption"
            maxLength={240}
          />
        </div>
        <div className="sm:col-span-4">
          <select
            aria-label="New file visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as RecordVisibilityScope)}
            className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand"
          >
            <option value="private">Private (only you — recommended)</option>
            <option value="connections">Connections (owner-only until M5)</option>
            <option value="public">Public (only if parent &amp; profile are Public)</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="sr-only"
            id={`evidence-upload-${entityType}-${parentId}`}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload File
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger-text"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs text-success-text"
        >
          {success}
        </div>
      )}

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file) => {
            const isPdf = file.mime_type === "application/pdf";
            return (
              <li
                key={file.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-base bg-surface px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-subtle text-brand">
                    {isPdf ? (
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ImageIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{file.file_name}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {formatBytes(file.file_size_bytes)}
                      {file.caption ? ` · ${file.caption}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`Visibility for ${file.file_name}`}
                    value={file.visibility_scope}
                    disabled={busyId === file.id}
                    onChange={(e) =>
                      handleVisibilityChange(
                        file.id,
                        e.target.value as RecordVisibilityScope
                      )
                    }
                    className="h-9 rounded-lg border border-border-strong bg-surface px-2 text-xs text-ink"
                  >
                    <option value="private">Private</option>
                    <option value="connections">Connections</option>
                    <option value="public">Public</option>
                  </select>

                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`/api/evidence/${file.id}/url`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      {isPdf ? "Download" : "Open"}
                    </a>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busyId === file.id}
                    onClick={() => handleDelete(file.id)}
                    aria-label={`Delete ${file.file_name}`}
                    className="text-danger-text hover:bg-danger-soft"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-ink-muted">No files attached yet.</p>
      )}
    </div>
  );
}
