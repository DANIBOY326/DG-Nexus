import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-subtle text-ink-secondary",
        primary: "bg-brand-soft text-brand",
        verified: "bg-success-soft text-success-text",
        warning: "bg-warning-soft text-warning-text",
        danger: "bg-danger-soft text-danger-text",
        ai: "border border-ai-border bg-ai-surface text-ai-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  showIcon?: boolean;
}

/**
 * Semantic badge enforcing clear visual separation between:
 * - `verified` (Emerald check — verified platform data/organisations)
 * - `ai` (Indigo sparkle — AI-generated suggestions/explanations)
 */
export function Badge({ className, variant, showIcon = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {showIcon && variant === "verified" && (
        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" aria-hidden="true" />
      )}
      {showIcon && variant === "ai" && (
        <Sparkles className="h-3.5 w-3.5 text-ai-accent shrink-0" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
