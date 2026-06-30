
-- Resolve a market: set winner, mark resolved, award wallet credits weighted by confidence.
CREATE OR REPLACE FUNCTION app_private.resolve_market(
  p_market_id uuid,
  p_winning_outcome_id uuid,
  p_resolution_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_status market_status;
  v_pool numeric(14,2);
  v_total_winning_conf bigint;
  v_market_slug text;
BEGIN
  IF v_caller IS NULL OR NOT app_private.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  SELECT status, prize_pool_kes, slug
    INTO v_status, v_pool, v_market_slug
  FROM public.markets WHERE id = p_market_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'market not found';
  END IF;
  IF v_status = 'resolved' THEN
    RAISE EXCEPTION 'market already resolved';
  END IF;

  -- Validate the winning outcome belongs to this market.
  IF NOT EXISTS (
    SELECT 1 FROM public.market_outcomes
    WHERE id = p_winning_outcome_id AND market_id = p_market_id
  ) THEN
    RAISE EXCEPTION 'outcome does not belong to market';
  END IF;

  -- Flip is_winning flags.
  UPDATE public.market_outcomes
    SET is_winning = (id = p_winning_outcome_id),
        updated_at = now()
  WHERE market_id = p_market_id;

  -- Mark market resolved.
  UPDATE public.markets
    SET status = 'resolved',
        resolves_at = COALESCE(resolves_at, now()),
        resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
        updated_at = now()
  WHERE id = p_market_id;

  -- Sum of confidence on the winning side.
  SELECT COALESCE(SUM(confidence), 0)::bigint
    INTO v_total_winning_conf
  FROM public.predictions
  WHERE market_id = p_market_id AND outcome_id = p_winning_outcome_id;

  -- Award wallet credits weighted by confidence; only if pool > 0 and there are winners.
  IF v_pool > 0 AND v_total_winning_conf > 0 THEN
    WITH winners AS (
      SELECT id, user_id, confidence,
             ROUND((v_pool * (confidence::numeric / v_total_winning_conf::numeric))::numeric, 2) AS award
      FROM public.predictions
      WHERE market_id = p_market_id AND outcome_id = p_winning_outcome_id
    ),
    upd AS (
      UPDATE public.predictions p
         SET is_resolved = true,
             points_awarded = w.award,
             updated_at = now()
        FROM winners w
       WHERE p.id = w.id
      RETURNING p.id
    )
    INSERT INTO public.wallet_transactions (user_id, kind, amount_kes, market_id, description, metadata)
    SELECT w.user_id, 'prediction_reward', w.award, p_market_id,
           'Correct forecast: ' || v_market_slug,
           jsonb_build_object('prediction_id', w.id, 'confidence', w.confidence)
    FROM winners w
    WHERE w.award > 0;
  END IF;

  -- Mark losing predictions resolved with zero points too.
  UPDATE public.predictions
     SET is_resolved = true,
         points_awarded = COALESCE(points_awarded, 0),
         updated_at = now()
   WHERE market_id = p_market_id
     AND outcome_id <> p_winning_outcome_id
     AND is_resolved = false;
END;
$$;

REVOKE ALL ON FUNCTION app_private.resolve_market(uuid, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION app_private.resolve_market(uuid, uuid, text) TO authenticated;

-- Admin-only: update payout request status; deducts already accounted via balance helper.
CREATE OR REPLACE FUNCTION app_private.set_payout_status(
  p_payout_id uuid,
  p_new_status text,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL OR NOT app_private.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;
  IF p_new_status NOT IN ('pending','approved','paid','rejected') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  UPDATE public.payout_requests
     SET status = p_new_status,
         admin_notes = COALESCE(p_admin_notes, admin_notes),
         updated_at = now()
   WHERE id = p_payout_id;
END;
$$;

REVOKE ALL ON FUNCTION app_private.set_payout_status(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION app_private.set_payout_status(uuid, text, text) TO authenticated;
