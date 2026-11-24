import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUser } from "@/modules/identity/guards";

// Authenticated workspace routes must always render dynamically per request.
export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return <AppShell userEmail={user?.email ?? null}>{children}</AppShell>;
}
