import { z } from "zod";

export const TERMS_POLICY_VERSION = "2026-11-v1";

export const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  next: z.string().optional(),
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name (at least 2 characters).")
    .max(120, "Name is too long."),
  email: z.string().trim().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
  acceptTerms: z.literal(true, {
    error: "You must accept the Terms of Service and Privacy Policy to continue.",
  }),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

/**
 * Prevents open-redirect attacks on auth callbacks and post-login redirects.
 * Only permits safe, relative single-slash internal paths.
 */
export function sanitiseRedirectPath(rawNext: string | null | undefined): string {
  if (!rawNext) return "/home";
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return "/home";
  }
  if (/[\r\n]/.test(trimmed)) {
    return "/home";
  }
  return trimmed;
}
