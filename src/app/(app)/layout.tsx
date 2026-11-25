import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUser } from "@/modules/identity/guards";
import { getOwnProfile } from "@/modules/profiles/repo";

// Authenticated workspace routes must always render dynamically per request.
export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  let fullName: string | null = null;

  if (user) {
    try {
      const profile = await getOwnProfile(user.id);
      fullName = profile?.full_name || null;
    } catch {
      fullName = null;
    }
  }

  return (
    <AppShell userEmail={user?.email ?? null} fullName={fullName}>
      {children}
    </AppShell>
  );
}
