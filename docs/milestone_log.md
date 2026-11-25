# DG NEXUS — Milestone Evidence Log

Tracks every milestone slice across the 6-stage maturity model:  
`Designed → Implemented → Connected → Functional → Tested → Production-Ready`

| Slice | Objective | Current Stage | Verification Evidence | Git Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| **M0.1** | Repo init, TS/Next.js config, env validation, security headers, Vitest | `Tested` | `npm audit`: 0 vulns; `typecheck`: pass; `lint`: pass; `vitest`: 4/4 pass; `next build` (16.4.6 Turbopack): pass | `chore(m0.1)` |
| **M0.2** | Brand guidelines, `tokens.css`, Inter font, PWA manifest, core UI primitives | `Tested` | `typecheck`: pass; `lint`: pass; `vitest`: 8/8 pass; `next build`: `/dev/design-system` + `/manifest.webmanifest` pass | `feat(m0.2)` |
| **M0.3** | Desktop (12-col), Tablet (rail) & Mobile (5-tab) responsive app shells | `Tested` | `typecheck`: pass; `lint`: pass; `vitest`: 11/11 pass; `next build`: all 12 routes built cleanly | `feat(m0.3)` |
| **M0.4** | Supabase foundation SQL migration, multi-tenant RLS & typed clients | `Tested` *(Live Staging Verified)* | Live Staging `wfwlykuanuzitocdjlwq`: `profiles` anon read → HTTP `200 []`; `consent_logs` anon read → HTTP `401 (42501)`; `audit_logs` anon read → HTTP `401 (42501)` | `fix(m0.4)` |
| **M0.5** | Supabase Auth flows, consent logging & server middleware route guards | `Tested` *(Live Staging Guard Verified)* | Unit tests (`15/15` pass); Live Staging `/home` → `307 /auth/sign-in?next=%2Fhome`; `/opportunities` → `307 /auth/sign-in?next=%2Fopportunities`; `/auth/sign-in` → `200 OK` | `feat(m0.5)` |
| **M0.6** | GitHub Actions CI (`ubuntu-latest`: typecheck, lint, test, build, secret scan) | `Connected` *(Pushed to `DANIBOY326/DG-Nexus`)* | `.github/workflows/ci.yml` live on `origin/main` + `README.md` + Screen 41 audit & `logo-mark-dark.svg` | `ci(m0.6)` |
| **M0.7** | Vercel Staging deployment & M0 sign-off | `Staging-Ready` *(Pre-Production)* | Live `https://dg-nexus.vercel.app` verified: `/` `200` + OWASP headers (`CSP`, `HSTS`, `X-Frame-Options`, `nosniff`), `/manifest.webmanifest` `200`, protected `/home` & `/opportunities` `307` redirect to `/auth/sign-in` | `v0.1.0-m0` |
| **M1.1** | M1 SQL migration (`skills`, `profile_skills`, `consent_logs` immutability), repos & AI consent guard | `Tested` *(local unit; awaiting Staging SQL apply)* | `typecheck`: pass; `lint`: pass; `vitest`: 21/21 pass; `202611250001_m1_onboarding_skills_privacy.sql` ready for Staging | `c255128` |
| **M1.2** | TopBar AccountMenu (Sign-Out), Google OAuth UI & callback hardening | `Tested` *(unit; live Google OAuth blocked on Supabase `google: false`)* | `typecheck`: pass; `lint`: pass; `vitest`: 26/26 pass; `/onboarding` added to `src/proxy.ts` protection | `554be19` |
| **M1.3** | 4-Step Structured Onboarding Wizard (Flowstep Screens 6–9) & personalised `/home` | `Tested` *(local unit & build; awaiting Staging migration)* | `typecheck`: pass; `lint`: pass; `vitest`: 30/30 pass; resumable step persistence & duplicate skill prevention | `7f7f686` |
| **M1.4** | Working `/settings` (Visibility, AI Consent Ledger, JSON Export) & live `/ai` consent gate | `Tested` *(local unit & build; awaiting Staging migration & push)* | `typecheck`: pass; `lint`: pass; `vitest`: 32/32 pass; `npm audit`: 0 vulns; `next build`: 18 routes + `ƒ /api/account/export` built cleanly | `feat(m1.4)` |
