"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type {
  AvailabilityStatus,
  RecordVisibilityScope,
  WorkArrangement,
} from "@/lib/supabase/database.types";
import {
  AVAILABILITY_OPTIONS,
  getSupportedTimeZones,
  ISO_COUNTRIES,
} from "@/modules/profiles/constants";
import type { ProfileRow } from "@/modules/profiles/repo";
import { updateProfileCoreAction } from "@/modules/portfolio/actions";
import {
  CONTACT_LINK_KINDS,
  WORK_ARRANGEMENT_OPTIONS,
} from "@/modules/portfolio/constants";
import {
  normaliseHandleSlug,
  splitLinesOrCsv,
  type ContactLink,
} from "@/modules/portfolio/schemas";

interface ProfileCoreEditorProps {
  profile: ProfileRow;
  initialContactLinks: ContactLink[];
  onClose: () => void;
}

export function ProfileCoreEditor({
  profile,
  initialContactLinks,
  onClose,
}: ProfileCoreEditorProps) {
  const router = useRouter();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const timeZones = React.useMemo(() => getSupportedTimeZones(), []);

  const [fullName, setFullName] = React.useState(profile.full_name);
  const [handle, setHandle] = React.useState(profile.handle ?? "");
  const [headline, setHeadline] = React.useState(profile.headline);
  const [bio, setBio] = React.useState(profile.bio);
  const [currentFocus, setCurrentFocus] = React.useState(profile.current_focus);
  const [countryCode, setCountryCode] = React.useState(profile.country_code ?? "NG");
  const [city, setCity] = React.useState(profile.city ?? "");
  const [timezone, setTimezone] = React.useState(profile.timezone || "UTC");
  const [workArrangement, setWorkArrangement] = React.useState<WorkArrangement>(
    profile.work_arrangement
  );
  const [availabilityStatus, setAvailabilityStatus] = React.useState<AvailabilityStatus>(
    profile.availability_status
  );
  const [visibilityScope, setVisibilityScope] = React.useState<RecordVisibilityScope>(
    profile.visibility_scope === "organisation" ? "connections" : profile.visibility_scope
  );
  const [allowSearchIndexing, setAllowSearchIndexing] = React.useState(
    profile.allow_search_indexing
  );
  const [achievementsText, setAchievementsText] = React.useState(
    (profile.achievements ?? []).join("\n")
  );
  const [contactLinks, setContactLinks] = React.useState<ContactLink[]>(initialContactLinks);
  const [dirty, setDirty] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  function handleCancel() {
    if (dirty && !window.confirm("Discard your unsaved profile changes?")) {
      return;
    }
    onClose();
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "avatar");
      formData.append("visibilityScope", visibilityScope === "public" ? "public" : "private");

      const res = await fetch("/api/evidence/upload", {
        method: "POST",
        body: formData,
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Unable to upload profile photograph.");
        return;
      }
      setStatusMessage("Profile photograph updated.");
      router.refresh();
    } catch {
      setError("Network error while uploading photograph.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  function addContactLink() {
    if (contactLinks.length >= 6) return;
    markDirty();
    setContactLinks([
      ...contactLinks,
      { kind: "portfolio", label: "Portfolio", url: "https://" },
    ]);
  }

  function updateLink(index: number, patch: Partial<ContactLink>) {
    markDirty();
    setContactLinks((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  }

  function removeLink(index: number) {
    markDirty();
    setContactLinks((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setStatusMessage(null);

    const cleanedLinks = contactLinks.filter(
      (link) => link.url.trim().length > 8 && link.label.trim().length >= 2
    );

    const result = await updateProfileCoreAction({
      fullName,
      handle: handle.trim() ? normaliseHandleSlug(handle) : "",
      headline,
      bio,
      currentFocus,
      countryCode,
      city,
      timezone,
      workArrangement,
      availabilityStatus,
      visibilityScope,
      allowSearchIndexing: visibilityScope === "public" ? allowSearchIndexing : false,
      achievements: splitLinesOrCsv(achievementsText, 10, 200),
      contactLinks: cleanedLinks,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDirty(false);
    setStatusMessage("Professional profile saved.");
    router.refresh();
    onClose();
  }

  return (
    <Card className="border-brand/30 shadow-[var(--shadow-2)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Edit Professional Profile</CardTitle>
            <CardDescription>
              Keep your identity, biography, public handle, preferences, and external portfolio links up to date.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            aria-label="Close profile editor"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {/* Avatar Upload Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-base bg-canvas/60 p-3.5">
            <div>
              <p className="text-sm font-semibold text-ink">Profile Photograph</p>
              <p className="text-xs text-ink-muted">
                JPEG, PNG, or WebP up to 2 MB. Served securely via signed URLs.
              </p>
            </div>
            <div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="sr-only"
                id="profile-avatar-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                Upload Photo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-full-name" required>
                Full name
              </Label>
              <Input
                id="edit-full-name"
                value={fullName}
                onChange={(e) => {
                  markDirty();
                  setFullName(e.target.value);
                }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-handle">Public profile handle</Label>
              <div className="flex items-center">
                <span className="flex h-11 items-center rounded-l-lg border border-r-0 border-border-strong bg-subtle px-2.5 text-xs font-medium text-ink-muted">
                  /u/
                </span>
                <Input
                  id="edit-handle"
                  value={handle}
                  onChange={(e) => {
                    markDirty();
                    setHandle(e.target.value);
                  }}
                  placeholder="e.g. daniel-ojo"
                  className="rounded-l-none"
                />
              </div>
              <p className="text-[11px] text-ink-muted">
                4–40 lowercase letters, numbers, or hyphens. Used for your shareable public profile link.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-headline" required>
              Professional headline
            </Label>
            <Input
              id="edit-headline"
              value={headline}
              onChange={(e) => {
                markDirty();
                setHeadline(e.target.value);
              }}
              placeholder="e.g. Product Designer · Design Systems & Civic Tech"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-bio">Professional biography</Label>
            <textarea
              id="edit-bio"
              rows={4}
              value={bio}
              onChange={(e) => {
                markDirty();
                setBio(e.target.value);
              }}
              maxLength={2000}
              placeholder="Summarise your professional background, core capabilities, and the problems you love solving..."
              className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-brand"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-current-focus">Current professional focus</Label>
            <Input
              id="edit-current-focus"
              value={currentFocus}
              onChange={(e) => {
                markDirty();
                setCurrentFocus(e.target.value);
              }}
              placeholder="e.g. Building accessible civic design systems and AI-ready UX workflows"
              maxLength={240}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-country" required>
                Country (ISO-3166)
              </Label>
              <select
                id="edit-country"
                value={countryCode}
                onChange={(e) => {
                  markDirty();
                  setCountryCode(e.target.value);
                }}
                className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand"
              >
                {ISO_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-city">City / Region</Label>
              <Input
                id="edit-city"
                value={city}
                onChange={(e) => {
                  markDirty();
                  setCity(e.target.value);
                }}
                placeholder="e.g. Lagos, London"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-timezone" required>
                Time zone (IANA)
              </Label>
              <select
                id="edit-timezone"
                value={timezone}
                onChange={(e) => {
                  markDirty();
                  setTimezone(e.target.value);
                }}
                className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand"
              >
                {timeZones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-work-arrangement">Preferred work arrangement</Label>
              <select
                id="edit-work-arrangement"
                value={workArrangement}
                onChange={(e) => {
                  markDirty();
                  setWorkArrangement(e.target.value as WorkArrangement);
                }}
                className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand"
              >
                {WORK_ARRANGEMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-availability">Availability</Label>
              <select
                id="edit-availability"
                value={availabilityStatus}
                onChange={(e) => {
                  markDirty();
                  setAvailabilityStatus(e.target.value as AvailabilityStatus);
                }}
                className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand"
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-visibility">Profile visibility</Label>
              <select
                id="edit-visibility"
                value={visibilityScope}
                onChange={(e) => {
                  markDirty();
                  setVisibilityScope(e.target.value as RecordVisibilityScope);
                }}
                className="flex h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand"
              >
                <option value="public">Public</option>
                <option value="connections">Connections (owner-only until M5)</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {visibilityScope === "public" && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border-base bg-canvas/60 p-3.5">
              <div>
                <p className="text-sm font-medium text-ink">
                  Allow search engines to index my public profile
                </p>
                <p className="text-xs text-ink-muted">
                  Off by default (`noindex, nofollow`). Turn on only if you want your `/u/{handle || "handle"}` page discoverable in search engines.
                </p>
              </div>
              <Switch
                id="edit-search-indexing"
                checked={allowSearchIndexing}
                onCheckedChange={(checked) => {
                  markDirty();
                  setAllowSearchIndexing(checked);
                }}
                aria-label="Allow search engines to index public profile"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-achievements">Key professional achievements (one per line)</Label>
            <textarea
              id="edit-achievements"
              rows={3}
              value={achievementsText}
              onChange={(e) => {
                markDirty();
                setAchievementsText(e.target.value);
              }}
              placeholder="Led redesign that improved onboarding completion by 32%&#10;Published open-source accessibility component library"
              className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-brand"
            />
          </div>

          {/* External Professional Links */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label>External portfolio &amp; professional links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={contactLinks.length >= 6}
                onClick={addContactLink}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add Link
              </Button>
            </div>
            <p className="text-xs text-ink-muted">
              Only `https://` links are permitted. Links follow your overall profile visibility.
            </p>
            {contactLinks.map((link, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-2 rounded-lg border border-border-base bg-canvas/60 p-2.5 sm:grid-cols-12"
              >
                <select
                  aria-label={`Link type ${idx + 1}`}
                  value={link.kind}
                  onChange={(e) =>
                    updateLink(idx, { kind: e.target.value as ContactLink["kind"] })
                  }
                  className="h-10 rounded-lg border border-border-strong bg-surface px-2 text-xs text-ink sm:col-span-3"
                >
                  {CONTACT_LINK_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
                <Input
                  value={link.label}
                  onChange={(e) => updateLink(idx, { label: e.target.value })}
                  placeholder="Display label"
                  aria-label={`Link label ${idx + 1}`}
                  className="h-10 sm:col-span-3"
                />
                <Input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(idx, { url: e.target.value })}
                  placeholder="https://..."
                  aria-label={`Link URL ${idx + 1}`}
                  className="h-10 sm:col-span-5"
                />
                <div className="flex items-center justify-end sm:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(idx)}
                    aria-label={`Remove link ${idx + 1}`}
                    className="text-danger-text"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-text"
            >
              {error}
            </div>
          )}

          {statusMessage && (
            <div
              role="status"
              className="rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success-text"
            >
              {statusMessage}
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Profile
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
