import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { AccountMenu, getInitials } from "@/components/shell/account-menu";
import { isProtectedAppPath } from "@/lib/supabase/middleware";
import { mapAuthCallbackError } from "@/modules/identity/oauth";

vi.mock("@/modules/identity/actions", () => ({
  signOutAction: vi.fn(),
}));

describe("M1.2 account menu, Sign-Out and Google OAuth flows", () => {
  it("derives clean initials for account avatars", () => {
    expect(getInitials("Amina Osei-Bonsu", "amina@example.com")).toBe("AO");
    expect(getInitials("", "daniel@dgconcept.org")).toBe("DA");
    expect(getInitials(null, null)).toBe("M");
  });

  it("renders the accessible account menu trigger in TopBar", () => {
    render(<AccountMenu fullName="Amina Osei" userEmail="amina@example.com" />);
    const trigger = screen.getByRole("button", { name: /open account menu/i });
    expect(trigger).toBeTruthy();
    expect(screen.getByText("AO")).toBeTruthy();
  });

  it("maps OAuth cancellation, disabled provider, and generic callback failures safely", () => {
    expect(mapAuthCallbackError("access_denied", null)).toMatch(/cancelled/i);
    expect(
      mapAuthCallbackError("provider_not_enabled", "Unsupported provider: provider is not enabled")
    ).toMatch(/not yet enabled/i);
    expect(mapAuthCallbackError("auth_callback_failed", null)).toMatch(/could not complete/i);
    expect(mapAuthCallbackError(null, null)).toBeNull();
  });

  it("protects /onboarding under authenticated middleware routes", () => {
    expect(isProtectedAppPath("/onboarding")).toBe(true);
    expect(isProtectedAppPath("/onboarding/step-2")).toBe(true);
  });

  it("renders Google OAuth buttons for both Sign-In and Sign-Up modes", () => {
    const { rerender } = render(<GoogleOAuthButton mode="sign-in" />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeTruthy();

    rerender(<GoogleOAuthButton mode="sign-up" />);
    expect(screen.getByRole("button", { name: /sign up with google/i })).toBeTruthy();
  });
});
