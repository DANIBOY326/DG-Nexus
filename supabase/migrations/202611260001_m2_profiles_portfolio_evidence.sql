-- ============================================================================
-- DG NEXUS — Milestone M2: Proof-of-Work Profiles, Portfolio & Evidence Graph
-- Target Tag: v0.3.0-m2
-- Depends on:
--   - 202611240001_m0_foundation.sql
--   - 202611240002_m0_role_grants.sql
--   - 202611250001_m1_onboarding_skills_privacy.sql
--
-- Security & Privacy Guarantees:
--   - Default-deny RLS on every table with effective visibility cascade
--     (child records NEVER exceed parent profile or parent entity visibility)
--   - 'connections' visibility fails closed to owner-only until M5 Connections
--   - Anti-forgery DB triggers prevent users from self-promoting credential
--     verification or skill evidence levels beyond authorised boundaries
--   - Private Supabase Storage bucket (`portfolio-evidence`, public = false)
--     with zero permanent public URLs and RLS-governed signed URL access
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extend `public.profiles` for Structured Professional Profiles
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists current_focus text not null default '',
  add column if not exists work_arrangement text not null default 'flexible',
  add column if not exists achievements text[] not null default '{}',
  add column if not exists contact_links jsonb not null default '[]'::jsonb,
  add column if not exists allow_search_indexing boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_work_arrangement_check;
alter table public.profiles
  add constraint profiles_work_arrangement_check
  check (work_arrangement in ('onsite', 'hybrid', 'remote', 'flexible'));

alter table public.profiles
  drop constraint if exists profiles_contact_links_array_check;
alter table public.profiles
  add constraint profiles_contact_links_array_check
  check (jsonb_typeof(contact_links) = 'array');

alter table public.profiles
  drop constraint if exists profiles_handle_format_check;
alter table public.profiles
  add constraint profiles_handle_format_check
  check (handle is null or handle ~ '^[a-z0-9][a-z0-9-]{2,38}[a-z0-9]$');

create unique index if not exists idx_profiles_handle_lower
  on public.profiles (lower(handle))
  where handle is not null;

