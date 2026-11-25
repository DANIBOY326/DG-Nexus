import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitiseRedirectPath } from "@/modules/identity/schemas";
import { ensureInitialTermsConsent, getOwnProfile } from "@/modules/profiles/repo";

/**
 * Handles Supabase Auth PKCE code exchange for email confirmation,
 * Google OAuth sign-in, and password reset links with open-redirect protection,
 * cancellation handling, idempotent consent logging, and onboarding routing.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const nextPath = sanitiseRedirectPath(searchParams.get("next"));

  if (oauthError) {
    const signInUrl = new URL("/auth/sign-in", origin);
    signInUrl.searchParams.set("error", oauthError);
    if (oauthErrorDescription) {
      signInUrl.searchParams.set("error_description", oauthErrorDescription.slice(0, 180));
    }
    return NextResponse.redirect(signInUrl);
  }

  if (code && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          await ensureInitialTermsConsent(user.id);
          const profile = await getOwnProfile(user.id);
          if (profile && !profile.onboarding_completed_at && nextPath !== "/settings") {
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        } catch {
          // Do not block verified login if optional post-login lookup fails transiently.
        }
      }

      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_callback_failed`);
}
