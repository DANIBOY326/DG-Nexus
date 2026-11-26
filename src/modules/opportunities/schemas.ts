import { z } from "zod";

export const toggleBookmarkSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity identifier."),
  notes: z.string().trim().max(500).optional().default(""),
});

export const upsertApplicationSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity identifier."),
  status: z.enum([
    "saved",
    "preparing",
    "submitted",
    "interviewing",
    "offer",
    "accepted",
    "rejected",
    "withdrawn",
  ]),
  personalNotes: z
    .string()
    .trim()
    .max(2000, "Personal notes must be 2,000 characters or fewer.")
    .optional()
    .default(""),
  externalReference: z
    .string()
    .trim()
    .max(120, "Reference ID must be 120 characters or fewer.")
    .optional()
    .default(""),
  nextReminderDate: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Reminder date must use YYYY-MM-DD format.",
    }),
});

export type UpsertApplicationInput = z.infer<typeof upsertApplicationSchema>;
