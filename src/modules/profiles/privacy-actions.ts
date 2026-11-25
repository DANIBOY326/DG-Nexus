"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/identity/guards";
import { AI_CONSENT_POLICY_VERSION } from "@/modules/profiles/constants";
import {
  recordConsentEvent,
  updateOwnProfile,
  type ConsentLogRow,
} from "@/modules/profiles/repo";
import { aiConsentUpdateSchema, visibilityUpdateSchema } from "@/modules/profiles/schemas";
import type { ActionResult } from "@/modules/profiles/actions";

export async function updateProfileVisibilityAction(
  payload: unknown
): Promise<ActionResult<{ visibilityScope: "public" | "connections" | "private" }>> {
  const user = await requireUser("/settings");
  const parsed = visibilityUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid visibility selection.",
    };
  }

  try {
    await updateOwnProfile(user.id, {
      visibility_scope: parsed.data.visibilityScope,
    });

    revalidatePath("/settings");
    revalidatePath("/home");
    revalidatePath("/profile");

    return {
      ok: true,
      data: { visibilityScope: parsed.data.visibilityScope },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update profile visibility.",
    };
  }
}

export async function updateAiContextConsentAction(
  payload: unknown
): Promise<ActionResult<{ granted: boolean; logEntry: ConsentLogRow }>> {
  const user = await requireUser("/settings");
  const parsed = aiConsentUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid AI consent request.",
    };
  }

  try {
    await updateOwnProfile(user.id, {
      ai_context_consent: parsed.data.granted,
    });

    const logEntry = await recordConsentEvent({
      userId: user.id,
      consentType: "ai_context_processing",
      policyVersion: AI_CONSENT_POLICY_VERSION,
      granted: parsed.data.granted,
    });

    revalidatePath("/settings");
    revalidatePath("/home");
    revalidatePath("/ai");

    return {
      ok: true,
      data: {
        granted: parsed.data.granted,
        logEntry,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update Nexus AI consent preference.",
    };
  }
}
