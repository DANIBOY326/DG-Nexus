-- ============================================================================
-- DG NEXUS — Milestone M3: Verified Global Opportunity Engine & Application Tracking
-- Target Tag: v0.4.0-m3
-- Depends on:
--   - 202611240001_m0_foundation.sql
--   - 202611240002_m0_role_grants.sql
--   - 202611250001_m1_onboarding_skills_privacy.sql
--   - 202611260001_m2_profiles_portfolio_evidence.sql
--
-- Global-First & Security Guarantees:
--   - ISO-3166 alpha-2 country eligibility arrays (empty = Open Globally)
--   - ISO-4217 currency codes & UTC timestamps (formatted into user IANA TZ)
--   - Canonical `skills` graph linking (`opportunity_skills`)
--   - Strict owner-only RLS on `opportunity_bookmarks` & `opportunity_applications`
--   - Explicit `verification_status` ('unverified', 'curated', 'partner_verified')
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Opportunities Catalogue (`public.opportunities`)
-- ----------------------------------------------------------------------------
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,98}[a-z0-9]$'),
  organisation_id uuid references public.organisations (id) on delete set null,
  organisation_name text not null,
  opportunity_type text not null
    check (opportunity_type in (
      'job', 'internship', 'scholarship', 'fellowship',
      'grant', 'hackathon', 'accelerator', 'competition', 'volunteer'
    )),
  title text not null,
  summary text not null,
  description text not null default '',
  domain_tags text[] not null default '{}',
  work_arrangement text not null default 'remote'
    check (work_arrangement in ('remote', 'hybrid', 'onsite', 'global_online')),
  location_label text not null default 'Global',
  eligible_countries text[] not null default '{}',
  compensation_type text not null default 'unspecified'
    check (compensation_type in (
      'salary', 'stipend', 'grant_award', 'tuition_funding',
      'equity', 'unpaid', 'unspecified'
    )),
  compensation_min numeric(12, 2),
  compensation_max numeric(12, 2),
  currency_code char(3),
  experience_level text not null default 'any'
    check (experience_level in ('entry', 'early_career', 'mid_level', 'senior', 'any')),
  eligibility_criteria text[] not null default '{}',
  application_url text,
  application_method text not null default 'external_link'
    check (application_method in ('external_link', 'dg_nexus_apply')),
  deadline_at timestamptz,
  is_rolling boolean not null default false,
  verification_status text not null default 'curated'
    check (verification_status in ('unverified', 'curated', 'partner_verified')),
  publication_status text not null default 'published'
    check (publication_status in ('draft', 'published', 'closed', 'archived')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_comp_range_check
    check (compensation_max is null or compensation_min is null or compensation_max >= compensation_min),
  constraint opportunities_currency_check
    check (currency_code is null or currency_code ~ '^[A-Z]{3}$')
);

create index if not exists idx_opportunities_pub_deadline
  on public.opportunities (publication_status, deadline_at asc nulls last);
create index if not exists idx_opportunities_type
  on public.opportunities (opportunity_type);
create index if not exists idx_opportunities_domains
  on public.opportunities using gin (domain_tags);
create index if not exists idx_opportunities_countries
  on public.opportunities using gin (eligible_countries);

drop trigger if exists trg_opportunities_updated_at on public.opportunities;
create trigger trg_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Opportunity Canonical Skill Requirements (`public.opportunity_skills`)
-- ----------------------------------------------------------------------------
create table if not exists public.opportunity_skills (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  requirement_level text not null default 'required'
    check (requirement_level in ('required', 'preferred')),
  created_at timestamptz not null default now(),
  unique (opportunity_id, skill_id)
);

create index if not exists idx_opportunity_skills_opp on public.opportunity_skills (opportunity_id);
create index if not exists idx_opportunity_skills_skill on public.opportunity_skills (skill_id);

