import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        Account, Privacy &amp; Consent Settings
      </h1>
      <EmptyState
        icon={<ShieldCheck className="h-6 w-6" />}
        title="Granular Privacy Controls — Scheduled for Milestone M1 / M2"
        description="Manage profile visibility (Public, Connections, Private), Nexus AI context consent, GDPR/NDPA data export, and security sessions here."
      />
    </div>
  );
}
