import { redirect } from "next/navigation";
import {
  OnboardingWizard,
  type WizardSkillOption,
} from "@/components/onboarding/onboarding-wizard";
import { listCanonicalSkills } from "@/modules/graph/skills-repo";
import { requireUser } from "@/modules/identity/guards";
import { getOwnProfileWithSkills } from "@/modules/profiles/repo";

interface OnboardingPageProps {
  searchParams: Promise<{ revisit?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const user = await requireUser("/onboarding");
  const resolvedParams = await searchParams;
  const isRevisit = resolvedParams.revisit === "1";

  const [record, canonicalSkillRows] = await Promise.all([
    getOwnProfileWithSkills(user.id).catch(() => null),
    listCanonicalSkills().catch(() => []),
  ]);

  if (record?.profile.onboarding_completed_at && !isRevisit) {
    redirect("/home");
  }

  const canonicalSkills: WizardSkillOption[] = canonicalSkillRows.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    category: s.category,
  }));

  const profile = record?.profile;
  return (
    <OnboardingWizard
      canonicalSkills={canonicalSkills}
      initialData={{
        step: isRevisit ? 1 : (profile?.onboarding_step ?? 1),
        fullName: profile?.full_name ?? "",
        headline: profile?.headline ?? "",
        countryCode: profile?.country_code ?? "NG",
        timezone: profile?.timezone ?? "UTC",
        city: profile?.city ?? "",
        interests: profile?.interests ?? [],
        selectedSkills: (record?.skills ?? []).map((s) => ({
          skillId: s.skillId,
          proficiencyLevel: s.proficiencyLevel,
        })),
        careerGoals: profile?.career_goals ?? [],
        careerGoalSummary: profile?.career_goal ?? "",
        availabilityStatus: profile?.availability_status ?? "open_to_opportunities",
        isRevisit,
      }}
    />
  );
}