-- ----------------------------------------------------------------------------
-- 3. Saved Opportunity Bookmarks (`public.opportunity_bookmarks`)
-- ----------------------------------------------------------------------------
create table if not exists public.opportunity_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create index if not exists idx_opportunity_bookmarks_user
  on public.opportunity_bookmarks (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 4. Application & Deadline Tracker (`public.opportunity_applications`)
-- ----------------------------------------------------------------------------
create table if not exists public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  status text not null default 'preparing'
    check (status in (
      'saved', 'preparing', 'submitted', 'interviewing',
      'offer', 'accepted', 'rejected', 'withdrawn'
    )),
  personal_notes text not null default '',
  external_reference text not null default '',
  submitted_at timestamptz,
  next_reminder_at timestamptz,
  fit_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create index if not exists idx_opportunity_applications_user
  on public.opportunity_applications (user_id, updated_at desc);
create index if not exists idx_opportunity_applications_reminder
  on public.opportunity_applications (user_id, next_reminder_at asc nulls last);

drop trigger if exists trg_opportunity_applications_updated_at on public.opportunity_applications;
create trigger trg_opportunity_applications_updated_at
  before update on public.opportunity_applications
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Row-Level Security (Default-Deny)
-- ----------------------------------------------------------------------------
alter table public.opportunities enable row level security;
alter table public.opportunity_skills enable row level security;
alter table public.opportunity_bookmarks enable row level security;
alter table public.opportunity_applications enable row level security;

-- OPPORTUNITIES: Published items readable by authenticated/anon; org admins can manage their org's postings
drop policy if exists "opportunities_select_published_or_org_admin" on public.opportunities;
create policy "opportunities_select_published_or_org_admin"
  on public.opportunities for select
  using (
    publication_status = 'published'
    or (organisation_id is not null and public.is_org_role(organisation_id, array['owner', 'admin', 'recruiter']))
    or created_by = auth.uid()
  );

drop policy if exists "opportunities_insert_org_admins" on public.opportunities;
create policy "opportunities_insert_org_admins"
  on public.opportunities for insert
  with check (
    organisation_id is not null
    and public.is_org_role(organisation_id, array['owner', 'admin', 'recruiter'])
    and verification_status <> 'partner_verified'
  );

drop policy if exists "opportunities_update_org_admins" on public.opportunities;
create policy "opportunities_update_org_admins"
  on public.opportunities for update
  using (
    organisation_id is not null
    and public.is_org_role(organisation_id, array['owner', 'admin', 'recruiter'])
  )
  with check (
    organisation_id is not null
    and public.is_org_role(organisation_id, array['owner', 'admin', 'recruiter'])
    and verification_status <> 'partner_verified'
  );

-- OPPORTUNITY_SKILLS: Mirrors parent opportunity visibility
drop policy if exists "opportunity_skills_select_visible" on public.opportunity_skills;
create policy "opportunity_skills_select_visible"
  on public.opportunity_skills for select
  using (
    exists (
      select 1 from public.opportunities o
      where o.id = opportunity_skills.opportunity_id
        and (
          o.publication_status = 'published'
          or (o.organisation_id is not null and public.is_org_role(o.organisation_id, array['owner', 'admin', 'recruiter']))
          or o.created_by = auth.uid()
        )
    )
  );

-- BOOKMARKS: Strictly owner-only
drop policy if exists "bookmarks_select_owner" on public.opportunity_bookmarks;
create policy "bookmarks_select_owner"
  on public.opportunity_bookmarks for select
  using (user_id = auth.uid());

drop policy if exists "bookmarks_insert_owner" on public.opportunity_bookmarks;
create policy "bookmarks_insert_owner"
  on public.opportunity_bookmarks for insert
  with check (user_id = auth.uid());

drop policy if exists "bookmarks_update_owner" on public.opportunity_bookmarks;
create policy "bookmarks_update_owner"
  on public.opportunity_bookmarks for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "bookmarks_delete_owner" on public.opportunity_bookmarks;
create policy "bookmarks_delete_owner"
  on public.opportunity_bookmarks for delete
  using (user_id = auth.uid());

-- APPLICATIONS: Strictly owner-only in M3
drop policy if exists "applications_select_owner" on public.opportunity_applications;
create policy "applications_select_owner"
  on public.opportunity_applications for select
  using (user_id = auth.uid());

drop policy if exists "applications_insert_owner" on public.opportunity_applications;
create policy "applications_insert_owner"
  on public.opportunity_applications for insert
  with check (user_id = auth.uid());

drop policy if exists "applications_update_owner" on public.opportunity_applications;
create policy "applications_update_owner"
  on public.opportunity_applications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "applications_delete_owner" on public.opportunity_applications;
create policy "applications_delete_owner"
  on public.opportunity_applications for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 6. Explicit PG17 Least-Privilege Grants
-- ----------------------------------------------------------------------------
grant select on public.opportunities to anon;
grant select, insert, update on public.opportunities to authenticated;

grant select on public.opportunity_skills to anon, authenticated;

revoke all on public.opportunity_bookmarks from anon;
grant select, insert, update, delete on public.opportunity_bookmarks to authenticated;

revoke all on public.opportunity_applications from anon;
grant select, insert, update, delete on public.opportunity_applications to authenticated;

-- ----------------------------------------------------------------------------
-- 7. Curated Launch Catalogue (12 Global & Africa-Accessible Opportunities)
--    Explicitly tagged `verification_status = 'curated'` (never falsely 'partner_verified')
-- ----------------------------------------------------------------------------
insert into public.opportunities (
  slug, organisation_name, opportunity_type, title, summary, description,
  domain_tags, work_arrangement, location_label, eligible_countries,
  compensation_type, compensation_min, compensation_max, currency_code,
  experience_level, eligibility_criteria, application_url, deadline_at,
  is_rolling, verification_status, publication_status
) values
  (
    'civic-climate-ux-systems-fellowship-2027',
    'African Civic Tech & Resilience Network',
    'fellowship',
    'Civic Tech & Climate UI/UX Systems Fellowship (2027 Cohort)',
    'Six-month remote fellowship for designers and frontend builders creating accessible climate resilience and flood-response tools across West and East Africa.',
    'Fellows collaborate with municipal agencies and open-data researchers to design mobile-first early warning systems, modular design systems, and WCAG AA civic dashboards. Includes monthly stipend, mentorship from principal product designers, and published open-source case study support.',
    array['design', 'technology', 'climate'],
    'remote',
    'Remote · Africa & Global',
    array['NG', 'GH', 'KE', 'RW', 'ZA', 'UG', 'TZ', 'SN'],
    'stipend', 1800, 2400, 'USD',
    'early_career',
    array[
      'Demonstrated portfolio work in UI/UX Design, Design Systems, or Frontend Engineering',
      'Resident or citizen of an eligible African launch country',
      'Available 20–25 hours per week across Africa/Lagos or adjacent time zones'
    ],
    'https://dg-nexus.vercel.app/opportunities/civic-climate-ux-systems-fellowship-2027',
    now() + interval '18 days',
    false, 'curated', 'published'
  ),
  (
    'global-product-designer-design-systems-remote',
    'Horizon Cloud Labs',
    'job',
    'Product Designer — Design Systems & Accessibility (Remote)',
    'Own cross-platform component tokens, Figma libraries, and interactive prototypes for a global B2B developer platform.',
    'You will partner with TypeScript and Next.js engineers to evolve a multi-brand design system, run usability research with international users, and uphold WCAG 2.2 AA standards across web and mobile web experiences.',
    array['design', 'technology'],
    'remote',
    'Global Remote (UTC-1 to UTC+4 preferred)',
    array[]::text[],
    'salary', 55000, 75000, 'USD',
    'mid_level',
    array[
      '2+ years shipping production design systems in Figma',
      'Working knowledge of React/Next.js component handoff and accessibility tokens',
      'Portfolio featuring at least one end-to-end product or design system case study'
    ],
    'https://dg-nexus.vercel.app/opportunities/global-product-designer-design-systems-remote',
    now() + interval '12 days',
    false, 'curated', 'published'
  ),
  (
    'commonwealth-shared-masters-scholarship-2027',
    'Global Higher Education & Innovation Fund',
    'scholarship',
    'Global Digital Innovation & Applied AI Master''s Scholarship',
    'Full tuition, living stipend, and airfare scholarship for high-potential graduates pursuing Master''s degrees in AI, Data Science, or Human-Computer Interaction.',
    'Designed to support emerging technical leaders from Commonwealth and developing economies to complete a 12-month postgraduate programme with applied research focused on healthcare, climate, or civic infrastructure.',
    array['artificial-intelligence', 'research', 'education-edtech', 'technology'],
    'onsite',
    'United Kingdom / Europe (On-Campus)',
    array['NG', 'GH', 'KE', 'IN', 'PK', 'ZA', 'RW', 'JM', 'UG'],
    'tuition_funding', 32000, 38000, 'GBP',
    'early_career',
    array[
      'Undergraduate degree (or equivalent honours qualification) in a STEM, Design, or analytical discipline',
      'Evidence of applied research, technical projects, or community leadership',
      'Commitment to measurable social or economic impact post-graduation'
    ],
    'https://dg-nexus.vercel.app/opportunities/commonwealth-shared-masters-scholarship-2027',
    now() + interval '35 days',
    false, 'curated', 'published'
  ),
  (
    'fullstack-nextjs-typescript-engineer-remote',
    'Meridian FinTech Infrastructure',
    'job',
    'Full-Stack Engineer (Next.js, TypeScript & PostgreSQL)',
    'Build high-integrity cross-border settlement APIs, responsive dashboards, and PostgreSQL RLS architectures for emerging-market businesses.',
    'Join a lean distributed engineering team shipping reliable financial tooling. You will own vertical slices end-to-end — from SQL migrations and Row-Level Security policies to accessible React 19 interfaces.',
    array['technology', 'finance-fintech'],
    'remote',
    'Remote · EMEA & Africa',
    array[]::text[],
    'salary', 60000, 82000, 'USD',
    'mid_level',
    array[
      'Strong production fluency in TypeScript, React/Next.js, and PostgreSQL',
      'Demonstrated understanding of web application security and API design',
      'Open-source or documented portfolio projects showing end-to-end delivery'
    ],
    'https://dg-nexus.vercel.app/opportunities/fullstack-nextjs-typescript-engineer-remote',
    now() + interval '21 days',
    false, 'curated', 'published'
  ),
  (
    'responsible-ai-governance-microgrant-2026',
    'Open Civic AI Alliance',
    'grant',
    'Responsible AI & Public-Interest Research Micro-Grant',
    'Equity-free micro-grants supporting open datasets, AI ethics evaluations, and local-language NLP or computer vision prototypes.',
    'Independent researchers, university teams, and solo builders can apply for 6-month funding to publish open benchmarks, fairness audits, or public-interest prototypes addressing environmental monitoring, health, or education.',
    array['artificial-intelligence', 'research', 'policy-governance'],
    'global_online',
    'Global (Online / Independent)',
    array[]::text[],
    'grant_award', 5000, 15000, 'USD',
    'any',
    array[
      'Open-source or public-interest research methodology',
      'Clear ethical risk mitigation and data privacy plan',
      'Deliverable prototype, benchmark dataset, or peer-reviewable paper within 6 months'
    ],
    'https://dg-nexus.vercel.app/opportunities/responsible-ai-governance-microgrant-2026',
    now() + interval '9 days',
    false, 'curated', 'published'
  ),
  (
    'west-africa-climate-flood-hackathon-2026',
    'GeoResilience & Climate Data Initiative',
    'hackathon',
    'West Africa Flood & Climate Resilience Global Hackathon',
    '72-hour virtual buildathon challenging interdisciplinary teams to build flood forecasting, GIS visualisation, and mobile citizen-alert apps.',
    'Open to developers, UI/UX designers, data scientists, and environmental researchers worldwide. Teams receive real satellite telemetry datasets, cloud sandbox credits, and mentorship from climate-tech founders.',
    array['climate', 'technology', 'design', 'artificial-intelligence'],
    'global_online',
    'Global Online (WAT / UTC+1 Live Sessions)',
    array[]::text[],
    'grant_award', 2500, 10000, 'USD',
    'any',
    array[
      'Solo builders or teams of up to 4 participants',
      'Working web/mobile prototype or data visualisation submitted before deadline',
      'Clear attribution of each team member''s contribution'
    ],
    'https://dg-nexus.vercel.app/opportunities/west-africa-climate-flood-hackathon-2026',
    now() + interval '6 days',
    false, 'curated', 'published'
  ),
  (
    'product-management-early-career-internship',
    'NovaHealth Digital Systems',
    'internship',
    'Product Management & UX Research Intern (Remote)',
    'Paid 16-week remote internship working alongside product managers and clinicians to improve rural telemedicine workflows.',
    'Gain hands-on experience running structured user interviews, writing clear product specs, analysing funnel metrics, and prioritising roadmap features for mobile-first healthcare apps.',
    array['business', 'design', 'healthcare-biotech'],
    'remote',
    'Remote · Africa & Europe',
    array['NG', 'GH', 'KE', 'ZA', 'GB', 'DE', 'NL', 'RW'],
    'stipend', 1200, 1600, 'USD',
    'entry',
    array[
      'Final-year student, recent graduate, or career switcher with documented product/UX case study',
      'Strong written communication and analytical synthesis skills',
      'Interest in digital health and low-bandwidth mobile UX'
    ],
    'https://dg-nexus.vercel.app/opportunities/product-management-early-career-internship',
    now() + interval '15 days',
    false, 'curated', 'published'
  ),
  (
    'cybersecurity-analyst-apprenticeship-hybrid',
    'Aegis Cloud Security Africa',
    'internship',
    'Junior Cybersecurity & Cloud Defence Analyst',
    'Structured 6-month apprenticeship with pathway to full-time security engineering role covering threat modelling, IAM, and web app hardening.',
    'Work with senior security engineers conducting OWASP assessments, reviewing cloud IAM configurations, and automating CI/CD vulnerability scanning.',
    array['technology'],
    'hybrid',
    'Lagos, Nigeria (Hybrid)',
    array['NG'],
    'salary', 4800000, 7200000, 'NGN',
    'entry',
    array[
      'Foundational knowledge of networking, Linux, and web application security (OWASP Top 10)',
      'Based in or able to commute to Lagos 2 days per week',
      'Relevant home-lab write-ups, CTF results, or security project documentation'
    ],
    'https://dg-nexus.vercel.app/opportunities/cybersecurity-analyst-apprenticeship-hybrid',
    now() + interval '24 days',
    false, 'curated', 'published'
  ),
  (
    'brand-visual-systems-designer-contract',
    'Kora Creative Collective',
    'job',
    'Brand Identity & Visual Systems Designer (6-Month Contract)',
    'Craft cohesive brand guidelines, editorial templates, and digital product visuals for climate and EdTech startups across EMEA.',
    'You will translate founder vision into clean, scalable brand architecture, icon sets, presentation decks, and web landing assets.',
    array['design', 'business', 'education-edtech'],
    'remote',
    'Remote · Global',
    array[]::text[],
    'salary', 28000, 38000, 'USD',
    'early_career',
    array[
      'Strong portfolio demonstrating brand identity systems, typography, and digital UI cohesion',
      'Proficiency in Figma and modern collaborative design handoff workflows'
    ],
    'https://dg-nexus.vercel.app/opportunities/brand-visual-systems-designer-contract',
    now() + interval '28 days',
    false, 'curated', 'published'
  ),
  (
    'sustainable-agriculture-data-fellowship',
    'Sahel AgriData Institute',
    'fellowship',
    'AgriTech Data Analytics & GIS Research Fellow',
    'Apply satellite GIS, statistical modelling, and field survey data to strengthen smallholder crop resilience across West Africa.',
    'Fellows partner with agronomists and local cooperatives to build open yield-forecasting models and accessible visual briefs for policymakers.',
    array['climate', 'research', 'artificial-intelligence'],
    'hybrid',
    'Abuja / Remote Flexible',
    array['NG', 'GH', 'SN', 'CM', 'KE'],
    'stipend', 1500, 2100, 'USD',
    'early_career',
    array[
      'Experience with Python, Data Analytics, Statistical Modelling, or Environmental GIS',
      'Track record of clear technical writing or applied research projects'
    ],
    'https://dg-nexus.vercel.app/opportunities/sustainable-agriculture-data-fellowship',
    now() + interval '40 days',
    false, 'curated', 'published'
  ),
  (
    'global-venture-studio-accelerator-2027',
    'Catalyst Global Founders Studio',
    'accelerator',
    'Pre-Seed Solo & Technical Founder Accelerator (Rolling)',
    '12-week virtual venture programme for solo founders building B2B SaaS, AI tooling, or emerging-market infrastructure with non-dilutive credits.',
    'Includes weekly architecture reviews, customer discovery coaching, investor readiness prep, and up to $25,000 in cloud/API partner credits with zero upfront equity requirement.',
    array['business', 'technology', 'artificial-intelligence'],
    'global_online',
    'Global Virtual',
    array[]::text[],
    'grant_award', 10000, 25000, 'USD',
    'any',
    array[
      'Working MVP or live staging prototype with clear target user segment',
      'Commitment to weekly founder accountability sessions'
    ],
    'https://dg-nexus.vercel.app/opportunities/global-venture-studio-accelerator-2027',
    null,
    true, 'curated', 'published'
  ),
  (
    'digital-public-policy-research-associate',
    'Global Digital Governance Observatory',
    'job',
    'Digital Policy & Data Protection Research Associate',
    'Research GDPR, NDPA, and cross-border AI governance frameworks and author actionable compliance playbooks for startups and public institutions.',
    'Ideal for interdisciplinary researchers bridging technology, public policy, and ethical AI regulation across Africa and Europe.',
    array['policy-governance', 'research', 'artificial-intelligence'],
    'remote',
    'Remote · Global',
    array[]::text[],
    'salary', 42000, 54000, 'EUR',
    'early_career',
    array[
      'Demonstrated policy analysis, qualitative research, or AI ethics writing samples',
      'Familiarity with international data protection standards (GDPR, NDPA, or equivalent)'
    ],
    'https://dg-nexus.vercel.app/opportunities/digital-public-policy-research-associate',
    now() + interval '30 days',
    false, 'curated', 'published'
  )
on conflict (slug) do nothing;

-- Link curated opportunities to canonical `skills` idempotently
insert into public.opportunity_skills (opportunity_id, skill_id, requirement_level)
select o.id, s.id, mapping.req
from (values
  ('civic-climate-ux-systems-fellowship-2027', 'ui-ux-design', 'required'),
  ('civic-climate-ux-systems-fellowship-2027', 'design-systems', 'required'),
  ('civic-climate-ux-systems-fellowship-2027', 'figma', 'required'),
  ('civic-climate-ux-systems-fellowship-2027', 'accessibility-wcag', 'preferred'),
  ('civic-climate-ux-systems-fellowship-2027', 'climate-tech', 'preferred'),

  ('global-product-designer-design-systems-remote', 'product-design', 'required'),
  ('global-product-designer-design-systems-remote', 'design-systems', 'required'),
  ('global-product-designer-design-systems-remote', 'figma', 'required'),
  ('global-product-designer-design-systems-remote', 'user-research', 'required'),
  ('global-product-designer-design-systems-remote', 'nextjs', 'preferred'),

  ('commonwealth-shared-masters-scholarship-2027', 'academic-research', 'required'),
  ('commonwealth-shared-masters-scholarship-2027', 'data-analytics', 'required'),
  ('commonwealth-shared-masters-scholarship-2027', 'machine-learning', 'preferred'),
  ('commonwealth-shared-masters-scholarship-2027', 'technical-writing', 'preferred'),

  ('fullstack-nextjs-typescript-engineer-remote', 'typescript', 'required'),
  ('fullstack-nextjs-typescript-engineer-remote', 'react', 'required'),
  ('fullstack-nextjs-typescript-engineer-remote', 'nextjs', 'required'),
  ('fullstack-nextjs-typescript-engineer-remote', 'postgresql', 'required'),
  ('fullstack-nextjs-typescript-engineer-remote', 'system-design', 'preferred'),

  ('responsible-ai-governance-microgrant-2026', 'ai-ethics-governance', 'required'),
  ('responsible-ai-governance-microgrant-2026', 'academic-research', 'required'),
  ('responsible-ai-governance-microgrant-2026', 'computer-vision', 'preferred'),
  ('responsible-ai-governance-microgrant-2026', 'prompt-engineering', 'preferred'),

  ('west-africa-climate-flood-hackathon-2026', 'ui-ux-design', 'required'),
  ('west-africa-climate-flood-hackathon-2026', 'data-analytics', 'required'),
  ('west-africa-climate-flood-hackathon-2026', 'environmental-data-gis', 'preferred'),
  ('west-africa-climate-flood-hackathon-2026', 'nextjs', 'preferred'),
  ('west-africa-climate-flood-hackathon-2026', 'project-management', 'preferred'),

  ('product-management-early-career-internship', 'product-management', 'required'),
  ('product-management-early-career-internship', 'user-research', 'required'),
  ('product-management-early-career-internship', 'data-storytelling', 'preferred'),

  ('cybersecurity-analyst-apprenticeship-hybrid', 'cybersecurity', 'required'),
  ('cybersecurity-analyst-apprenticeship-hybrid', 'cloud-architecture', 'preferred'),
  ('cybersecurity-analyst-apprenticeship-hybrid', 'devops', 'preferred'),

  ('brand-visual-systems-designer-contract', 'brand-identity', 'required'),
  ('brand-visual-systems-designer-contract', 'figma', 'required'),
  ('brand-visual-systems-designer-contract', 'design-systems', 'required'),
  ('brand-visual-systems-designer-contract', 'ui-ux-design', 'preferred'),

  ('sustainable-agriculture-data-fellowship', 'sustainable-agriculture', 'required'),
  ('sustainable-agriculture-data-fellowship', 'data-analytics', 'required'),
  ('sustainable-agriculture-data-fellowship', 'python', 'preferred'),
  ('sustainable-agriculture-data-fellowship', 'environmental-data-gis', 'preferred'),

  ('global-venture-studio-accelerator-2027', 'product-management', 'required'),
  ('global-venture-studio-accelerator-2027', 'business-strategy', 'required'),
  ('global-venture-studio-accelerator-2027', 'operations-management', 'preferred'),

  ('digital-public-policy-research-associate', 'policy-analysis', 'required'),
  ('digital-public-policy-research-associate', 'ai-ethics-governance', 'required'),
  ('digital-public-policy-research-associate', 'qualitative-research', 'preferred')
) as mapping(opp_slug, skill_slug, req)
join public.opportunities o on o.slug = mapping.opp_slug
join public.skills s on s.slug = mapping.skill_slug
on conflict (opportunity_id, skill_id) do nothing;
