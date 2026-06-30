
CREATE OR REPLACE FUNCTION public.resolve_market(
  p_market_id uuid,
  p_winning_outcome_id uuid,
  p_resolution_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
  SELECT app_private.resolve_market(p_market_id, p_winning_outcome_id, p_resolution_notes);
$$;
REVOKE ALL ON FUNCTION public.resolve_market(uuid, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_market(uuid, uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_payout_status(
  p_payout_id uuid,
  p_new_status text,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
  SELECT app_private.set_payout_status(p_payout_id, p_new_status, p_admin_notes);
$$;
REVOKE ALL ON FUNCTION public.set_payout_status(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_payout_status(uuid, text, text) TO authenticated;
