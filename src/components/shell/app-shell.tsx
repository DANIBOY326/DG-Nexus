"use client";

import * as React from "react";
import { CommandSearchModal } from "@/components/shell/command-search-modal";
import { DesktopSidebar } from "@/components/shell/desktop-sidebar";
import { MobileBottomNav } from "@/components/shell/mobile-bottom-nav";
import { TopBar } from "@/components/shell/top-bar";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  fullName?: string | null;
}

/**
 * Responsive Multi-Device Shell:
 * - Mobile (< 768px): 56px TopBar + content + 64px fixed BottomNav
 * - Tablet (768px-1023px): Collapsed 72px icon rail (expandable) + TopBar + 8-col canvas
 * - Desktop (>= 1024px): Persistent 240px sidebar (collapsible) + TopBar + 12-col canvas (max 1440px shell)
 */
export function AppShell({ children, userEmail, fullName }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const tabletQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const syncTabletRail = () => {
      if (tabletQuery.matches) {
        setSidebarCollapsed(true);
      }
    };
    syncTabletRail();
    tabletQuery.addEventListener("change", syncTabletRail);
    return () => tabletQuery.removeEventListener("change", syncTabletRail);
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1440px] bg-canvas">
      <DesktopSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenSearch={() => setSearchOpen(true)}
          userEmail={userEmail}
          fullName={fullName}
        />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 pb-24 md:px-6 md:pb-8 lg:px-8">
          {children}
        </main>
      </div>

      <MobileBottomNav />
      <CommandSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
