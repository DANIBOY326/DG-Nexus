"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Globe2, Search, X } from "lucide-react";
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
import { Input, Label, Textarea } from "@/components/ui/input";
import type {
  AvailabilityStatus,
  SkillProficiency,
} from "@/lib/supabase/database.types";
import {
  completeOnboardingAction,
  saveOnboardingStep1Action,
  saveOnboardingStep2Action,
  saveOnboardingStep3Action,
  type ActionResult,
} from "@/modules/profiles/actions";
import {
  AVAILABILITY_OPTIONS,
  CAREER_GOALS,
  DOMAIN_INTERESTS,
  getSupportedTimeZones,
  ISO_COUNTRIES,
  SKILL_PROFICIENCY_OPTIONS,
} from "@/modules/profiles/constants";
import { cn } from "@/lib/utils";

export interface WizardSkillOption {
  id: string;
  slug: string;
  name: string;
  category: string;
}

export interface SelectedSkillState {
  skillId: string;
  proficiencyLevel: SkillProficiency;
}

export interface OnboardingInitialData {
  step: number;
  fullName: string;
  headline: string;
  countryCode: string;
  timezone: string;
  city: string;
  interests: string[];
  selectedSkills: SelectedSkillState[];
  careerGoals: string[];
  careerGoalSummary: string;
  availabilityStatus: AvailabilityStatus;
  isRevisit: boolean;
}

export interface OnboardingActionHandlers {
  saveStep1: (payload: unknown) => Promise<ActionResult<{ nextStep: number }>>;
  saveStep2: (payload: unknown) => Promise<ActionResult<{ nextStep: number }>>;
  saveStep3: (payload: unknown) => Promise<ActionResult<{ nextStep: number }>>;
  completeStep4: (payload: unknown) => Promise<ActionResult<{ redirectTo: string }>>;
}

interface OnboardingWizardProps {
  initialData: OnboardingInitialData;
  canonicalSkills: WizardSkillOption[];
  handlers?: OnboardingActionHandlers;
}

const STEP_META = [
  { number: 1, title: "Profile Basics", subtitle: "Tell us about yourself" },
  { number: 2, title: "Curiosity & Domains", subtitle: "What sparks your curiosity?" },
  { number: 3, title: "Canonical Skills", subtitle: "What are your superpowers?" },
  { number: 4, title: "Goals & Availability", subtitle: "What do you want to achieve?" },
] as const;

