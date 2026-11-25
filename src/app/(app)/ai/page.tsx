import Link from "next/link";
import { ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
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
import { requireUser } from "@/modules/identity/guards";
import { getAuthorisedAiProfileContext } from "@/modules/nexus-ai/consent";

export default async function NexusAiPage() {
  const user = await requireUser("/ai");
  const aiAccess = await getAuthorisedAiProfileContext(user.id).catch(() => ({
    allowed: false as const,
    reason: "AI_CONTEXT_CONSENT_REQUIRED" as const,
    context: null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Nexus AI</h1>
          <Badge variant="ai" showIcon>
            Consent-Enforced Gateway
          </Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">Manage AI Consent</Link>
        </Button>
      </div>

      {!aiAccess.allowed ? (
        <Card className="border-warning/40 bg-warning-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning-text">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              Profile Context Blocked (AI Context Consent Required)
            </CardTitle>
            <CardDescription className="text-warning-text/90">
              Server guard status: <code className="font-mono">{aiAccess.reason}</code>.
              Because your Nexus AI Context Consent is currently turned off, no profile,
              skills, or goals data is exposed to Nexus AI services.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="primary" size="sm" asChild>
              <Link href="/settings">Enable in Privacy Settings</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card variant="ai">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-ai-accent">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Authorised Non-PII AI Context Active
            </CardTitle>
            <CardDescription>
              Direct identifiers (email, full name, city) are excluded. Only the structured
              career fields below are authorised for Milestone M4 AI features:
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border border-ai-border bg-surface p-3">
              <p className="font-semibold text-ink">Headline &amp; Availability</p>
              <p className="mt-1 text-ink-secondary">
                {aiAccess.context.headline || "Not set"} ({aiAccess.context.availabilityStatus})
              </p>
            </div>
            <div className="rounded-lg border border-ai-border bg-surface p-3">
              <p className="font-semibold text-ink">
                Authorised Canonical Skills ({aiAccess.context.skills.length})
              </p>
              <p className="mt-1 text-ink-secondary">
                {aiAccess.context.skills.length > 0
                  ? aiAccess.context.skills.map((s) => s.name).join(", ")
                  : "No skills added yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <EmptyState
        icon={<Sparkles className="h-6 w-6 text-ai-accent" />}
        title="Conversational Nexus AI & Opportunity Fit — Scheduled for Milestone M4"
        description="Your server-side AI consent guard is active now. Provider-agnostic LLM inference, opportunity fit diagnostics, and skills-gap plans connect in Milestone M4."
      />
    </div>
  );
}
