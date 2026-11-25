import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserOrganisations } from "@/modules/organisations/repo";
import { buildPersonalDataExportPayload } from "@/modules/profiles/export";
import { getOwnProfileWithSkills, listOwnConsentLogs } from "@/modules/profiles/repo";

export const dynamic = "force-dynamic";

/**
 * Self-service authenticated personal data JSON export.
 * Derives user identity strictly from server-verified JWT (`supabase.auth.getUser()`)
 * and never accepts caller-supplied userId parameters.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Export service unavailable until Supabase Staging is configured." },
      { status: 503, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required to export personal data." },
      { status: 401, headers: { "Cache-Control": "no-store, private" } }
    );
  }

  try {
    const [profileRecord, consentLogs, orgs] = await Promise.all([
      getOwnProfileWithSkills(user.id),
      listOwnConsentLogs(user.id),
      listUserOrganisations(user.id),
    ]);

    const payload = buildPersonalDataExportPayload({
      account: {
        userId: user.id,
        email: user.email ?? null,
        authProvider:
          typeof user.app_metadata?.provider === "string"
            ? user.app_metadata.provider
            : null,
        emailConfirmedAt: user.email_confirmed_at ?? null,
        accountCreatedAt: user.created_at ?? null,
      },
      profile: profileRecord?.profile ?? null,
      skills: profileRecord?.skills ?? [],
      organisations: orgs.map((entry) => ({
        organisationId: entry.organisation.id,
        organisationName: entry.organisation.name,
        role: entry.role,
      })),
      consentLogs,
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `dg-nexus-personal-data-${dateStamp}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to generate personal data export.";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store, private" } }
    );
  }
}
