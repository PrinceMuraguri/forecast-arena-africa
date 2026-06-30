
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_org_member(uuid, uuid) from public, anon;
revoke execute on function public.is_org_admin(uuid, uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
