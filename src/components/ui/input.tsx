import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          "flex min-h-11 w-full rounded-lg border bg-surface px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand",
          "disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60",
          error ? "border-danger" : "border-border-strong hover:border-slate-400",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn("block text-sm font-medium text-ink", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-danger-text" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          "flex min-h-24 w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand",
          "disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60",
          error ? "border-danger" : "border-border-strong hover:border-slate-400",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
