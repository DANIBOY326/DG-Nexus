import { notFound } from "next/navigation";
import { Briefcase, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/ui/brand-mark";
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
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DesignSystemShowcasePage() {
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
    notFound();
  }

  const swatches = [
    { name: "Primary", hex: "#1D4ED8", cls: "bg-brand" },
    { name: "Success / Verified", hex: "#10B981", cls: "bg-success" },
    { name: "Warning", hex: "#F59E0B", cls: "bg-warning" },
    { name: "Danger", hex: "#EF4444", cls: "bg-danger" },
    { name: "Nexus AI Accent", hex: "#4338CA", cls: "bg-ai-accent" },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-base pb-6">
        <div className="space-y-2">
          <BrandMark showParentAttribution />
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            DG NEXUS Design System (Screen 86 Tokens)
          </h1>
          <p className="text-sm text-ink-secondary">
            Non-production verification page — automatically returns 404 in production.
          </p>
        </div>
        <Badge variant="verified" showIcon>
          WCAG 2.1 AA Baseline
        </Badge>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Colour Tokens</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map((s) => (
            <Card key={s.name} className="p-3">
              <div className={`h-14 w-full rounded-lg ${s.cls}`} />
              <p className="mt-2 text-xs font-semibold text-ink">{s.name}</p>
              <p className="text-xs font-mono text-ink-muted">{s.hex}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Buttons &amp; Semantic Badges</h2>
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="primary" size="fab" aria-label="Create new item">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-base">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Remote · Global</Badge>
            <Badge variant="verified" showIcon>
              Verified Organisation
            </Badge>
            <Badge variant="warning">Deadline: 5 days</Badge>
            <Badge variant="danger">Action Required</Badge>
            <Badge variant="ai" showIcon>
              Nexus AI · 96% Match
            </Badge>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Form Controls</CardTitle>
            <CardDescription>Minimum 44px touch targets with clear focus rings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ds-search">Global Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-ink-muted" />
                <Input id="ds-search" placeholder="Search opportunities, skills, people..." className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ds-error" required>
                Validation Error State
              </Label>
              <Input id="ds-error" error="Invalid email" defaultValue="invalid-email" />
              <p className="text-xs text-danger-text">Please enter a valid email address.</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="ai">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="ai" showIcon>
                Nexus AI Insight
              </Badge>
              <span className="text-xs font-medium text-ai-accent">Explainable Match</span>
            </div>
            <CardTitle className="mt-2">Distinct AI Surface Grammar</CardTitle>
            <CardDescription>
              AI-generated recommendations are visually separated from verified platform records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink">
              Matched skills: TypeScript, PostgreSQL. Missing: System Design Case Study.
            </p>
          </CardContent>
          <CardFooter>
            <span className="text-xs text-ink-secondary">Grounded in profile &amp; criteria</span>
            <Button size="sm" variant="primary">
              Inspect Gap Plan
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Tabs, Empty State &amp; Loading Skeleton</h2>
        <Tabs defaultValue="empty">
          <TabsList>
            <TabsTrigger value="empty">Empty State</TabsTrigger>
            <TabsTrigger value="loading">Loading Skeleton</TabsTrigger>
          </TabsList>
          <TabsContent value="empty">
            <EmptyState
              icon={<Briefcase className="h-6 w-6" />}
              title="No saved opportunities yet"
              description="Bookmark verified jobs, fellowships, or grants to track deadlines and run Nexus AI eligibility checks."
              action={<Button>Explore Opportunities</Button>}
            />
          </TabsContent>
          <TabsContent value="loading">
            <Card className="p-5 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