export function OnboardingWizard({
  initialData,
  canonicalSkills,
  handlers,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<number>(
    Math.min(4, Math.max(1, initialData.step || 1))
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Step 1 state
  const [fullName, setFullName] = React.useState(initialData.fullName);
  const [headline, setHeadline] = React.useState(initialData.headline);
  const [countryCode, setCountryCode] = React.useState(initialData.countryCode || "NG");
  const [timezone, setTimezone] = React.useState(initialData.timezone || "UTC");
  const [city, setCity] = React.useState(initialData.city);

  // Step 2 state
  const [interests, setInterests] = React.useState<string[]>(initialData.interests);

  // Step 3 state
  const [selectedSkills, setSelectedSkills] = React.useState<SelectedSkillState[]>(
    initialData.selectedSkills
  );
  const [skillQuery, setSkillQuery] = React.useState("");
  const [skillCategory, setSkillCategory] = React.useState("All");

  // Step 4 state
  const [careerGoals, setCareerGoals] = React.useState<string[]>(initialData.careerGoals);
  const [careerGoalSummary, setCareerGoalSummary] = React.useState(
    initialData.careerGoalSummary
  );
  const [availabilityStatus, setAvailabilityStatus] = React.useState<AvailabilityStatus>(
    initialData.availabilityStatus || "open_to_opportunities"
  );

  const timeZones = React.useMemo(() => getSupportedTimeZones(), []);

  function handleDetectTimeZone() {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && timeZones.includes(detected)) {
        setTimezone(detected);
      }
    } catch {
      // Keep current selection safely
    }
  }

  const skillCategories = React.useMemo(() => {
    const cats = Array.from(new Set(canonicalSkills.map((s) => s.category)));
    return ["All", ...cats];
  }, [canonicalSkills]);

  const filteredSkills = React.useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    return canonicalSkills.filter((skill) => {
      const matchesCat = skillCategory === "All" || skill.category === skillCategory;
      const matchesQuery =
        !q ||
        skill.name.toLowerCase().includes(q) ||
        skill.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [canonicalSkills, skillCategory, skillQuery]);

  const skillById = React.useMemo(
    () => new Map(canonicalSkills.map((s) => [s.id, s])),
    [canonicalSkills]
  );

  const selectedSkillIds = React.useMemo(
    () => new Set(selectedSkills.map((s) => s.skillId)),
    [selectedSkills]
  );

  const activeHandlers: OnboardingActionHandlers = handlers ?? {
    saveStep1: saveOnboardingStep1Action,
    saveStep2: saveOnboardingStep2Action,
    saveStep3: saveOnboardingStep3Action,
    completeStep4: completeOnboardingAction,
  };

  function toggleInterest(slug: string) {
    setError(null);
    setInterests((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((item) => item !== slug);
      }
      if (prev.length >= 6) {
        setError("You can select up to 6 domains.");
        return prev;
      }
      return [...prev, slug];
    });
  }

  function toggleSkill(skillId: string) {
    setError(null);
    setSelectedSkills((prev) => {
      if (prev.some((s) => s.skillId === skillId)) {
        return prev.filter((s) => s.skillId !== skillId);
      }
      if (prev.length >= 15) {
        setError("You can select up to 15 skills during onboarding.");
        return prev;
      }
      return [...prev, { skillId, proficiencyLevel: "intermediate" }];
    });
  }

  function updateSkillProficiency(skillId: string, level: SkillProficiency) {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.skillId === skillId ? { ...s, proficiencyLevel: level } : s))
    );
  }

  function toggleCareerGoal(slug: string) {
    setError(null);
    setCareerGoals((prev) =>
      prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug]
    );
  }

  async function handleNext() {
    setError(null);
    setSaving(true);

    try {
      if (step === 1) {
        const res = await activeHandlers.saveStep1({
          fullName,
          headline,
          countryCode,
          timezone,
          city,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setStep(2);
      } else if (step === 2) {
        const res = await activeHandlers.saveStep2({ interests });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setStep(3);
      } else if (step === 3) {
        const res = await activeHandlers.saveStep3({ skills: selectedSkills });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setStep(4);
      } else if (step === 4) {
        const res = await activeHandlers.completeStep4({
          careerGoals,
          careerGoalSummary,
          availabilityStatus,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.push(res.data?.redirectTo ?? "/home");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const currentMeta = STEP_META[step - 1] ?? STEP_META[0];
  const progressPercent = (step / 4) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              {initialData.isRevisit ? "Update Professional Setup" : `Step ${step} of 4`}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-ink">
              {currentMeta.subtitle}
            </h1>
          </div>
          <Badge variant="primary" className="tabular-nums">
            {progressPercent}% complete
          </Badge>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-subtle"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={4}
          aria-label="Onboarding progress"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Desktop Stepper Navigation */}
        <ol className="hidden sm:grid sm:grid-cols-4 gap-2 pt-1">
          {STEP_META.map((item) => {
            const isCurrent = item.number === step;
            const isDone = item.number < step;
            return (
              <li key={item.number}>
                <button
                  type="button"
                  disabled={saving || item.number > step}
                  onClick={() => {
                    if (item.number < step) {
                      setError(null);
                      setStep(item.number);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
                    isCurrent && "border-brand bg-brand-soft text-brand",
                    isDone &&
                      "border-border-base bg-surface text-ink hover:bg-subtle cursor-pointer",
                    !isCurrent &&
                      !isDone &&
                      "border-border-base bg-canvas text-ink-muted cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                      isCurrent && "bg-brand text-white",
                      isDone && "bg-success text-white",
                      !isCurrent && !isDone && "bg-subtle text-ink-muted"
                    )}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : item.number}
                  </span>
                  <span className="truncate">{item.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Main Step Card */}
      <Card className="shadow-[var(--shadow-2)]">
        <CardHeader>
          <CardTitle>{currentMeta.title}</CardTitle>
          <CardDescription>
            {step === 1 &&
              "Set your global identity, ISO-3166 country, and IANA time zone so opportunities and deadlines adapt accurately."}
            {step === 2 &&
              "Choose 1 to 6 domains that reflect your professional focus and curiosity."}
            {step === 3 &&
              "Select canonical skills from the DG NEXUS graph. Duplicate skills are prevented automatically."}
            {step === 4 &&
              "Define what you want to achieve on DG NEXUS and your current availability."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-text"
            >
              {error}
            </div>
          )}

          {/* STEP 1: PROFILE BASICS */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-fullname" required>
                    Full name
                  </Label>
                  <Input
                    id="ob-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Amina Osei-Bonsu"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-city">City (optional)</Label>
                  <Input
                    id="ob-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lagos, London, Toronto"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ob-headline" required>
                  Professional headline
                </Label>
                <Input
                  id="ob-headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Full-Stack Engineer · Product Designer · Climate Researcher"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-country" required>
                    Country (ISO-3166)
                  </Label>
                  <select
                    id="ob-country"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="flex min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {ISO_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="ob-timezone" required>
                      Time zone (IANA)
                    </Label>
                    <button
                      type="button"
                      onClick={handleDetectTimeZone}
                      className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                    >
                      Detect mine
                    </button>
                  </div>
                  <select
                    id="ob-timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="flex min-h-11 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {timeZones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                <Globe2 className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                Standardised country and time-zone codes ensure accurate global opportunity
                eligibility and deadline reminders.
              </p>
            </div>
          )}

          {/* STEP 2: CURIOSITY & DOMAINS */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-secondary">
                <span>Selected domains: {interests.length} / 6</span>
                <span>Minimum 1 required</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DOMAIN_INTERESTS.map((domain) => {
                  const selected = interests.includes(domain.slug);
                  return (
                    <button
                      key={domain.slug}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleInterest(domain.slug)}
                      className={cn(
                        "flex min-h-[76px] flex-col items-start justify-between rounded-xl border p-4 text-left transition-colors cursor-pointer",
                        selected
                          ? "border-brand bg-brand-soft"
                          : "border-border-base bg-surface hover:border-border-strong hover:bg-canvas"
                      )}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {domain.label}
                        </span>
                        {selected && (
                          <CheckCircle2
                            className="h-4 w-4 text-brand shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-secondary">
                        {domain.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CANONICAL SKILLS */}
          {step === 3 && (
            <div className="space-y-4">
              {canonicalSkills.length === 0 ? (
                <div className="rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm text-warning-text">
                  The canonical skills catalogue is empty. Run migration{" "}
                  <code className="font-mono">
                    202611250001_m1_onboarding_skills_privacy.sql
                  </code>{" "}
                  in your Staging Supabase SQL Editor to seed the verified skills table.
                </div>
              ) : (
                <>
                  {/* Selected Skills Summary */}
                  {selectedSkills.length > 0 && (
                    <div className="space-y-2 rounded-xl border border-border-base bg-canvas p-3.5">
                      <p className="text-xs font-semibold text-ink-secondary">
                        Selected skills ({selectedSkills.length} / 15)
                      </p>
                      <div className="space-y-2">
                        {selectedSkills.map((sel) => {
                          const meta = skillById.get(sel.skillId);
                          if (!meta) return null;
                          return (
                            <div
                              key={sel.skillId}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-base bg-surface px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-ink">
                                  {meta.name}
                                </span>
                                <Badge variant="default">{meta.category}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  aria-label={`Proficiency for ${meta.name}`}
                                  value={sel.proficiencyLevel}
                                  onChange={(e) =>
                                    updateSkillProficiency(
                                      sel.skillId,
                                      e.target.value as SkillProficiency
                                    )
                                  }
                                  className="min-h-9 rounded-md border border-border-strong bg-surface px-2 text-xs text-ink"
                                >
                                  {SKILL_PROFICIENCY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  aria-label={`Remove ${meta.name}`}
                                  onClick={() => toggleSkill(sel.skillId)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-danger-soft hover:text-danger-text cursor-pointer"
                                >
                                  <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Search & Category Filter */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-ink-muted"
                        aria-hidden="true"
                      />
                      <Input
                        value={skillQuery}
                        onChange={(e) => setSkillQuery(e.target.value)}
                        placeholder="Search canonical skills (e.g. TypeScript, Figma, Grant Writing)..."
                        className="pl-9"
                        aria-label="Search canonical skills"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {skillCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSkillCategory(cat)}
                          className={cn(
                            "min-h-9 rounded-full px-3 text-xs font-semibold transition-colors cursor-pointer",
                            skillCategory === cat
                              ? "bg-brand text-white"
                              : "bg-subtle text-ink-secondary hover:text-ink"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto rounded-xl border border-border-base p-3">
                      {filteredSkills.map((skill) => {
                        const isSelected = selectedSkillIds.has(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleSkill(skill.id)}
                            className={cn(
                              "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors cursor-pointer",
                              isSelected
                                ? "border-brand bg-brand-soft text-brand"
                                : "border-border-strong bg-surface text-ink hover:bg-subtle"
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                            <span>{skill.name}</span>
                          </button>
                        );
                      })}
                      {filteredSkills.length === 0 && (
                        <p className="w-full py-6 text-center text-xs text-ink-muted">
                          No canonical skills match &ldquo;{skillQuery}&rdquo;.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4: CAREER GOALS & AVAILABILITY */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-2.5">
                <Label required>What do you want to achieve on DG NEXUS?</Label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {CAREER_GOALS.map((goal) => {
                    const selected = careerGoals.includes(goal.slug);
                    return (
                      <button
                        key={goal.slug}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleCareerGoal(goal.slug)}
                        className={cn(
                          "flex flex-col items-start rounded-xl border p-3.5 text-left transition-colors cursor-pointer",
                          selected
                            ? "border-brand bg-brand-soft"
                            : "border-border-base bg-surface hover:border-border-strong"
                        )}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-ink">{goal.label}</span>
                          {selected && (
                            <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-ink-secondary">{goal.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ob-goal-summary">
                  Target milestone or career ambition (optional)
                </Label>
                <Textarea
                  id="ob-goal-summary"
                  value={careerGoalSummary}
                  onChange={(e) => setCareerGoalSummary(e.target.value)}
                  placeholder="e.g. Transition into Senior Product Engineering or secure an international AI research fellowship within 12 months."
                />
              </div>

              <div className="space-y-2">
                <Label required>Current availability</Label>
                <div className="space-y-2">
                  {AVAILABILITY_OPTIONS.map((option) => {
                    const selected = availabilityStatus === option.value;
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors",
                          selected
                            ? "border-brand bg-brand-soft"
                            : "border-border-base bg-surface hover:border-border-strong"
                        )}
                      >
                        <input
                          type="radio"
                          name="availabilityStatus"
                          value={option.value}
                          checked={selected}
                          onChange={() => setAvailabilityStatus(option.value)}
                          className="mt-1 h-4 w-4 accent-brand"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-ink">
                            {option.label}
                          </span>
                          <span className="block text-xs text-ink-secondary">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1 || saving}
            onClick={() => {
              setError(null);
              setStep((prev) => Math.max(1, prev - 1));
            }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Previous</span>
          </Button>

          <Button type="button" loading={saving} onClick={handleNext}>
            <span>{step === 4 ? "Complete Setup" : "Save & Continue"}</span>
            {step < 4 && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
