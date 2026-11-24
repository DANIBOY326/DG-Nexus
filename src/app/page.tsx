import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingEntryPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-border-base bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandMark size={32} showWordmark />
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-14 sm:px-6">
        <div className="max-w-2xl space-y-5">
          <Badge variant="primary">Connected Professional Operating Environment</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Where Ideas Meet Impact.
          </h1>
          <p className="text-base text-ink-secondary sm:text-lg">
            Discover verified global opportunities, build a proof-of-work competency
            profile, and turn career ambition into measurable progress with explainable
            Nexus AI.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Create Your Account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/home">Open Workspace Shell</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <Briefcase className="h-5 w-5 text-brand" aria-hidden="true" />
              <CardTitle className="mt-2">Verified Opportunities</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-ink-secondary">
              Curated global and regional jobs, internships, scholarships, fellowships,
              and grants with structured eligibility criteria.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
              <CardTitle className="mt-2">Proof-of-Work Graph</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-ink-secondary">
              Evidence-backed skills, portfolio artefacts, and a user-controlled
              Professional Growth Record with granular privacy.
            </CardContent>
          </Card>

          <Card variant="ai">
            <CardHeader>
              <Sparkles className="h-5 w-5 text-ai-accent" aria-hidden="true" />
              <CardTitle className="mt-2">Explainable Nexus AI</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-ink-secondary">
              Permission-scoped skills-gap diagnostics and career readiness plans—keeping
              humans in control of every decision.
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border-base bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-ink-muted sm:px-6">
          <span>DG NEXUS · by DGConcept</span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Connecting People. Creating Possibilities.
          </span>
        </div>
      </footer>
    </div>
  );
}
