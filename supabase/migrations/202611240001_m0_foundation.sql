-- ============================================================================
-- DG NEXUS — Milestone M0.4 Foundation Schema & Multi-Tenant RLS
-- Standards: Global-first (ISO-3166, IANA TZ, UTC), GDPR & NDPA consent ledger,
--            Default-deny Row-Level Security on every table (TDR-001, TDR-007)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Shared Trigger Helpers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Unified Profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  handle text unique,
  full_name text not null default '',
  headline text not null default '',
  bio text not null default '',
  avatar_url text,
  country_code char(2),
  city text,
  timezone text not null default 'UTC',
  career_goal text not null default '',
  availability_status text not null default 'open_to_opportunities'
    check (availability_status in ('open_to_opportunities', 'actively_looking', 'mentoring', 'collaborating', 'unavailable')),
  visibility_scope text not null default 'public'
    check (visibility_scope in ('public', 'connections', 'organisation', 'private')),
  ai_context_consent boolean not null default false,
  profile_completion_score smallint not null default 0
    check (profile_completion_score between 0 and 100),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_country_code on public.profiles (country_code);
create index if not exists idx_profiles_visibility on public.profiles (visibility_scope);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Automatically provision a baseline profile whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. Multi-Tenant Organisations & Memberships
-- ----------------------------------------------------------------------------
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  org_type text not null default 'company'
    check (org_type in ('company', 'university', 'ngo', 'community', 'research_institute', 'government', 'other')),
  description text not null default '',
  country_code char(2),
  website_url text,
  logo_url text,
  verification_tier text not null default 'unverified'
    check (verification_tier in ('unverified', 'domain_verified', 'officially_verified')),
  domain_verified_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organisations_verification on public.organisations (verification_tier);
create index if not exists idx_organisations_country on public.organisations (country_code);

drop trigger if exists trg_organisations_updated_at on public.organisations;
create trigger trg_organisations_updated_at
  before update on public.organisations
  for each row execute function public.set_updated_at();

create table if not exists public.organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'recruiter', 'member')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create index if not exists idx_org_memberships_user on public.organisation_memberships (user_id);
create index if not exists idx_org_memberships_org on public.organisation_memberships (organisation_id);

drop trigger if exists trg_org_memberships_updated_at on public.organisation_memberships;
create trigger trg_org_memberships_updated_at
  before update on public.organisation_memberships
  for each row execute function public.set_updated_at();

-- Tenant role check helper used consistently across RLS policies
create or replace function public.is_org_role(p_org_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisation_memberships m
    where m.organisation_id = p_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. GDPR & NDPA Consent Ledger (Append-Only for Users)
-- ----------------------------------------------------------------------------
create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_type text not null
    check (consent_type in ('terms_and_privacy', 'ai_context_processing', 'marketing_emails')),
  policy_version text not null,
  granted boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_consent_logs_user on public.consent_logs (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 5. Security & Governance Audit Trail
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  organisation_id uuid references public.organisations (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org on public.audit_logs (organisation_id, created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs (actor_user_id, created_at desc);

-- ============================================================================
-- 6. ROW-LEVEL SECURITY (Default-Deny on Every Table)
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_memberships enable row level security;
alter table public.consent_logs enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES policies
create policy "profiles_select_public_or_owner"
  on public.profiles for select
  using (
    visibility_scope = 'public'
    or auth.uid() = user_id
  );

create policy "profiles_insert_owner_only"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_owner_only"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ORGANISATIONS policies
create policy "organisations_select_verified_or_member"
  on public.organisations for select
  using (
    verification_tier in ('domain_verified', 'officially_verified')
    or created_by = auth.uid()
    or public.is_org_role(id, array['owner', 'admin', 'recruiter', 'member'])
  );

create policy "organisations_insert_authenticated"
  on public.organisations for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "organisations_update_org_admins"
  on public.organisations for update
  using (public.is_org_role(id, array['owner', 'admin']))
  with check (public.is_org_role(id, array['owner', 'admin']));

-- ORGANISATION_MEMBERSHIPS policies
create policy "memberships_select_self_or_org_admins"
  on public.organisation_memberships for select
  using (
    user_id = auth.uid()
    or public.is_org_role(organisation_id, array['owner', 'admin'])
  );

create policy "memberships_insert_org_admins_or_creator"
  on public.organisation_memberships for insert
  with check (
    public.is_org_role(organisation_id, array['owner', 'admin'])
    or (
      user_id = auth.uid()
      and role = 'owner'
      and exists (
        select 1 from public.organisations o
        where o.id = organisation_id and o.created_by = auth.uid()
      )
    )
  );

create policy "memberships_update_org_admins"
  on public.organisation_memberships for update
  using (public.is_org_role(organisation_id, array['owner', 'admin']))
  with check (public.is_org_role(organisation_id, array['owner', 'admin']));

create policy "memberships_delete_self_or_org_owners"
  on public.organisation_memberships for delete
  using (
    user_id = auth.uid()
    or public.is_org_role(organisation_id, array['owner'])
  );

-- CONSENT_LOGS policies (owner read + append-only insert; no update/delete)
create policy "consent_logs_select_owner"
  on public.consent_logs for select
  using (user_id = auth.uid());

create policy "consent_logs_insert_owner"
  on public.consent_logs for insert
  with check (user_id = auth.uid());

-- AUDIT_LOGS policies (org admins can view their org's trail; actors can insert own events)
create policy "audit_logs_select_org_admins"
  on public.audit_logs for select
  using (
    organisation_id is not null
    and public.is_org_role(organisation_id, array['owner', 'admin'])
  );

create policy "audit_logs_insert_actor"
  on public.audit_logs for insert
  with check (actor_user_id = auth.uid());
