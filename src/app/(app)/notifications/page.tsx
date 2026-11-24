import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Notifications</h1>
      <EmptyState
        icon={<Bell className="h-6 w-6" />}
        title="No notifications yet"
        description="Application deadlines, connection requests, and verified updates will appear here."
      />
    </div>
  );
}
