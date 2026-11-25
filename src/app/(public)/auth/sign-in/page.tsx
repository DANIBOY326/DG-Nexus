"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
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
import { signInAction, type AuthActionState } from "@/modules/identity/actions";
import { mapAuthCallbackError } from "@/modules/identity/oauth";

const initialState: AuthActionState = { status: "idle", message: "" };

function SignInForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/home";
  const callbackError = mapAuthCallbackError(
    searchParams.get("error"),
    searchParams.get("error_description")
  );
  const [state, formAction, isPending] = React.useActionState(signInAction, initialState);

  return (
    <Card className="shadow-[var(--shadow-2)]">
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your DG NEXUS professional workspace.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {callbackError && (
          <div
            role="alert"
            className="rounded-lg border border-warning/40 bg-warning-soft px-3.5 py-2.5 text-sm text-warning-text"
          >
            {callbackError}
          </div>
        )}

        <GoogleOAuthButton mode="sign-in" nextPath={nextPath} />

        <div className="relative flex items-center">
          <div className="flex-1 border-t border-border-base" />
          <span className="px-3 text-xs font-medium text-ink-muted">
            or sign in with email
          </span>
          <div className="flex-1 border-t border-border-base" />
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />

          <div className="space-y-1.5">
            <Label htmlFor="signin-email" required>
              Email address
            </Label>
            <Input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@domain.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="signin-password" required>
                Password
              </Label>
              <Link
                href="/auth/reset-password"
                className="text-xs font-semibold text-brand hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </div>

          {state.status === "error" && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-text"
            >
              {state.message}
            </div>
          )}

          <Button type="submit" className="w-full" loading={isPending}>
            Sign In
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-ink-secondary">
        <span>
          New to DG NEXUS?{" "}
          <Link href="/auth/sign-up" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <React.Suspense fallback={<Card className="p-6 text-sm text-ink-muted">Loading...</Card>}>
      <SignInForm />
    </React.Suspense>
  );
}
