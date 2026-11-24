import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import manifest from "@/app/manifest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

describe("M0.2 design system primitives & PWA manifest", () => {
  it("renders Button loading state as disabled and aria-busy", () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole("button", { name: /saving/i });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });

  it("distinguishes Verified and Nexus AI semantic badges", () => {
    render(
      <div>
        <Badge variant="verified" showIcon>
          Verified Organisation
        </Badge>
        <Badge variant="ai" showIcon>
          Nexus AI Match
        </Badge>
      </div>
    );
    expect(screen.getByText("Verified Organisation")).toBeTruthy();
    expect(screen.getByText("Nexus AI Match")).toBeTruthy();
  });

  it("renders calm EmptyState with title, description and single CTA", () => {
    render(
      <EmptyState
        icon={<span data-testid="empty-icon" />}
        title="No applications yet"
        description="Start tracking opportunities."
        action={<Button>Browse</Button>}
      />
    );
    expect(screen.getByText("No applications yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Browse" })).toBeTruthy();
  });

  it("serves a lightweight installable PWA manifest with canonical brand colours", () => {
    const config = manifest();
    expect(config.name).toBe("DG NEXUS");
    expect(config.theme_color).toBe("#1d4ed8");
    expect(config.display).toBe("standalone");
  });
});
