import Link from "next/link";
import { Briefcase, CalendarClock, Sparkles, UserCheck } from "lucide-react";
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

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl p-6 text-white shadow-[var(--shadow-2)]"
        style={{ background: "var(--color-brand-gradient)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
          Connected Professional Operating Environment
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight">
          Welcome to DG NEXUS
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-50/90">
          Your unified workspace for verified global opportunities, proof-of-work
          profiles, and explainable Nexus AI career readiness.
        </p>
      </section>

      {/* Responsive 12-column Desktop (8 + 4) / Tablet (2-col) / Mobile (1-col) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <EmptyState
            icon={<Briefcase className="h-6 w-6" />}
            title="Verified opportunities activate in M3"
            description="Once M3 is connected, your personalised global and regional opportunities, AI fit breakdowns, and deadline alerts will appear here."
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
                Nexus AI · M4
              </Badge>
              <CardTitle className="mt-1">Readiness Co-pilot</CardTitle>
              <CardDescription>
                Permission-scoped eligibility and skills-gap analysis grounded strictly in
                your verified profile.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="primary" size="sm" asChild>
                <Link href="/ai">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Open Nexus AI
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-brand" aria-hidden="true" />
                Milestone M0 Shell Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-ink-secondary">
              <div className="flex items-center justify-between">
                <span>Responsive 12-Col Desktop + Rail + Bottom Nav</span>
                <Badge variant="verified">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Global Search (Ctrl / Cmd + K)</span>
                <Badge variant="verified">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Deadlines &amp; Tracking</span>
                <Badge variant="default">
                  <CalendarClock className="h-3 w-3" aria-hidden="true" />
                  M3
                </Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
