/**
 * Maps Supabase / Google OAuth callback error codes into clear, safe user-facing copy.
 * Never reflects raw untrusted HTML or stack traces.
 */
export function mapAuthCallbackError(
  errorCode: string | null | undefined,
  errorDescription?: string | null
): string | null {
  if (!errorCode && !errorDescription) return null;

  const normalisedCode = (errorCode ?? "").toLowerCase();
  const normalisedDesc = (errorDescription ?? "").toLowerCase();

  if (
    normalisedCode === "access_denied" ||
    normalisedDesc.includes("cancel") ||
    normalisedDesc.includes("access_denied")
  ) {
    return "Google sign-in was cancelled. You can try again or continue with email.";
  }

  if (
    normalisedCode === "provider_not_enabled" ||
    normalisedDesc.includes("provider is not enabled") ||
    normalisedDesc.includes("unsupported provider")
  ) {
    return "Google sign-in is not yet enabled in this Supabase environment. Please continue with email while Google OAuth is configured.";
  }

  if (normalisedCode === "session_expired") {
    return "Your session expired. Please sign in again to continue.";
  }

  return "We could not complete your sign-in request. Please try again or use email authentication.";
}
