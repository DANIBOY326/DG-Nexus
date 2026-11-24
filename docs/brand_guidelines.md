# DG NEXUS — Brand & Visual Guidelines (v1.0)

**Source of Truth:** Flowstep `DG Nexus UI` — Screen 86 (`DG Nexus Design System`)  
**Status:** Canonical Product Baseline (`TDR-016` — pending final original vector logo archive)

---

## 1. Brand Positioning & Personality
* **Product Name:** DG NEXUS
* **Parent Brand Attribution:** By DGConcept
* **Tagline:** *Connecting People. Creating Possibilities.*
* **Core Philosophy:** `Discover · Connect · Learn · Collaborate · Build · Achieve`
* **Personality:** Confident, intelligent, calm, globally credible, and enterprise-ready.
* **Parent Brand Rule:** Show `DG NEXUS` alone inside everyday application navigation and workspaces. Attribute `by DGConcept` in marketing footers, legal notices, splash/about pages, and institutional documentation.

## 2. Logo Usage & Variations
* **Primary Mark:** Hexagonal network node mark representing the Unified Professional Graph, paired with the `DG NEXUS` wordmark in `Inter` Bold/SemiBold.
* **Clear Space:** Maintain at least `0.5x` the icon height on all sides.
* **Do Not:** Stretch, apply heavy neon glow shadows, place on clashing busy backgrounds, or recolour outside approved brand tokens.

## 3. Colour System (Blue-Led Light-First Enterprise Palette)
* **Primary (`#1D4ED8`):** Reserved strictly for primary CTAs, active tabs/nav states, links, and focus rings.
* **Surfaces:** Calm light-first canvas (`#F8FAFC`), crisp white cards (`#FFFFFF`), subtle `1px` slate borders (`#E2E8F0`).
* **Semantic Tokens (with WCAG 2.1 AA Text Shades):**
  * **Verified / Success:** `#10B981` (icons/badges) · `#047857` (AA text on `#ECFDF5` / `#FFFFFF`)
  * **Warning / Deadlines:** `#F59E0B` (icons/borders) · `#B45309` (AA text on `#FFFBEB` / `#FFFFFF`)
  * **Danger / Destructive:** `#EF4444` (borders/buttons) · `#B91C1C` (AA text on `#FEF2F2` / `#FFFFFF`)
* **Verified vs AI Visual Grammar:**
  * Verified platform facts and verified organisations use **Emerald (`#10B981` / `#047857`)** check badges.
  * AI-generated insights, match explanations, and drafts use a dedicated **Indigo surface (`#EEF2FF` fill, `#C7D2FE` border, `#4338CA` text/icon)** with an explicit `Nexus AI` label so users never confuse AI inference with verified platform records.
* **Gradient Restraint:** Reserve `--color-brand-gradient` (`#1D4ED8 → #0F4C81`) strictly for auth hero panels, welcome banners, and primary Nexus AI headers—never for standard cards or buttons.

## 4. Typography & Iconography
* **Typeface:** `Inter` (self-hosted via `next/font/google`), tabular numerals (`tabular-nums`) for match scores, deadlines, and KPIs.
* **Scale:** Display `30px`, H1 `24px`, H2 `20px`, H3 `17px`, Body `15px` (`1.5` line height), Small `14px`, Caption `12px` minimum.
* **Icons:** `Lucide` exclusively (`1.75px` default stroke; `16px / 20px / 24px` sizes).

## 5. Layout, Accessibility & Motion
* **Spacing Scale:** `4 / 8 / 12 / 16 / 24 / 32 / 40px`.
* **Radius & Elevation:** `8px` buttons/inputs, `12px` cards/drawers, `9999px` pills/avatars; soft 1–3dp elevation.
* **Accessibility:** WCAG 2.1 AA contrast (`>= 4.5:1` text, `>= 3:1` controls), `44px x 44px` minimum mobile touch targets, `2px` `#1D4ED8` visible keyboard focus rings, full `prefers-reduced-motion` compliance.
* **Motion:** Calm `150–200ms ease-out` functional transitions; zero decorative 3D canvases, glare tilts, or shimmering text in the application UI.
