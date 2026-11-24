import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/shell/app-shell";
import { isNavItemActive, PRIMARY_NAV_ITEMS } from "@/components/shell/nav-config";

vi.mock("next/navigation", () => ({
  usePathname: () => "/opportunities",
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

describe("M0.3 responsive application shell", () => {
  it("resolves active navigation paths accurately", () => {
    expect(isNavItemActive("/home", "/home")).toBe(true);
    expect(isNavItemActive("/opportunities/123", "/opportunities")).toBe(true);
    expect(isNavItemActive("/profile", "/opportunities")).toBe(false);
  });

  it("renders all 5 canonical Phase 1 navigation items in desktop and mobile shells", () => {
    render(
      <AppShell userEmail="amina@example.com">
        <div>Shell Content</div>
      </AppShell>
    );

    expect(screen.getByText("Shell Content")).toBeTruthy();
    for (const item of PRIMARY_NAV_ITEMS) {
      expect(screen.getAllByText(item.label).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("opens Global Search dialog via Ctrl+K keyboard shortcut", () => {
    render(
      <AppShell>
        <div>Workspace</div>
      </AppShell>
    );

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByLabelText("Global search query")).toBeTruthy();
  });
});
