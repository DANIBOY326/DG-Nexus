import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function NetworkPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Network &amp; Messages</h1>
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="People Discovery & 1:1 Messaging — Scheduled for Milestone M5"
        description="Skill-based peer discovery, connection requests, and realtime 1:1 conversations will be built here."
      />
    </div>
  );
}
