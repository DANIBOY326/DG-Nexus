-- ============================================================================
-- DG NEXUS — Milestone M0.4b Least-Privilege Role Grants (Postgres 17 / Publishable Keys)
-- Note: Table-level privileges are gated strictly by existing RLS policies from
--       202611240001_m0_foundation.sql. consent_logs and audit_logs remain append-only.
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- Publicly discoverable reads (filtered by RLS: public profiles & verified orgs only)
grant select on public.profiles to anon;
grant select on public.organisations to anon;

-- Authenticated member & tenant operations (filtered strictly by RLS policies)
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.organisations to authenticated;
grant select, insert, update, delete on public.organisation_memberships to authenticated;

-- Append-only compliance & audit ledgers (no UPDATE or DELETE granted)
grant select, insert on public.consent_logs to authenticated;
grant select, insert on public.audit_logs to authenticated;

-- Helper function used inside tenant RLS checks
grant execute on function public.is_org_role(uuid, text[]) to authenticated;
