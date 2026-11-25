-- ============================================================================
-- DG NEXUS — Milestone M1: Onboarding, Canonical Skills & Privacy Hardening
-- Depends on: 202611240001_m0_foundation.sql, 202611240002_m0_role_grants.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extend Profiles for 4-Step Structured Onboarding & Session Resumption
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists interests text[] not null default '{}',
  add column if not exists career_goals text[] not null default '{}',
  add column if not exists onboarding_step smallint not null default 1;

alter table public.profiles
  drop constraint if exists profiles_onboarding_step_check;

alter table public.profiles
  add constraint profiles_onboarding_step_check
  check (onboarding_step between 1 and 4);

-- Ensure Google OAuth and email sign-ups populate full_name and avatar_url cleanly
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      ''
    ),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Canonical Skills Catalogue (Normalised Duplicate Prevention)
-- ----------------------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  normalised_name text generated always as (lower(trim(name))) stored unique,
  category text not null,
  is_verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_skills_category on public.skills (category);
create index if not exists idx_skills_normalised_name on public.skills (normalised_name);

drop trigger if exists trg_skills_updated_at on public.skills;
create trigger trg_skills_updated_at
  before update on public.skills
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Profile-Skills Junction Table (Competency Graph Edges)
-- ----------------------------------------------------------------------------
create table if not exists public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  proficiency_level text not null default 'intermediate'
    check (proficiency_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  evidence_status text not null default 'self_reported'
    check (evidence_status in ('self_reported', 'portfolio_backed', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create index if not exists idx_profile_skills_user on public.profile_skills (user_id);
create index if not exists idx_profile_skills_skill on public.profile_skills (skill_id);

drop trigger if exists trg_profile_skills_updated_at on public.profile_skills;
create trigger trg_profile_skills_updated_at
  before update on public.profile_skills
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Append-Only Immutability Enforcement on Consent Logs (GDPR / NDPA)
-- ----------------------------------------------------------------------------
revoke update, delete on public.consent_logs from anon, authenticated;

create or replace function public.prevent_consent_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'consent_logs records are append-only and cannot be modified or deleted'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_consent_logs_immutable on public.consent_logs;
create trigger trg_consent_logs_immutable
  before update or delete on public.consent_logs
  for each row execute function public.prevent_consent_log_mutation();

-- ----------------------------------------------------------------------------
-- 5. Row-Level Security Policies for Skills & Profile Skills
-- Note on profiles.visibility_scope in M1:
--   - 'public': readable by anonymous & authenticated readers
--   - 'connections': restricted to owner in M1 (expands to accepted peers when
--                    the connections table is introduced in M5)
--   - 'private': strictly owner-only
-- ----------------------------------------------------------------------------
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;

drop policy if exists "skills_select_verified" on public.skills;
create policy "skills_select_verified"
  on public.skills for select
  using (is_verified = true);

drop policy if exists "profile_skills_select_visible_or_owner" on public.profile_skills;
create policy "profile_skills_select_visible_or_owner"
  on public.profile_skills for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = profile_skills.user_id
        and p.visibility_scope = 'public'
    )
  );

drop policy if exists "profile_skills_insert_owner_only" on public.profile_skills;
create policy "profile_skills_insert_owner_only"
  on public.profile_skills for insert
  with check (user_id = auth.uid());

drop policy if exists "profile_skills_update_owner_only" on public.profile_skills;
create policy "profile_skills_update_owner_only"
  on public.profile_skills for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "profile_skills_delete_owner_only" on public.profile_skills;
create policy "profile_skills_delete_owner_only"
  on public.profile_skills for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 6. Explicit PG17 Least-Privilege Grants
-- ----------------------------------------------------------------------------
grant select on public.skills to anon, authenticated;
grant select on public.profile_skills to anon;
grant select, insert, update, delete on public.profile_skills to authenticated;

-- ----------------------------------------------------------------------------
-- 7. Curated Seed Catalogue of Canonical Cross-Domain Skills (Idempotent)
-- ----------------------------------------------------------------------------
insert into public.skills (slug, name, category) values
  -- Technology
  ('typescript', 'TypeScript', 'Technology'),
  ('javascript', 'JavaScript', 'Technology'),
  ('python', 'Python', 'Technology'),
  ('react', 'React', 'Technology'),
  ('nextjs', 'Next.js', 'Technology'),
  ('nodejs', 'Node.js', 'Technology'),
  ('postgresql', 'PostgreSQL', 'Technology'),
  ('sql', 'SQL', 'Technology'),
  ('cloud-architecture', 'Cloud Architecture', 'Technology'),
  ('cybersecurity', 'Cybersecurity', 'Technology'),
  ('devops', 'DevOps & CI/CD', 'Technology'),
  ('mobile-development', 'Mobile Development', 'Technology'),
  ('api-design', 'API Design', 'Technology'),
  ('system-design', 'System Design', 'Technology'),
  -- Artificial Intelligence
  ('machine-learning', 'Machine Learning', 'Artificial Intelligence'),
  ('llm-engineering', 'LLM Engineering', 'Artificial Intelligence'),
  ('data-science', 'Data Science', 'Artificial Intelligence'),
  ('data-analytics', 'Data Analytics', 'Artificial Intelligence'),
  ('natural-language-processing', 'Natural Language Processing', 'Artificial Intelligence'),
  ('computer-vision', 'Computer Vision', 'Artificial Intelligence'),
  ('ai-ethics-governance', 'AI Ethics & Governance', 'Artificial Intelligence'),
  ('prompt-engineering', 'Prompt Engineering', 'Artificial Intelligence'),
  -- Design
  ('ui-ux-design', 'UI/UX Design', 'Design'),
  ('product-design', 'Product Design', 'Design'),
  ('design-systems', 'Design Systems', 'Design'),
  ('figma', 'Figma', 'Design'),
  ('user-research', 'User Research', 'Design'),
  ('prototyping', 'Interactive Prototyping', 'Design'),
  ('accessibility-wcag', 'Accessibility (WCAG)', 'Design'),
  ('brand-identity', 'Brand Identity', 'Design'),
  -- Business
  ('product-management', 'Product Management', 'Business'),
  ('business-strategy', 'Business Strategy', 'Business'),
  ('financial-modelling', 'Financial Modelling', 'Business'),
  ('operations-management', 'Operations Management', 'Business'),
  ('growth-marketing', 'Growth Marketing', 'Business'),
  ('project-management', 'Project Management', 'Business'),
  ('venture-fundraising', 'Venture Fundraising', 'Business'),
  ('stakeholder-management', 'Stakeholder Management', 'Business'),
  ('data-storytelling', 'Data Storytelling', 'Business'),
  -- Research
  ('academic-research', 'Academic Research', 'Research'),
  ('quantitative-methods', 'Quantitative Methods', 'Research'),
  ('qualitative-research', 'Qualitative Research', 'Research'),
  ('grant-writing', 'Grant Writing', 'Research'),
  ('technical-writing', 'Technical Writing', 'Research'),
  ('policy-analysis', 'Policy Analysis', 'Research'),
  ('literature-review', 'Systematic Literature Review', 'Research'),
  ('statistical-modelling', 'Statistical Modelling', 'Research'),
  -- Climate
  ('climate-tech', 'Climate Tech', 'Climate'),
  ('renewable-energy', 'Renewable Energy Systems', 'Climate'),
  ('esg-reporting', 'ESG & Sustainability Reporting', 'Climate'),
  ('carbon-accounting', 'Carbon Accounting', 'Climate'),
  ('environmental-data-gis', 'Environmental Data & GIS', 'Climate'),
  ('sustainable-agriculture', 'Sustainable Agriculture', 'Climate'),
  ('circular-economy', 'Circular Economy', 'Climate'),
  ('climate-policy', 'Climate Policy & Finance', 'Climate')
on conflict (slug) do nothing;
