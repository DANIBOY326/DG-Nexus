"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { requireUser } from "@/modules/identity/guards";
import type { ActionResult } from "@/modules/profiles/actions";
import {
  toggleBookmarkSchema,
  upsertApplicationSchema,
} from "@/modules/opportunities/schemas";

function revalidateOpportunityPaths(slug?: string) {
  revalidatePath("/opportunities");
  revalidatePath("/home");
  if (slug) {
    revalidatePath(`/opportunities/${slug}`);
  }
}

export async function toggleBookmarkAction(
  payload: unknown
): Promise<ActionResult<{ bookmarked: boolean }>> {
  const user = await requireUser("/opportunities");
  const parsed = toggleBookmarkSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid bookmark request.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("opportunity_bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("opportunity_id", parsed.data.opportunityId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("opportunity_bookmarks")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) {
        return { ok: false, error: `Could not remove bookmark: ${error.message}` };
      }

      revalidateOpportunityPaths();
      return { ok: true, data: { bookmarked: false } };
    }

    const { error } = await supabase.from("opportunity_bookmarks").insert({
      user_id: user.id,
      opportunity_id: parsed.data.opportunityId,
      notes: parsed.data.notes,
    });

    if (error) {
      return { ok: false, error: `Could not save opportunity: ${error.message}` };
    }

    revalidateOpportunityPaths();
    return { ok: true, data: { bookmarked: true } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to update bookmark.",
    };
  }
}

export async function upsertApplicationAction(
  payload: unknown,
  fitSnapshot?: Json
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser("/opportunities");
  const parsed = upsertApplicationSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check your application tracker fields.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("opportunity_applications")
      .select("id, submitted_at")
      .eq("user_id", user.id)
      .eq("opportunity_id", parsed.data.opportunityId)
      .maybeSingle();

    const submittedAt =
      parsed.data.status === "submitted" ||
      parsed.data.status === "interviewing" ||
      parsed.data.status === "offer" ||
      parsed.data.status === "accepted"
        ? existing?.submitted_at ?? new Date().toISOString()
        : existing?.submitted_at ?? null;

    const nextReminderAt = parsed.data.nextReminderDate
      ? `${parsed.data.nextReminderDate}T09:00:00Z`
      : null;

    const { data, error } = await supabase
      .from("opportunity_applications")
      .upsert(
        {
          user_id: user.id,
          opportunity_id: parsed.data.opportunityId,
          status: parsed.data.status,
          personal_notes: parsed.data.personalNotes,
          external_reference: parsed.data.externalReference,
          submitted_at: submittedAt,
          next_reminder_at: nextReminderAt,
          ...(fitSnapshot !== undefined ? { fit_snapshot: fitSnapshot } : {}),
        },
        { onConflict: "user_id,opportunity_id" }
      )
      .select("id")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: `Failed to save application tracker: ${error?.message ?? "Unknown error"}`,
      };
    }

    revalidateOpportunityPaths();
    return { ok: true, data: { id: data.id } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to save application status.",
    };
  }
}

export async function deleteApplicationAction(
  opportunityId: string
): Promise<ActionResult> {
  const user = await requireUser("/opportunities");
  if (!/^[0-9a-f-]{36}$/i.test(opportunityId)) {
    return { ok: false, error: "Invalid opportunity identifier." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("opportunity_applications")
      .delete()
      .eq("user_id", user.id)
      .eq("opportunity_id", opportunityId);

    if (error) {
      return { ok: false, error: `Failed to remove tracked application: ${error.message}` };
    }

    revalidateOpportunityPaths();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to remove application.",
    };
  }
}
