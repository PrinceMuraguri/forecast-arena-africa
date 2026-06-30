
-- Enums
do $$ begin
  create type public.market_status as enum ('draft','open','closed','resolved','void');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.poll_status as enum ('draft','open','closed');
exception when duplicate_object then null; end $$;

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  color text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories are public" on public.categories for select using (true);
create policy "admins manage categories" on public.categories for all
  to authenticated
  using (app_private.has_role(auth.uid(),'admin'))
  with check (app_private.has_role(auth.uid(),'admin'));
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.tg_set_updated_at();

-- Polls
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  summary text,
  question text not null,
  status public.poll_status not null default 'draft',
  opens_at timestamptz,
  closes_at timestamptz,
  sponsor_name text,
  sponsor_logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.polls to anon, authenticated;
grant all on public.polls to service_role;
alter table public.polls enable row level security;
create policy "open or closed polls are public" on public.polls for select
  using (status in ('open','closed'));
create policy "admins manage polls" on public.polls for all
  to authenticated
  using (app_private.has_role(auth.uid(),'admin'))
  with check (app_private.has_role(auth.uid(),'admin'));
create trigger trg_polls_updated before update on public.polls
  for each row execute function public.tg_set_updated_at();

-- Markets
create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  summary text,
  question text not null,
  status public.market_status not null default 'draft',
  opens_at timestamptz,
  closes_at timestamptz,
  resolves_at timestamptz,
  resolution_source text,
  resolution_notes text,
  sponsor_name text,
  sponsor_logo_url text,
  prize_pool_kes numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_markets_status on public.markets(status);
create index if not exists idx_markets_category on public.markets(category_id);
grant select on public.markets to anon, authenticated;
grant all on public.markets to service_role;
alter table public.markets enable row level security;
create policy "visible markets are public" on public.markets for select
  using (status in ('open','closed','resolved','void'));
create policy "admins manage markets" on public.markets for all
  to authenticated
  using (app_private.has_role(auth.uid(),'admin'))
  with check (app_private.has_role(auth.uid(),'admin'));
create trigger trg_markets_updated before update on public.markets
  for each row execute function public.tg_set_updated_at();

-- Market outcomes
create table if not exists public.market_outcomes (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  implied_probability numeric(5,4) not null default 0.5,
  is_winning boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(market_id, label)
);
create index if not exists idx_outcomes_market on public.market_outcomes(market_id);
grant select on public.market_outcomes to anon, authenticated;
grant all on public.market_outcomes to service_role;
alter table public.market_outcomes enable row level security;
create policy "outcomes visible with market" on public.market_outcomes for select
  using (exists (select 1 from public.markets m
                 where m.id = market_id
                   and m.status in ('open','closed','resolved','void')));
create policy "admins manage outcomes" on public.market_outcomes for all
  to authenticated
  using (app_private.has_role(auth.uid(),'admin'))
  with check (app_private.has_role(auth.uid(),'admin'));
create trigger trg_outcomes_updated before update on public.market_outcomes
  for each row execute function public.tg_set_updated_at();

-- Predictions
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  outcome_id uuid not null references public.market_outcomes(id) on delete restrict,
  confidence int not null check (confidence between 1 and 100),
  stake numeric(12,2) not null default 0,
  is_resolved boolean not null default false,
  points_awarded numeric(12,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, market_id)
);
create index if not exists idx_predictions_user on public.predictions(user_id);
create index if not exists idx_predictions_market on public.predictions(market_id);
grant select, insert, update on public.predictions to authenticated;
grant all on public.predictions to service_role;
alter table public.predictions enable row level security;

create policy "users view own predictions" on public.predictions for select
  to authenticated using (user_id = auth.uid());
create policy "admins view all predictions" on public.predictions for select
  to authenticated using (app_private.has_role(auth.uid(),'admin'));

create policy "users insert own prediction on open market"
  on public.predictions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.markets m
                where m.id = market_id and m.status = 'open')
  );

create policy "users update own prediction while market open"
  on public.predictions for update to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.markets m
                where m.id = market_id and m.status = 'open')
  )
  with check (user_id = auth.uid());

create trigger trg_predictions_updated before update on public.predictions
  for each row execute function public.tg_set_updated_at();
