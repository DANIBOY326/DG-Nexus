# DG NEXUS

**DG NEXUS** *(by DGConcept)* — Connected Professional Operating Environment for verified global opportunities, proof-of-work competency profiles, and explainable Nexus AI.

---

## Local Development Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

* Design System Showcase (non-production only): `http://localhost:3000/dev/design-system`
* Responsive Application Shell: `http://localhost:3000/home`
* Auth Foundation: `http://localhost:3000/auth/sign-in` · `/auth/sign-up` · `/auth/reset-password`

## Verification Commands

```bash
npm run typecheck   # Strict TypeScript check
npm run lint        # ESLint 9 + Next.js 16 flat config
npm run test        # Vitest unit & security guard tests
npm run build       # Next.js 16 Turbopack production build
npm audit --audit-level=high
```

## Connecting Supabase Staging (`M0.4` / `M0.7`)

1. Create a free **Staging** project at [supabase.com](https://supabase.com).
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
3. Link and push the foundation migration (`profiles`, `organisations`, `organisation_memberships`, `consent_logs`, `audit_logs` + Row-Level Security):
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
4. Under **Supabase Auth → URL Configuration**, add your local and Vercel Staging callback URLs:
   * `http://localhost:3000/auth/callback`
   * `https://<your-vercel-staging-url>/auth/callback`

## Staging Deployment on Vercel (`M0.7`)

1. Push this repository to a private GitHub repository (`main` branch triggers `.github/workflows/ci.yml`).
2. Import the repository into **Vercel Hobby** (strictly for non-commercial M0–M5 development; upgrade to **Vercel Pro** and **Supabase Pro** prior to commercial launch per `TDR-004` and `TDR-006`).
3. Configure Staging environment variables in Vercel (`NEXT_PUBLIC_APP_ENV=staging`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

## Project Documentation
* [Brand & Visual Guidelines](docs/brand_guidelines.md)
* [Milestone Evidence Log](docs/milestone_log.md)
