import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default function NexusAiPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Nexus AI</h1>
        <Badge variant="ai" showIcon>
          Provider-Agnostic Gateway
        </Badge>
      </div>
      <EmptyState
        icon={<Sparkles className="h-6 w-6 text-ai-accent" />}
        title="Contextual Nexus AI v1 — Scheduled for Milestone M4"
        description="Consolidated opportunity fit diagnostics, skills-gap plans, and CV/profile assistance with strict PII redaction and consent enforcement."
      />
    </div>
  );
}
