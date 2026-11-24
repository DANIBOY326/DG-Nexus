import { User } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        Profile &amp; Growth Record
      </h1>
      <EmptyState
        icon={<User className="h-6 w-6" />}
        title="Proof-of-Work Profile — Scheduled for Milestone M2"
        description="Your unified professional identity, verified skills, portfolio artefacts, and granular visibility controls will live here."
      />
    </div>
  );
}
