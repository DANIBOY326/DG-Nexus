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
import {
  requestPasswordResetAction,
  type AuthActionState,
} from "@/modules/identity/actions";

const initialState: AuthActionState = { status: "idle", message: "" };

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = React.useActionState(
    requestPasswordResetAction,
    initialState
  );

  return (
    <Card className="shadow-[var(--shadow-2)]">
      <CardHeader>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>
          Enter the email address associated with your account and we will send a secure
          recovery link.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-email" required>
              Email address
            </Label>
            <Input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@domain.com"
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

          {state.status === "success" && (
            <div
              role="status"
              className="rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success-text"
            >
              {state.message}
            </div>
          )}

          <Button type="submit" className="w-full" loading={isPending}>
            Send Reset Link
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-ink-secondary">
        <Link href="/auth/sign-in" className="font-semibold text-brand hover:underline">
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
