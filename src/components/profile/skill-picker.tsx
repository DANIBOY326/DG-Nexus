"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { CanonicalSkillRow } from "@/modules/graph/skills-repo";

interface SkillPickerProps {
  idPrefix: string;
  catalogue: CanonicalSkillRow[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  maxSelection?: number;
  label?: string;
  helperText?: string;
}

/**
 * Reusable searchable canonical skill selector (prevents duplicates cleanly).
 */
export function SkillPicker({
  idPrefix,
  catalogue,
  selectedIds,
  onChange,
  maxSelection = 15,
  label = "Linked canonical skills",
  helperText,
}: SkillPickerProps) {
  const [query, setQuery] = React.useState("");
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedSkills = React.useMemo(
    () =>
      selectedIds
        .map((id) => catalogue.find((s) => s.id === id))
        .filter((s): s is CanonicalSkillRow => Boolean(s)),
    [selectedIds, catalogue]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? catalogue.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q)
        )
      : catalogue;
    return list.slice(0, 18);
  }, [catalogue, query]);

  function toggleSkill(skillId: string) {
    if (selectedSet.has(skillId)) {
      onChange(selectedIds.filter((id) => id !== skillId));
      return;
    }
    if (selectedIds.length >= maxSelection) return;
    onChange([...selectedIds, skillId]);
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`${idPrefix}-skill-search`}
          className="text-sm font-medium text-ink"
        >
          {label}
        </label>
        <span className="text-xs text-ink-muted tabular-nums">
          {selectedIds.length} / {maxSelection}
        </span>
      </div>

      {helperText && <p className="text-xs text-ink-secondary">{helperText}</p>}

      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Selected canonical skills">
          {selectedSkills.map((skill) => (
            <Badge key={skill.id} variant="primary" className="pr-1.5">
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={() => toggleSkill(skill.id)}
                aria-label={`Remove ${skill.name}`}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-brand/15 cursor-pointer"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <Input
          id={`${idPrefix}-skill-search`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search canonical skills (e.g. TypeScript, Figma, Research)..."
          className="pl-9"
        />
      </div>

      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border-base bg-canvas/60 p-2.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-ink-muted">No canonical skills matched &ldquo;{query}&rdquo;.</p>
        ) : (
          filtered.map((skill) => {
            const active = selectedSet.has(skill.id);
            const atLimit = !active && selectedIds.length >= maxSelection;
            return (
              <button
                key={skill.id}
                type="button"
                disabled={atLimit}
                aria-pressed={active}
                onClick={() => toggleSkill(skill.id)}
                className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-45 ${
                  active
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border-base bg-surface text-ink-secondary hover:border-border-strong hover:text-ink"
                }`}
              >
                {active && <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}
                <span>{skill.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
