"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, isNavItemActive } from "@/components/shell/nav-config";
import { cn } from "@/lib/utils";

/**
 * Mobile Fixed 5-Tab Bottom Navigation (< 768px only).
 * Enforces 44px+ tap targets and iOS/Android safe-area bottom inset.
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border-base bg-surface/95 backdrop-blur-xs md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid h-16 grid-cols-5 items-center px-1">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <li key={item.href} className="flex justify-center">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 text-[11px] font-semibold transition-colors",
                  active ? "text-brand" : "text-ink-muted hover:text-ink"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[68px]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
