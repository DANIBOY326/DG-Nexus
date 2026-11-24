import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, OrgRole } from "@/lib/supabase/database.types";

export type OrganisationRow = Database["public"]["Tables"]["organisations"]["Row"];
export type OrganisationMembershipRow =
  Database["public"]["Tables"]["organisation_memberships"]["Row"];

/**
 * Typed Multi-Tenant Organisation repository enforcing tenant isolation via Postgres RLS.
 */
export async function listUserOrganisations(userId: string): Promise<
  Array<{
    role: OrgRole;
    organisation: OrganisationRow;
  }>
> {
  const supabase = await createSupabaseServerClient();
  const { data: memberships, error } = await supabase
    .from("organisation_memberships")
    .select("role, organisation_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to list memberships: ${error.message}`);
  }

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const orgIds = memberships.map((m) => m.organisation_id);
  const { data: orgs, error: orgError } = await supabase
    .from("organisations")
    .select("*")
    .in("id", orgIds);

  if (orgError) {
    throw new Error(`Failed to load organisations: ${orgError.message}`);
  }

  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));
  return memberships
    .map((m) => {
      const org = orgById.get(m.organisation_id);
      return org ? { role: m.role, organisation: org } : null;
    })
    .filter((entry): entry is { role: OrgRole; organisation: OrganisationRow } => Boolean(entry));
}
