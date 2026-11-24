import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  variant?: "light" | "dark";
  showWordmark?: boolean;
  showParentAttribution?: boolean;
  className?: string;
}

/**
 * Canonical hexagonal node brand mark (Screen 86 + founder logo emblem).
 * - `light`: Royal Blue gradient badge (#1D4ED8 -> #0F4C81) with white node mark (default app UI)
 * - `dark`: Deep navy badge (#0B1120) with sky-blue (#38BDF8) outline & node mark (dark surfaces)
 * Note: Parent brand attribution (`by DGConcept`) is omitted in everyday in-app chrome.
 */
export function BrandMark({
  size = 32,
  variant = "light",
  showWordmark = true,
  showParentAttribution = false,
  className,
}: BrandMarkProps) {
  const strokeColor = variant === "dark" ? "#38BDF8" : "#FFFFFF";
  const nodeColor = variant === "dark" ? "#38BDF8" : "#FFFFFF";

  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        {variant === "light" ? (
          <>
            <defs>
              <linearGradient
                id="dgBrandGrad"
                x1="0"
                y1="0"
                x2="40"
                y2="40"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#0F4C81" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="10" fill="url(#dgBrandGrad)" />
          </>
        ) : (
          <rect
            x="1.5"
            y="1.5"
            width="37"
            height="37"
            rx="9.5"
            fill="#0B1120"
            stroke="#38BDF8"
            strokeWidth="2"
          />
        )}
        <polygon
          points="20,7.5 31,13.8 31,26.2 20,32.5 9,26.2 9,13.8"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="20" cy="20" r="4.2" fill={nodeColor} />
        <line x1="20" y1="7.5" x2="20" y2="15.8" stroke={strokeColor} strokeWidth="2.2" />
        <line x1="31" y1="26.2" x2="23.6" y2="22.1" stroke={strokeColor} strokeWidth="2.2" />
        <line x1="9" y1="26.2" x2="16.4" y2="22.1" stroke={strokeColor} strokeWidth="2.2" />
      </svg>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-ink whitespace-nowrap">
            DG NEXUS
          </span>
          {showParentAttribution && (
            <span className="mt-0.5 text-[11px] font-medium text-ink-muted whitespace-nowrap">
              by DGConcept
            </span>
          )}
        </span>
      )}
    </span>
  );
}
