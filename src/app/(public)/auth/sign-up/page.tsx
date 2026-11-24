"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { signUpAction, type AuthActionState } from "@/modules/identity/actions";

const initialState: AuthActionState = { status: "idle", message: "" };

export default function SignUpPage() {
  const [state, formAction, isPending] = React.useActionState(signUpAction, initialState);

  return (
    <Card className="shadow-[var(--shadow-2)]">
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Build your verified professional identity and discover global opportunities.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="signup-name" required>
              Full name
            </Label>
            <Input
              id="signup-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Amina Osei-Bonsu"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signup-email" required>
              Email address
            </Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@domain.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signup-password" required>
              Password
            </Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <label className="flex items-start gap-2.5 text-xs text-ink-secondary cursor-pointer">
            <input
              type="checkbox"
              name="acceptTerms"
              required
              className="mt-0.5 h-4 w-4 rounded border-border-strong accent-brand"
            />
            <span>
              I agree to the DG NEXUS Terms of Service and Privacy Policy (GDPR &amp; NDPA
              compliant; your consent is recorded).
            </span>
          </label>

          {state.status === "error" && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-text"
            >
              {state.message}
            </div>
          )}

          {state.status === "success" && (
            <div
              role="status"
              className="rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success-text"
            >
              {state.message}
            </div>
          )}

          <Button type="submit" className="w-full" loading={isPending}>
            Create Account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-ink-secondary">
        <span>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="font-semibold text-brand hover:underline">
            Sign In
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
