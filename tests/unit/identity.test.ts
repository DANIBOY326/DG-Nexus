import { describe, expect, it } from "vitest";
import { isProtectedAppPath } from "@/lib/supabase/middleware";
import {
  sanitiseRedirectPath,
  signInSchema,
  signUpSchema,
} from "@/modules/identity/schemas";

describe("M0.5 identity validation & security guards", () => {
  it("blocks open-redirect URLs and only allows safe single-slash paths", () => {
    expect(sanitiseRedirectPath("/opportunities/123")).toBe("/opportunities/123");
    expect(sanitiseRedirectPath("https://evil.example.com")).toBe("/home");
    expect(sanitiseRedirectPath("//evil.example.com")).toBe("/home");
    expect(sanitiseRedirectPath("/\\evil")).toBe("/home");
    expect(sanitiseRedirectPath("/home\r\nSet-Cookie: x=1")).toBe("/home");
    expect(sanitiseRedirectPath(null)).toBe("/home");
  });

  it("enforces mandatory Terms & Privacy consent on sign-up", () => {
    const missingConsent = signUpSchema.safeParse({
      fullName: "Amina Osei",
      email: "amina@example.com",
      password: "secure-password-123",
      acceptTerms: false,
    });
    expect(missingConsent.success).toBe(false);

    const valid = signUpSchema.safeParse({
      fullName: "Amina Osei",
      email: "amina@example.com",
      password: "secure-password-123",
      acceptTerms: true,
    });
    expect(valid.success).toBe(true);
  });

  it("rejects weak sign-in passwords and malformed emails", () => {
    const res = signInSchema.safeParse({
      email: "not-an-email",
      password: "123",
    });
    expect(res.success).toBe(false);
  });

  it("identifies protected authenticated workspace paths accurately", () => {
    expect(isProtectedAppPath("/home")).toBe(true);
    expect(isProtectedAppPath("/opportunities/fellowship-1")).toBe(true);
    expect(isProtectedAppPath("/settings")).toBe(true);
    expect(isProtectedAppPath("/auth/sign-in")).toBe(false);
    expect(isProtectedAppPath("/")).toBe(false);
  });
});
