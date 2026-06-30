
-- Private schema, not exposed by the Data API
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated, service_role;

-- Recreate helpers inside app_private
create or replace function app_private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function app_private.is_org_member(_user_id uuid, _org_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.organization_members where user_id=_user_id and organization_id=_org_id) $$;

create or replace function app_private.is_org_admin(_user_id uuid, _org_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.organization_members where user_id=_user_id and organization_id=_org_id and role in ('owner','admin')) $$;

revoke all on function app_private.has_role(uuid, public.app_role) from public, anon;
revoke all on function app_private.is_org_member(uuid, uuid) from public, anon;
revoke all on function app_private.is_org_admin(uuid, uuid) from public, anon;
grant execute on function app_private.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function app_private.is_org_member(uuid, uuid) to authenticated, service_role;
grant execute on function app_private.is_org_admin(uuid, uuid) to authenticated, service_role;

-- Repoint policies to the private helpers
drop policy if exists "Admins can view all roles" on public.user_roles;
drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can view all roles" on public.user_roles
  for select to authenticated using (app_private.has_role(auth.uid(),'admin'));
create policy "Admins can manage roles" on public.user_roles
  for all to authenticated
  using (app_private.has_role(auth.uid(),'admin'))
  with check (app_private.has_role(auth.uid(),'admin'));

drop policy if exists "Members can view their organizations" on public.organizations;
drop policy if exists "Org admins can update their organization" on public.organizations;
create policy "Members can view their organizations" on public.organizations
  for select to authenticated
  using (app_private.is_org_member(auth.uid(), id) or app_private.has_role(auth.uid(),'admin'));
create policy "Org admins can update their organization" on public.organizations
  for update to authenticated
  using (app_private.is_org_admin(auth.uid(), id) or app_private.has_role(auth.uid(),'admin'))
  with check (app_private.is_org_admin(auth.uid(), id) or app_private.has_role(auth.uid(),'admin'));

drop policy if exists "Members can view org membership" on public.organization_members;
drop policy if exists "Org admins can manage members" on public.organization_members;
create policy "Members can view org membership" on public.organization_members
  for select to authenticated
  using (user_id = auth.uid()
         or app_private.is_org_member(auth.uid(), organization_id)
         or app_private.has_role(auth.uid(),'admin'));
create policy "Org admins can manage members" on public.organization_members
  for all to authenticated
  using (app_private.is_org_admin(auth.uid(), organization_id) or app_private.has_role(auth.uid(),'admin'))
  with check (app_private.is_org_admin(auth.uid(), organization_id) or app_private.has_role(auth.uid(),'admin'));

drop policy if exists "Only admins can manage feature flags" on public.feature_flags;
create policy "Only admins can manage feature flags" on public.feature_flags
  for all to authenticated
  using (app_private.has_role(auth.uid(),'admin'))
  with check (app_private.has_role(auth.uid(),'admin'));

-- Drop public-schema duplicates (no longer referenced by any policy)
drop function if exists public.has_role(uuid, public.app_role);
drop function if exists public.is_org_member(uuid, uuid);
drop function if exists public.is_org_admin(uuid, uuid);

-- Pin search_path on remaining functions
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp
as $$ begin new.updated_at = now(); return new; end; $$;
