import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DG NEXUS — Connecting People. Creating Possibilities.",
    template: "%s | DG NEXUS",
  },
  description:
    "AI-powered professional growth, opportunity discovery, and collaboration ecosystem by DGConcept.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
