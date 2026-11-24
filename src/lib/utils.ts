import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO-8601 UTC timestamp for display in a user's IANA time zone.
 * Global-first standard (TDR-001).
 */
export function formatUtcDate(
  isoDate: string | Date,
  options?: { timeZone?: string; locale?: string }
): string {
  const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
  return new Intl.DateTimeFormat(options?.locale ?? "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: options?.timeZone ?? "UTC",
  }).format(date);
}

/**
 * Formats an ISO-4217 currency amount cleanly across global currencies (USD, NGN, GBP, EUR).
 */
export function formatCurrency(
  amount: number,
  currencyCode = "USD",
  locale = "en-GB"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}
