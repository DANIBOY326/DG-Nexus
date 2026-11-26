import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Briefcase,
  Globe2,
  ShieldCheck,
  Sparkles,
  UserCheck,
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
import { getCurrentUser } from "@/modules/identity/guards";
import {
  AVAILABILITY_OPTIONS,
  DOMAIN_INTERESTS,
  getCountryName,
} from "@/modules/profiles/constants";
import { getOwnProfileWithSkills } from "@/modules/profiles/repo";

export default async function HomePage() {
  const user = await getCurrentUser();
  const record = user ? await getOwnProfileWithSkills(user.id).catch(() => null) : null;

  if (user && record && !record.profile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const profile = record?.profile;
  const skills = record?.skills ?? [];
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "there";
  const availabilityLabel =
    AVAILABILITY_OPTIONS.find((a) => a.value === profile?.availability_status)?.label ??
    "Open to opportunities";
  const domainLabels = (profile?.interests ?? []).map(
    (slug) => DOMAIN_INTERESTS.find((d) => d.slug === slug)?.label ?? slug
  );

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-6 text-white shadow-[var(--shadow-2)]"
        style={{ background: "var(--color-brand-gradient)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
            Connected Professional Operating Environment
          </p>
          {profile && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              {getCountryName(profile.country_code)} · {profile.timezone}
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-blue-50/90">
          {profile?.headline
            ? `${profile.headline} — ${availabilityLabel}.`
            : "Your unified workspace for verified global opportunities, proof-of-work profiles, and explainable Nexus AI career readiness."}
        </p>
      </section>

      {/* Responsive 12-column Desktop (8 + 4) / Tablet (2-col) / Mobile (1-col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {profile && (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Your Unified Graph Snapshot</CardTitle>
                  <Badge variant="verified" showIcon className="tabular-nums">
                    {profile.profile_completion_score}% Ready
                  </Badge>
                </div>
                <CardDescription>
                  Structured domains and canonical skills powering future opportunity matching.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {domainLabels.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Focus Domains
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {domainLabels.map((label) => (
                        <Badge key={label} variant="primary">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {skills.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Canonical Skills ({skills.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <Badge key={skill.skillId} variant="default">
                          {skill.name} · {skill.proficiencyLevel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href="/profile">Open Proof-of-Work Profile</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/onboarding?revisit=1">Update Onboarding</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/settings">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Privacy ({profile.visibility_scope})
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          <EmptyState
            icon={<Briefcase className="h-6 w-6" />}
            title="Verified opportunities activate in M3"
            description="Your structured country, domains, and canonical skills are saved and ready for global opportunity discovery and explainable fit scoring in Milestone M3."
            action={
              <Button asChild>
                <Link href="/opportunities">View Opportunities Shell</Link>
              </Button>
            }
          />
        </div>

        <aside className="space-y-4 lg:col-span-4" aria-label="Contextual Workspace Rail">
          <Card variant="ai">
            <CardHeader>
              <Badge variant="ai" showIcon>
                Nexus AI Context
              </Badge>
              <CardTitle className="mt-1">
                {profile?.ai_context_consent ? "AI Context Enabled" : "AI Context Opted Out"}
              </CardTitle>
              <CardDescription>
                {profile?.ai_context_consent
                  ? "Authorised non-PII skills and goals are available for Nexus AI readiness insights."
                  : "Privacy-protective default active. Nexus AI will not access your profile until you opt in."}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="primary" size="sm" asChild>
                <Link href="/settings">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Manage AI Consent
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-brand" aria-hidden="true" />
                Identity &amp; Privacy Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-ink-secondary">
              <div className="flex items-center justify-between">
                <span>Profile Visibility</span>
                <Badge variant="default" className="capitalize">
                  {profile?.visibility_scope ?? "public"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Context Consent</span>
                <Badge variant={profile?.ai_context_consent ? "verified" : "warning"}>
                  {profile?.ai_context_consent ? "Opted In" : "Opted Out"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
