import type { MetadataRoute } from "next";

/**
 * Lightweight PWA installability manifest (TDR-011).
 * Offline Service Workers and Web Push are intentionally deferred until Phase 2+.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DG NEXUS",
    short_name: "DG NEXUS",
    description:
      "AI-powered professional growth, verified opportunity discovery, and collaboration ecosystem.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/brand/logo-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
