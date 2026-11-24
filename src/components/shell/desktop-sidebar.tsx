"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { PRIMARY_NAV_ITEMS, isNavItemActive } from "@/components/shell/nav-config";
import { cn } from "@/lib/utils";

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Adaptive Sidebar:
 * - Desktop (`lg:` >= 1024px): 240px persistent sidebar (collapsible to 72px)
 * - Tablet (`md:` 768px-1023px): 72px collapsed icon rail by default (expandable)
 * - Mobile (`< 768px`): Hidden (replaced by MobileBottomNav)
 */
export function DesktopSidebar({ collapsed, onToggleCollapse }: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Primary Sidebar Navigation"
      className={cn(
        "hidden md:flex md:flex-col md:shrink-0 border-r border-border-base bg-surface transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border-base px-4">
        <Link
          href="/home"
          aria-label="DG NEXUS Home"
          className="flex items-center overflow-hidden"
        >
          <BrandMark size={32} showWordmark={!collapsed} />
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-subtle hover:text-ink cursor-pointer"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <nav aria-label="Primary Navigation" className="flex-1 space-y-1 p-3">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-brand-soft text-brand"
                  : "text-ink-secondary hover:bg-subtle hover:text-ink"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-base p-3">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          aria-current={isNavItemActive(pathname, "/settings") ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
            collapsed && "justify-center px-0",
            isNavItemActive(pathname, "/settings")
              ? "bg-brand-soft text-brand"
              : "text-ink-secondary hover:bg-subtle hover:text-ink"
          )}
        >
          <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
