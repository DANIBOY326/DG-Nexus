"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}

/**
 * Accessible ARIA role="switch" control with 44px touch area and WCAG AA focus ring.
 */
export function Switch({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  ...ariaProps
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      {...ariaProps}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150",
          checked ? "bg-brand" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform duration-150",
            checked ? "translate-x-5.5" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
