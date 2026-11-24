"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PRIMARY_NAV_ITEMS } from "@/components/shell/nav-config";

interface CommandSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_SCOPES = [
  { label: "Search Verified Opportunities", href: "/opportunities", category: "Opportunities" },
  { label: "Discover People & Peers", href: "/network", category: "Network" },
  { label: "Ask Nexus AI Career Coach", href: "/ai", category: "Nexus AI" },
  { label: "Edit Profile & Growth Record", href: "/profile", category: "Profile" },
  { label: "Account & Privacy Settings", href: "/settings", category: "Settings" },
];

export function CommandSearchModal({ open, onOpenChange }: CommandSearchModalProps) {
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const trimmed = query.trim().toLowerCase();
  const filteredScopes = QUICK_SCOPES.filter(
    (item) =>
      !trimmed ||
      item.label.toLowerCase().includes(trimmed) ||
      item.category.toLowerCase().includes(trimmed)
  );

  function navigateTo(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden">
        <div className="sr-only">
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>
            Search opportunities, people, skills, organisations, or jump to a section.
          </DialogDescription>
        </div>
        <div className="flex items-center gap-2 border-b border-border-base px-4 py-3">
          <Search className="h-4 w-4 text-ink-muted shrink-0" aria-hidden="true" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search opportunities, skills, people, or jump to..."
            className="border-0 px-0 shadow-none focus-visible:outline-none min-h-9"
            aria-label="Global search query"
          />
          <kbd className="hidden sm:inline-flex rounded border border-border-default bg-subtle px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-3 space-y-3">
          <div>
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Quick Actions
            </p>
            <ul className="space-y-1">
              {filteredScopes.map((item) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => navigateTo(item.href)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-subtle cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                      {item.category}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
              {filteredScopes.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-ink-muted">
                  Full database search across opportunities and people activates in M3.
                </li>
              )}
            </ul>
          </div>

          <div className="border-t border-border-base pt-2">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Primary Navigation
            </p>
            <div className="flex flex-wrap gap-1.5 px-2">
              {PRIMARY_NAV_ITEMS.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => navigateTo(item.href)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-brand-soft hover:text-brand cursor-pointer"
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
