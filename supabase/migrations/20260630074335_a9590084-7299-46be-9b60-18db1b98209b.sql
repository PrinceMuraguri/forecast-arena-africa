
-- =========================
-- ENUMS
-- =========================
create type public.app_role as enum ('admin','moderator','user','sponsor','partner');
create type public.org_kind as enum ('sponsor','partner','media','internal');
create type public.org_member_role as enum ('owner','admin','editor','viewer');

-- =========================
-- PROFILES
-- =========================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  phone text,
  country text default 'KE',
  region text,
  locale text default 'en',
  persona text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone authenticated"
  on public.profiles for select to authenticated using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- =========================
-- USER ROLES (security definer)
-- =========================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Admins can view all roles"
  on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- =========================
-- ORGANIZATIONS
-- =========================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind public.org_kind not null default 'sponsor',
  website text,
  logo_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
alter table public.organizations enable row level security;

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.org_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
grant select, insert, update, delete on public.organization_members to authenticated;
grant all on public.organization_members to service_role;
alter table public.organization_members enable row level security;

-- Helper to avoid recursive RLS
create or replace function public.is_org_member(_user_id uuid, _org_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where user_id = _user_id and organization_id = _org_id
  )
$$;

create or replace function public.is_org_admin(_user_id uuid, _org_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where user_id = _user_id and organization_id = _org_id
      and role in ('owner','admin')
  )
$$;

create policy "Members can view their organizations"
  on public.organizations for select to authenticated
  using (public.is_org_member(auth.uid(), id) or public.has_role(auth.uid(),'admin'));
create policy "Authenticated users can create organizations"
  on public.organizations for insert to authenticated with check (auth.uid() = created_by);
create policy "Org admins can update their organization"
  on public.organizations for update to authenticated
  using (public.is_org_admin(auth.uid(), id) or public.has_role(auth.uid(),'admin'))
  with check (public.is_org_admin(auth.uid(), id) or public.has_role(auth.uid(),'admin'));

create policy "Members can view org membership"
  on public.organization_members for select to authenticated
  using (user_id = auth.uid() or public.is_org_member(auth.uid(), organization_id) or public.has_role(auth.uid(),'admin'));
create policy "Org admins can manage members"
  on public.organization_members for all to authenticated
  using (public.is_org_admin(auth.uid(), organization_id) or public.has_role(auth.uid(),'admin'))
  with check (public.is_org_admin(auth.uid(), organization_id) or public.has_role(auth.uid(),'admin'));

-- =========================
-- FEATURE FLAGS (public read)
-- =========================
create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default now()
);
grant select on public.feature_flags to anon, authenticated;
grant all on public.feature_flags to service_role;
alter table public.feature_flags enable row level security;

create policy "Feature flags are publicly readable"
  on public.feature_flags for select to anon, authenticated using (true);
create policy "Only admins can manage feature flags"
  on public.feature_flags for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- =========================
-- updated_at trigger
-- =========================
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.tg_set_updated_at();
create trigger feature_flags_set_updated_at before update on public.feature_flags
  for each row execute function public.tg_set_updated_at();

-- =========================
-- Auto-create profile on signup
-- =========================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    new.phone
  )
  on conflict (id) do nothing;

  -- default app role
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed initial feature flags
insert into public.feature_flags (key, enabled, description) values
  ('arena_live_markets', true, 'Show live prediction markets in The Arena'),
  ('rewards_payouts', true, 'Enable wallet payouts'),
  ('signup_phone_otp', true, 'Allow signup via phone OTP'),
  ('sponsor_portal', false, 'Sponsor self-serve portal (Phase 4+)')
on conflict (key) do nothing;
