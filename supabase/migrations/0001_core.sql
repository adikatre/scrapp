create extension if not exists pgcrypto;

create table public.jurisdictions (
  id text primary key,
  country_code text not null,
  region text not null,
  municipality text not null,
  timezone text not null,
  supported_locales text[] not null default array['en'],
  status text not null check (status in ('supported', 'pilot', 'unsupported')),
  created_at timestamptz not null default now()
);

create table public.service_profiles (
  id text primary key,
  jurisdiction_id text not null references public.jurisdictions(id) on delete cascade,
  name text not null,
  property_type text not null check (property_type in ('city-serviced-home', 'multifamily-or-private', 'unknown')),
  provider_name text,
  created_at timestamptz not null default now()
);

create table public.rule_sources (
  id text primary key,
  publisher text not null,
  title text not null,
  url text not null,
  language text not null default 'en',
  publication_date date,
  effective_date date,
  last_checked date not null,
  verification_status text not null check (verification_status in ('official', 'verified-partner')),
  created_at timestamptz not null default now()
);

create table public.materials (
  id text primary key,
  canonical_name text not null,
  packaging_type text,
  hazard_tags text[] not null default '{}',
  translations jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.material_aliases (
  id uuid primary key default gen_random_uuid(),
  material_id text not null references public.materials(id) on delete cascade,
  locale text not null default 'en',
  alias text not null,
  unique (material_id, locale, alias)
);

create table public.rule_versions (
  id text primary key,
  material_id text not null references public.materials(id),
  jurisdiction_id text not null references public.jurisdictions(id),
  service_profile_id text references public.service_profiles(id),
  source_id text not null references public.rule_sources(id),
  route text not null,
  bin text not null,
  instruction text not null,
  preparation jsonb not null default '[]',
  safety jsonb not null default '[]',
  exceptions jsonb not null default '[]',
  search_queries jsonb not null default '[]',
  location_eligible boolean not null default false,
  effective_from date not null,
  effective_to date,
  priority integer not null default 0,
  review_status text not null check (review_status in ('draft', 'in-review', 'published', 'expired')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create table public.facility_programs (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id text not null references public.jurisdictions(id),
  provider_name text not null,
  accepted_material_ids text[] not null default '{}',
  restrictions text,
  appointment_required boolean not null default false,
  phone text,
  website text,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  source_id text not null references public.rule_sources(id),
  last_verified date not null,
  status text not null check (status in ('verified', 'needs-review', 'inactive')),
  created_at timestamptz not null default now()
);

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'en',
  jurisdiction_id text references public.jurisdictions(id),
  service_profile_id text references public.service_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scan_records (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  input_mode text not null check (input_mode in ('photo', 'upload', 'describe', 'barcode')),
  candidate_ids text[] not null default '{}',
  material_id text references public.materials(id),
  decision_id text references public.rule_versions(id),
  jurisdiction_id text references public.jurisdictions(id),
  model_version text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  decision_id text not null references public.rule_versions(id),
  issue_type text not null check (issue_type in ('wrong_item', 'wrong_rule', 'unclear', 'bad_place')),
  corrected_material_id text references public.materials(id),
  corrected_route text,
  comment text check (char_length(comment) <= 500),
  review_status text not null default 'pending' check (review_status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  actor_type text not null default 'resident' check (actor_type in ('resident', 'editor', 'partner')),
  created_at timestamptz not null default now()
);

alter table public.jurisdictions enable row level security;
alter table public.service_profiles enable row level security;
alter table public.rule_sources enable row level security;
alter table public.materials enable row level security;
alter table public.material_aliases enable row level security;
alter table public.rule_versions enable row level security;
alter table public.facility_programs enable row level security;
alter table public.user_profiles enable row level security;
alter table public.scan_records enable row level security;
alter table public.feedback enable row level security;

create policy "published jurisdictions are public" on public.jurisdictions for select using (status in ('supported', 'pilot'));
create policy "service profiles are public" on public.service_profiles for select using (true);
create policy "verified sources are public" on public.rule_sources for select using (true);
create policy "materials are public" on public.materials for select using (true);
create policy "aliases are public" on public.material_aliases for select using (true);
create policy "published rules are public" on public.rule_versions for select using (review_status = 'published' and effective_from <= current_date and (effective_to is null or effective_to >= current_date));
create policy "verified facilities are public" on public.facility_programs for select using (status = 'verified');

create policy "users read own profile" on public.user_profiles for select using (auth.uid() = user_id);
create policy "users insert own profile" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "users update own profile" on public.user_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own profile" on public.user_profiles for delete using (auth.uid() = user_id);

create policy "users read own scans" on public.scan_records for select using (auth.uid() = user_id);
create policy "users insert own scans" on public.scan_records for insert with check (auth.uid() = user_id);
create policy "users delete own scans" on public.scan_records for delete using (auth.uid() = user_id);

create policy "feedback can be submitted" on public.feedback for insert with check (user_id is null or auth.uid() = user_id);
create policy "users read own feedback" on public.feedback for select using (auth.uid() = user_id);
