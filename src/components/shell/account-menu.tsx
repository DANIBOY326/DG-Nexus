"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/modules/identity/actions";

interface AccountMenuProps {
  userEmail?: string | null;
  fullName?: string | null;
  onSignOut?: () => Promise<void> | void;
}

export function getInitials(fullName?: string | null, email?: string | null): string {
  const source = fullName?.trim() || email?.split("@")[0] || "M";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AccountMenu({ userEmail, fullName, onSignOut }: AccountMenuProps) {
  const [isSigningOut, startSignOut] = React.useTransition();
  const displayName = fullName?.trim() || userEmail || "Member";
  const initials = getInitials(fullName, userEmail);

  function handleSignOut() {
    startSignOut(async () => {
      if (onSignOut) {
        await onSignOut();
      } else {
        await signOutAction();
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-subtle hover:text-ink cursor-pointer"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand"
          >
            {initials}
          </span>
          <span className="hidden max-w-[150px] truncate lg:inline text-ink">
            {displayName}
          </span>
          <ChevronDown
            className="hidden h-4 w-4 text-ink-muted lg:inline shrink-0"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-0.5">
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            {userEmail && (
              <p className="truncate text-xs text-ink-muted">{userEmail}</p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="h-4 w-4 text-ink-muted" aria-hidden="true" />
            <span>Profile &amp; Growth Record</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/onboarding?revisit=1">
            <Sparkles className="h-4 w-4 text-ink-muted" aria-hidden="true" />
            <span>Update Onboarding</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <ShieldCheck className="h-4 w-4 text-ink-muted" aria-hidden="true" />
            <span>Privacy &amp; Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
          className="text-danger-text focus:bg-danger-soft focus:text-danger-text"
        >
          {isSigningOut ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
