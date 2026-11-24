import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function OpportunitiesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Opportunities</h1>
      <EmptyState
        icon={<Briefcase className="h-6 w-6" />}
        title="Opportunities Engine — Scheduled for Milestone M3"
        description="Global and regional opportunity search, structured eligibility criteria, bookmarking, and application tracking will be built here."
      />
    </div>
  );
}