-- Helper used across child RLS policies to verify parent profile visibility
create or replace function public.is_profile_public(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = p_user_id
      and p.visibility_scope = 'public'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Align `public.profile_skills` to the 5-Tier Competency Evidence Model
--    1: self_reported | 2: portfolio_supported | 3: assessed
--    4: mentor_reviewed | 5: credential_verified
-- ----------------------------------------------------------------------------
alter table public.profile_skills
  drop constraint if exists profile_skills_evidence_status_check;

update public.profile_skills
set evidence_status = 'portfolio_supported'
where evidence_status = 'portfolio_backed';

update public.profile_skills
set evidence_status = 'credential_verified'
where evidence_status = 'verified';

alter table public.profile_skills
  add constraint profile_skills_evidence_status_check
  check (
    evidence_status in (
      'self_reported',
      'portfolio_supported',
      'assessed',
      'mentor_reviewed',
      'credential_verified'
    )
  );

-- Anti-forgery trigger: ordinary authenticated users cannot self-promote
-- evidence_status to portfolio_supported, assessed, mentor_reviewed or credential_verified.
-- Only trusted internal triggers (`app.internal_evidence_sync = 'on'`) or privileged roles may do so.
create or replace function public.guard_profile_skill_evidence_status()
returns trigger
language plpgsql
as $$
declare
  v_internal text := coalesce(current_setting('app.internal_evidence_sync', true), '');
begin
  if auth.role() = 'authenticated' and v_internal <> 'on' then
    if tg_op = 'INSERT' then
      if new.evidence_status <> 'self_reported' then
        raise exception 'Only authorised verification or linked portfolio evidence may assign evidence status "%"', new.evidence_status
          using errcode = '42501';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.evidence_status is distinct from old.evidence_status then
        raise exception 'Members cannot manually modify skill evidence_status'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_skill_evidence on public.profile_skills;
create trigger trg_guard_profile_skill_evidence
  before insert or update on public.profile_skills
  for each row execute function public.guard_profile_skill_evidence_status();

-- ----------------------------------------------------------------------------
-- 3. Extensible Portfolio Project Categories
-- ----------------------------------------------------------------------------
create table if not exists public.project_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text not null default '',
  sort_order smallint not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_project_categories_updated_at on public.project_categories;
create trigger trg_project_categories_updated_at
  before update on public.project_categories
  for each row execute function public.set_updated_at();

insert into public.project_categories (slug, name, description, sort_order) values
  ('software-development', 'Software Development', 'Web, mobile, backend, APIs, systems and developer tools.', 10),
  ('ui-ux-design', 'UI/UX Design', 'User interfaces, interaction flows, design systems and UX research.', 20),
  ('graphic-brand-design', 'Graphic and Brand Design', 'Visual identity, typography, art direction and brand collateral.', 30),
  ('data-analytics', 'Data and Analytics', 'BI dashboards, statistical modelling, data pipelines and visualisation.', 40),
  ('artificial-intelligence', 'Artificial Intelligence', 'Machine learning, LLM applications, computer vision and responsible AI.', 50),
  ('cybersecurity', 'Cybersecurity', 'Security audits, threat modelling, defensive engineering and compliance.', 60),
  ('research', 'Research', 'Academic studies, policy briefs, scientific publications and field work.', 70),
  ('business-entrepreneurship', 'Business and Entrepreneurship', 'Product strategy, venture building, operations and growth initiatives.', 80),
  ('education-training', 'Education and Training', 'Curriculum design, workshops, mentoring programmes and EdTech.', 90),
  ('engineering-technology', 'Engineering and Technology', 'Hardware, civil, electrical, renewable energy and applied engineering.', 100),
  ('media-communication', 'Media and Communication', 'Editorial strategy, digital storytelling, multimedia and public affairs.', 110),
  ('other', 'Other', 'Cross-disciplinary projects and initiatives outside listed categories.', 120)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 4. Professional Experience (`profile_experiences` + `experience_skills`)
-- ----------------------------------------------------------------------------
create table if not exists public.profile_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  organisation_name text not null,
  role_title text not null,
  employment_type text not null default 'full_time'
    check (employment_type in (
      'full_time', 'part_time', 'contract', 'freelance',
      'internship', 'volunteer', 'fellowship', 'apprenticeship', 'other'
    )),
  location text not null default '',
  work_arrangement text not null default 'hybrid'
    check (work_arrangement in ('onsite', 'hybrid', 'remote')),
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  description text not null default '',
  responsibilities text[] not null default '{}',
  achievements text[] not null default '{}',
  display_order smallint not null default 0,
  visibility_scope text not null default 'public'
    check (visibility_scope in ('public', 'connections', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_experiences_dates_check
    check (
      (is_current = true and end_date is null)
      or (is_current = false and (end_date is null or end_date >= start_date))
    )
);

create index if not exists idx_profile_experiences_user_order
  on public.profile_experiences (user_id, is_current desc, start_date desc);
create index if not exists idx_profile_experiences_visibility
  on public.profile_experiences (user_id, visibility_scope);

drop trigger if exists trg_profile_experiences_updated_at on public.profile_experiences;
create trigger trg_profile_experiences_updated_at
  before update on public.profile_experiences
  for each row execute function public.set_updated_at();

create table if not exists public.experience_skills (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.profile_experiences (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (experience_id, skill_id)
);

create index if not exists idx_experience_skills_experience on public.experience_skills (experience_id);
create index if not exists idx_experience_skills_skill on public.experience_skills (skill_id);

-- ----------------------------------------------------------------------------
-- 5. Education & Learning Pathways (`profile_educations`)
-- ----------------------------------------------------------------------------
create table if not exists public.profile_educations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  institution text not null,
  qualification text not null,
  pathway_type text not null default 'degree'
    check (pathway_type in (
      'degree', 'diploma', 'bootcamp', 'vocational',
      'professional_training', 'certification_programme', 'self_directed', 'other'
    )),
  field_of_study text not null default '',
  start_year smallint not null check (start_year between 1950 and 2100),
  end_year smallint check (end_year is null or end_year between 1950 and 2100),
  is_current boolean not null default false,
  description text not null default '',
  achievements text[] not null default '{}',
  display_order smallint not null default 0,
  visibility_scope text not null default 'public'
    check (visibility_scope in ('public', 'connections', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_educations_years_check
    check (end_year is null or end_year >= start_year)
);

create index if not exists idx_profile_educations_user_order
  on public.profile_educations (user_id, is_current desc, start_year desc);
create index if not exists idx_profile_educations_visibility
  on public.profile_educations (user_id, visibility_scope);

drop trigger if exists trg_profile_educations_updated_at on public.profile_educations;
create trigger trg_profile_educations_updated_at
  before update on public.profile_educations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Professional Certifications & Credentials (`profile_credentials` + `credential_skills`)
-- ----------------------------------------------------------------------------
create table if not exists public.profile_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null,
  issuing_organisation text not null,
  issue_date date,
  expiry_date date,
  credential_id_code text not null default '',
  verification_url text,
  verification_status text not null default 'self_reported'
    check (verification_status in (
      'self_reported', 'evidence_submitted', 'under_review',
      'verified', 'rejected', 'expired'
    )),
  visibility_scope text not null default 'public'
    check (visibility_scope in ('public', 'connections', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_credentials_dates_check
    check (expiry_date is null or issue_date is null or expiry_date >= issue_date)
);

create index if not exists idx_profile_credentials_user
  on public.profile_credentials (user_id, issue_date desc nulls last);
create index if not exists idx_profile_credentials_status
  on public.profile_credentials (verification_status);

drop trigger if exists trg_profile_credentials_updated_at on public.profile_credentials;
create trigger trg_profile_credentials_updated_at
  before update on public.profile_credentials
  for each row execute function public.set_updated_at();

-- Anti-forgery trigger: ordinary members cannot promote credentials to
-- under_review, verified, or rejected. Editing core fields on a verified
-- credential resets status back to evidence_submitted for re-verification.
create or replace function public.guard_credential_verification_status()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      if new.verification_status not in ('self_reported', 'evidence_submitted') then
        raise exception 'Members may only create credentials as self_reported or evidence_submitted'
          using errcode = '42501';
      end if;
    elsif tg_op = 'UPDATE' then
      if new.verification_status is distinct from old.verification_status then
        if new.verification_status in ('under_review', 'verified', 'rejected') then
          raise exception 'Only authorised verification workflows may assign credential status "%"', new.verification_status
            using errcode = '42501';
        end if;
      end if;

      if old.verification_status = 'verified' and (
        new.name is distinct from old.name
        or new.issuing_organisation is distinct from old.issuing_organisation
        or new.issue_date is distinct from old.issue_date
        or new.credential_id_code is distinct from old.credential_id_code
        or new.verification_url is distinct from old.verification_url
      ) then
        new.verification_status := 'evidence_submitted';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_credential_status on public.profile_credentials;
create trigger trg_guard_credential_status
  before insert or update on public.profile_credentials
  for each row execute function public.guard_credential_verification_status();

create table if not exists public.credential_skills (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references public.profile_credentials (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (credential_id, skill_id)
);

create index if not exists idx_credential_skills_credential on public.credential_skills (credential_id);
create index if not exists idx_credential_skills_skill on public.credential_skills (skill_id);

-- ----------------------------------------------------------------------------
-- 7. Portfolio Projects & Case Studies (`portfolio_projects` + `portfolio_project_skills`)
-- ----------------------------------------------------------------------------
create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'),
  title text not null,
  summary text not null,
  description text not null default '',
  category_slug text not null references public.project_categories (slug),
  project_type text not null default 'personal'
    check (project_type in (
      'personal', 'client_professional', 'academic',
      'open_source', 'collaborative', 'volunteer', 'research'
    )),
  project_status text not null default 'completed'
    check (project_status in ('in_progress', 'completed', 'ongoing', 'archived')),
  start_date date,
  completion_date date,
  associated_organisation text not null default '',
  is_collaborative boolean not null default false,
  member_role text not null default '',
  member_contribution text not null default '',
  team_members text[] not null default '{}',
  outcomes text[] not null default '{}',
  achievements text[] not null default '{}',
  tools_used text[] not null default '{}',
  project_url text,
  repository_url text,
  visibility_scope text not null default 'public'
    check (visibility_scope in ('public', 'connections', 'private')),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug),
  constraint portfolio_projects_dates_check
    check (completion_date is null or start_date is null or completion_date >= start_date)
);

create index if not exists idx_portfolio_projects_user
  on public.portfolio_projects (user_id, display_order asc, created_at desc);
create index if not exists idx_portfolio_projects_category
  on public.portfolio_projects (category_slug);
create index if not exists idx_portfolio_projects_visibility
  on public.portfolio_projects (user_id, visibility_scope);

drop trigger if exists trg_portfolio_projects_updated_at on public.portfolio_projects;
create trigger trg_portfolio_projects_updated_at
  before update on public.portfolio_projects
  for each row execute function public.set_updated_at();

create table if not exists public.portfolio_project_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.portfolio_projects (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, skill_id)
);

create index if not exists idx_project_skills_project on public.portfolio_project_skills (project_id);
create index if not exists idx_project_skills_skill on public.portfolio_project_skills (skill_id);

-- Automatically synchronise `profile_skills.evidence_status` between
-- `self_reported` and `portfolio_supported` whenever project-skill links change.
-- Never modifies `proficiency_level` and never downgrades higher verified tiers.
create or replace function public.sync_profile_skill_evidence_from_projects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_skill_id uuid;
  v_remaining integer;
begin
  perform set_config('app.internal_evidence_sync', 'on', true);

  if tg_op = 'INSERT' then
    select p.user_id into v_owner_id
    from public.portfolio_projects p
    where p.id = new.project_id;

    if v_owner_id is not null then
      insert into public.profile_skills (user_id, skill_id, proficiency_level, evidence_status)
      values (v_owner_id, new.skill_id, 'intermediate', 'portfolio_supported')
      on conflict (user_id, skill_id) do update
      set evidence_status = 'portfolio_supported',
          updated_at = now()
      where public.profile_skills.evidence_status = 'self_reported';
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    v_skill_id := old.skill_id;
    select p.user_id into v_owner_id
    from public.portfolio_projects p
    where p.id = old.project_id;

    if v_owner_id is not null then
      select count(*) into v_remaining
      from public.portfolio_project_skills pps
      join public.portfolio_projects pp on pp.id = pps.project_id
      where pp.user_id = v_owner_id
        and pps.skill_id = v_skill_id;

      if v_remaining = 0 then
        update public.profile_skills
        set evidence_status = 'self_reported',
            updated_at = now()
        where user_id = v_owner_id
          and skill_id = v_skill_id
          and evidence_status = 'portfolio_supported';
      end if;
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_profile_skill_evidence_ins on public.portfolio_project_skills;
create trigger trg_sync_profile_skill_evidence_ins
  after insert on public.portfolio_project_skills
  for each row execute function public.sync_profile_skill_evidence_from_projects();

drop trigger if exists trg_sync_profile_skill_evidence_del on public.portfolio_project_skills;
create trigger trg_sync_profile_skill_evidence_del
  after delete on public.portfolio_project_skills
  for each row execute function public.sync_profile_skill_evidence_from_projects();

-- When an entire portfolio project is deleted (cascading portfolio_project_skills),
-- recompute any skills whose last supporting project was removed.
create or replace function public.sync_profile_skills_after_project_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.internal_evidence_sync', 'on', true);

  update public.profile_skills ps
  set evidence_status = 'self_reported',
      updated_at = now()
  where ps.user_id = old.user_id
    and ps.evidence_status = 'portfolio_supported'
    and not exists (
      select 1
      from public.portfolio_project_skills pps
      join public.portfolio_projects pp on pp.id = pps.project_id
      where pp.user_id = old.user_id
        and pps.skill_id = ps.skill_id
    );

  return old;
end;
$$;

drop trigger if exists trg_sync_skills_after_project_delete on public.portfolio_projects;
create trigger trg_sync_skills_after_project_delete
  after delete on public.portfolio_projects
  for each row execute function public.sync_profile_skills_after_project_delete();

-- ----------------------------------------------------------------------------
-- 8. Evidence Files Metadata (`evidence_files`) — Strictly Private by Default
-- ----------------------------------------------------------------------------
create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  entity_type text not null
    check (entity_type in ('project', 'credential', 'education', 'avatar')),
  project_id uuid references public.portfolio_projects (id) on delete cascade,
  credential_id uuid references public.profile_credentials (id) on delete cascade,
  education_id uuid references public.profile_educations (id) on delete cascade,
  storage_bucket text not null default 'portfolio-evidence'
    check (storage_bucket = 'portfolio-evidence'),
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  file_size_bytes integer not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  caption text not null default '',
  visibility_scope text not null default 'private'
    check (visibility_scope in ('public', 'connections', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_files_parent_binding_check check (
    (entity_type = 'project' and project_id is not null and credential_id is null and education_id is null)
    or (entity_type = 'credential' and credential_id is not null and project_id is null and education_id is null)
    or (entity_type = 'education' and education_id is not null and project_id is null and credential_id is null)
    or (entity_type = 'avatar' and project_id is null and credential_id is null and education_id is null)
  )
);

create index if not exists idx_evidence_files_user on public.evidence_files (user_id);
create index if not exists idx_evidence_files_project on public.evidence_files (project_id) where project_id is not null;
create index if not exists idx_evidence_files_credential on public.evidence_files (credential_id) where credential_id is not null;
create index if not exists idx_evidence_files_education on public.evidence_files (education_id) where education_id is not null;

drop trigger if exists trg_evidence_files_updated_at on public.evidence_files;
create trigger trg_evidence_files_updated_at
  before update on public.evidence_files
  for each row execute function public.set_updated_at();

-- Prevent cross-user attachment: ensure referenced parent entity belongs to new.user_id
-- and storage_path starts with `{user_id}/`.
create or replace function public.guard_evidence_file_ownership()
returns trigger
language plpgsql
as $$
begin
  if position(new.user_id::text || '/' in new.storage_path) <> 1 then
    raise exception 'Invalid storage path prefix for evidence owner'
      using errcode = '42501';
  end if;

  if new.project_id is not null and not exists (
    select 1 from public.portfolio_projects pp
    where pp.id = new.project_id and pp.user_id = new.user_id
  ) then
    raise exception 'Evidence file cannot be attached to another member''s project'
      using errcode = '42501';
  end if;

  if new.credential_id is not null and not exists (
    select 1 from public.profile_credentials pc
    where pc.id = new.credential_id and pc.user_id = new.user_id
  ) then
    raise exception 'Evidence file cannot be attached to another member''s credential'
      using errcode = '42501';
  end if;

  if new.education_id is not null and not exists (
    select 1 from public.profile_educations pe
    where pe.id = new.education_id and pe.user_id = new.user_id
  ) then
    raise exception 'Evidence file cannot be attached to another member''s education record'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_evidence_file_ownership on public.evidence_files;
create trigger trg_guard_evidence_file_ownership
  before insert or update on public.evidence_files
  for each row execute function public.guard_evidence_file_ownership();

-- ----------------------------------------------------------------------------
-- 9. Verification Records Foundation (M3–M5 Assessments / Mentor / Authority)
-- ----------------------------------------------------------------------------
create table if not exists public.verification_records (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references public.profiles (user_id) on delete cascade,
  target_type text not null
    check (target_type in ('credential', 'profile_skill', 'project')),
  target_id uuid not null,
  verification_method text not null,
  resulting_status text not null,
  reviewer_user_id uuid references auth.users (id) on delete set null,
  notes text not null default '',
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_verification_records_subject
  on public.verification_records (subject_user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 10. Row-Level Security (Default-Deny + Effective Visibility Cascade)
-- ----------------------------------------------------------------------------
alter table public.project_categories enable row level security;
alter table public.profile_experiences enable row level security;
alter table public.experience_skills enable row level security;
alter table public.profile_educations enable row level security;
alter table public.profile_credentials enable row level security;
alter table public.credential_skills enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_project_skills enable row level security;
alter table public.evidence_files enable row level security;
alter table public.verification_records enable row level security;

-- PROJECT_CATEGORIES
drop policy if exists "project_categories_select_active" on public.project_categories;
create policy "project_categories_select_active"
  on public.project_categories for select
  using (is_active = true);

-- PROFILE_EXPERIENCES
drop policy if exists "experiences_select_visible_or_owner" on public.profile_experiences;
create policy "experiences_select_visible_or_owner"
  on public.profile_experiences for select
  using (
    user_id = auth.uid()
    or (visibility_scope = 'public' and public.is_profile_public(user_id))
  );

drop policy if exists "experiences_insert_owner" on public.profile_experiences;
create policy "experiences_insert_owner"
  on public.profile_experiences for insert
  with check (user_id = auth.uid());

drop policy if exists "experiences_update_owner" on public.profile_experiences;
create policy "experiences_update_owner"
  on public.profile_experiences for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "experiences_delete_owner" on public.profile_experiences;
create policy "experiences_delete_owner"
  on public.profile_experiences for delete
  using (user_id = auth.uid());

-- EXPERIENCE_SKILLS
drop policy if exists "experience_skills_select_visible_or_owner" on public.experience_skills;
create policy "experience_skills_select_visible_or_owner"
  on public.experience_skills for select
  using (
    exists (
      select 1 from public.profile_experiences pe
      where pe.id = experience_skills.experience_id
        and (
          pe.user_id = auth.uid()
          or (pe.visibility_scope = 'public' and public.is_profile_public(pe.user_id))
        )
    )
  );

drop policy if exists "experience_skills_insert_owner" on public.experience_skills;
create policy "experience_skills_insert_owner"
  on public.experience_skills for insert
  with check (
    exists (
      select 1 from public.profile_experiences pe
      where pe.id = experience_skills.experience_id and pe.user_id = auth.uid()
    )
  );

drop policy if exists "experience_skills_delete_owner" on public.experience_skills;
create policy "experience_skills_delete_owner"
  on public.experience_skills for delete
  using (
    exists (
      select 1 from public.profile_experiences pe
      where pe.id = experience_skills.experience_id and pe.user_id = auth.uid()
    )
  );

-- PROFILE_EDUCATIONS
drop policy if exists "educations_select_visible_or_owner" on public.profile_educations;
create policy "educations_select_visible_or_owner"
  on public.profile_educations for select
  using (
    user_id = auth.uid()
    or (visibility_scope = 'public' and public.is_profile_public(user_id))
  );

drop policy if exists "educations_insert_owner" on public.profile_educations;
create policy "educations_insert_owner"
  on public.profile_educations for insert
  with check (user_id = auth.uid());

drop policy if exists "educations_update_owner" on public.profile_educations;
create policy "educations_update_owner"
  on public.profile_educations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "educations_delete_owner" on public.profile_educations;
create policy "educations_delete_owner"
  on public.profile_educations for delete
  using (user_id = auth.uid());

-- PROFILE_CREDENTIALS
drop policy if exists "credentials_select_visible_or_owner" on public.profile_credentials;
create policy "credentials_select_visible_or_owner"
  on public.profile_credentials for select
  using (
    user_id = auth.uid()
    or (visibility_scope = 'public' and public.is_profile_public(user_id))
  );

drop policy if exists "credentials_insert_owner" on public.profile_credentials;
create policy "credentials_insert_owner"
  on public.profile_credentials for insert
  with check (user_id = auth.uid());

drop policy if exists "credentials_update_owner" on public.profile_credentials;
create policy "credentials_update_owner"
  on public.profile_credentials for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "credentials_delete_owner" on public.profile_credentials;
create policy "credentials_delete_owner"
  on public.profile_credentials for delete
  using (user_id = auth.uid());

-- CREDENTIAL_SKILLS
drop policy if exists "credential_skills_select_visible_or_owner" on public.credential_skills;
create policy "credential_skills_select_visible_or_owner"
  on public.credential_skills for select
  using (
    exists (
      select 1 from public.profile_credentials pc
      where pc.id = credential_skills.credential_id
        and (
          pc.user_id = auth.uid()
          or (pc.visibility_scope = 'public' and public.is_profile_public(pc.user_id))
        )
    )
  );

drop policy if exists "credential_skills_insert_owner" on public.credential_skills;
create policy "credential_skills_insert_owner"
  on public.credential_skills for insert
  with check (
    exists (
      select 1 from public.profile_credentials pc
      where pc.id = credential_skills.credential_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists "credential_skills_delete_owner" on public.credential_skills;
create policy "credential_skills_delete_owner"
  on public.credential_skills for delete
  using (
    exists (
      select 1 from public.profile_credentials pc
      where pc.id = credential_skills.credential_id and pc.user_id = auth.uid()
    )
  );

-- PORTFOLIO_PROJECTS
drop policy if exists "projects_select_visible_or_owner" on public.portfolio_projects;
create policy "projects_select_visible_or_owner"
  on public.portfolio_projects for select
  using (
    user_id = auth.uid()
    or (visibility_scope = 'public' and public.is_profile_public(user_id))
  );

drop policy if exists "projects_insert_owner" on public.portfolio_projects;
create policy "projects_insert_owner"
  on public.portfolio_projects for insert
  with check (user_id = auth.uid());

drop policy if exists "projects_update_owner" on public.portfolio_projects;
create policy "projects_update_owner"
  on public.portfolio_projects for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "projects_delete_owner" on public.portfolio_projects;
create policy "projects_delete_owner"
  on public.portfolio_projects for delete
  using (user_id = auth.uid());

-- PORTFOLIO_PROJECT_SKILLS
drop policy if exists "project_skills_select_visible_or_owner" on public.portfolio_project_skills;
create policy "project_skills_select_visible_or_owner"
  on public.portfolio_project_skills for select
  using (
    exists (
      select 1 from public.portfolio_projects pp
      where pp.id = portfolio_project_skills.project_id
        and (
          pp.user_id = auth.uid()
          or (pp.visibility_scope = 'public' and public.is_profile_public(pp.user_id))
        )
    )
  );

drop policy if exists "project_skills_insert_owner" on public.portfolio_project_skills;
create policy "project_skills_insert_owner"
  on public.portfolio_project_skills for insert
  with check (
    exists (
      select 1 from public.portfolio_projects pp
      where pp.id = portfolio_project_skills.project_id and pp.user_id = auth.uid()
    )
  );

drop policy if exists "project_skills_delete_owner" on public.portfolio_project_skills;
create policy "project_skills_delete_owner"
  on public.portfolio_project_skills for delete
  using (
    exists (
      select 1 from public.portfolio_projects pp
      where pp.id = portfolio_project_skills.project_id and pp.user_id = auth.uid()
    )
  );

-- EVIDENCE_FILES (Effective visibility never exceeds parent profile or parent entity)
drop policy if exists "evidence_files_select_visible_or_owner" on public.evidence_files;
create policy "evidence_files_select_visible_or_owner"
  on public.evidence_files for select
  using (
    user_id = auth.uid()
    or (
      visibility_scope = 'public'
      and public.is_profile_public(user_id)
      and (
        project_id is null
        or exists (
          select 1 from public.portfolio_projects pp
          where pp.id = evidence_files.project_id and pp.visibility_scope = 'public'
        )
      )
      and (
        credential_id is null
        or exists (
          select 1 from public.profile_credentials pc
          where pc.id = evidence_files.credential_id and pc.visibility_scope = 'public'
        )
      )
      and (
        education_id is null
        or exists (
          select 1 from public.profile_educations pe
          where pe.id = evidence_files.education_id and pe.visibility_scope = 'public'
        )
      )
    )
  );

drop policy if exists "evidence_files_insert_owner" on public.evidence_files;
create policy "evidence_files_insert_owner"
  on public.evidence_files for insert
  with check (user_id = auth.uid());

drop policy if exists "evidence_files_update_owner" on public.evidence_files;
create policy "evidence_files_update_owner"
  on public.evidence_files for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "evidence_files_delete_owner" on public.evidence_files;
create policy "evidence_files_delete_owner"
  on public.evidence_files for delete
  using (user_id = auth.uid());

-- VERIFICATION_RECORDS (Owner read-only; no client insert/update/delete)
drop policy if exists "verification_records_select_subject" on public.verification_records;
create policy "verification_records_select_subject"
  on public.verification_records for select
  using (subject_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 11. Explicit PG17 Least-Privilege Grants
-- ----------------------------------------------------------------------------
grant select on public.project_categories to anon, authenticated;

grant select on public.profile_experiences to anon;
grant select, insert, update, delete on public.profile_experiences to authenticated;

grant select on public.experience_skills to anon;
grant select, insert, delete on public.experience_skills to authenticated;

grant select on public.profile_educations to anon;
grant select, insert, update, delete on public.profile_educations to authenticated;

grant select on public.profile_credentials to anon;
grant select, insert, update, delete on public.profile_credentials to authenticated;

grant select on public.credential_skills to anon;
grant select, insert, delete on public.credential_skills to authenticated;

grant select on public.portfolio_projects to anon;
grant select, insert, update, delete on public.portfolio_projects to authenticated;

grant select on public.portfolio_project_skills to anon;
grant select, insert, delete on public.portfolio_project_skills to authenticated;

grant select on public.evidence_files to anon;
grant select, insert, update, delete on public.evidence_files to authenticated;

revoke insert, update, delete on public.verification_records from anon, authenticated;
grant select on public.verification_records to authenticated;

-- ----------------------------------------------------------------------------
-- 12. Strictly Private Supabase Storage Bucket (`portfolio-evidence`) & RLS
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-evidence',
  'portfolio-evidence',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

drop policy if exists "portfolio_evidence_select_owner_or_public" on storage.objects;
create policy "portfolio_evidence_select_owner_or_public"
  on storage.objects for select
  using (
    bucket_id = 'portfolio-evidence'
    and (
      (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
      or exists (
        select 1
        from public.evidence_files ef
        where ef.storage_bucket = 'portfolio-evidence'
          and ef.storage_path = name
          and ef.visibility_scope = 'public'
          and public.is_profile_public(ef.user_id)
          and (
            ef.project_id is null
            or exists (
              select 1 from public.portfolio_projects pp
              where pp.id = ef.project_id and pp.visibility_scope = 'public'
            )
          )
          and (
            ef.credential_id is null
            or exists (
              select 1 from public.profile_credentials pc
              where pc.id = ef.credential_id and pc.visibility_scope = 'public'
            )
          )
          and (
            ef.education_id is null
            or exists (
              select 1 from public.profile_educations pe
              where pe.id = ef.education_id and pe.visibility_scope = 'public'
            )
          )
      )
    )
  );

drop policy if exists "portfolio_evidence_insert_owner" on storage.objects;
create policy "portfolio_evidence_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio-evidence'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "portfolio_evidence_update_owner" on storage.objects;
create policy "portfolio_evidence_update_owner"
  on storage.objects for update
  using (
    bucket_id = 'portfolio-evidence'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'portfolio-evidence'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "portfolio_evidence_delete_owner" on storage.objects;
create policy "portfolio_evidence_delete_owner"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio-evidence'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
