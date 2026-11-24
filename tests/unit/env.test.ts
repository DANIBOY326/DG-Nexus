import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/lib/env";
import { buildSecurityHeaders } from "@/lib/security/headers";
import { formatCurrency, formatUtcDate } from "@/lib/utils";

describe("M0.1 environment contract", () => {
  it("accepts a valid public environment configuration", () => {
    const parsed = parsePublicEnv({
      NEXT_PUBLIC_APP_ENV: "staging",
      NEXT_PUBLIC_SITE_URL: "https://staging.dgnexus.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefg.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-test-key",
    });

    expect(parsed.NEXT_PUBLIC_APP_ENV).toBe("staging");
    expect(parsed.NEXT_PUBLIC_SITE_URL).toBe("https://staging.dgnexus.com");
  });

  it("throws a descriptive error when required public keys are invalid or missing", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_APP_ENV: "development",
        NEXT_PUBLIC_SITE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "short",
      })
    ).toThrow(/Invalid public environment configuration/);
  });

  it("includes essential OWASP HTTP security headers", () => {
    const headers = buildSecurityHeaders();
    const keys = headers.map((h) => h.key);

    expect(keys).toContain("Content-Security-Policy");
    expect(keys).toContain("X-Frame-Options");
    expect(keys).toContain("X-Content-Type-Options");
    expect(keys).toContain("Strict-Transport-Security");
  });

  it("formats global UTC dates and ISO-4217 currencies consistently", () => {
    expect(formatUtcDate("2026-11-24T12:00:00Z", { timeZone: "UTC" })).toBe("24 Nov 2026");
    expect(formatCurrency(5000, "USD", "en-GB")).toContain("5,000");
  });
});
