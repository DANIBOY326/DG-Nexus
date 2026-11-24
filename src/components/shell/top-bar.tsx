"use client";

import Link from "next/link";
import { Bell, Search, UserCircle2 } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

interface TopBarProps {
  onOpenSearch: () => void;
  userEmail?: string | null;
}

export function TopBar({ onOpenSearch, userEmail }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between gap-3 border-b border-border-base bg-surface/95 px-4 md:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3 md:hidden">
        <Link href="/home" aria-label="DG NEXUS Home">
          <BrandMark size={28} showWordmark />
        </Link>
      </div>

      <div className="hidden md:flex md:flex-1 md:max-w-md">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-border-strong bg-canvas px-3 text-sm text-ink-muted hover:border-slate-400 hover:text-ink-secondary cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Search opportunities, people, skills...</span>
          </span>
          <kbd className="hidden lg:inline-flex rounded border border-border-default bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Open global search"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-subtle hover:text-ink md:hidden cursor-pointer"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link
          href="/notifications"
          aria-label="Notifications"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-secondary hover:bg-subtle hover:text-ink"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </Link>

        <Link
          href="/profile"
          aria-label="Account profile"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-ink-secondary hover:bg-subtle hover:text-ink"
        >
          <UserCircle2 className="h-6 w-6 text-brand shrink-0" aria-hidden="true" />
          <span className="hidden lg:inline max-w-[160px] truncate">
            {userEmail ?? "Member"}
          </span>
        </Link>
      </div>
    </header>
  );
}
