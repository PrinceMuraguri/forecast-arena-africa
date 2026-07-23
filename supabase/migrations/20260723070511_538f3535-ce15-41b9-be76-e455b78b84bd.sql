
-- PART A: Fix payout money-loss bug

-- A3: settle_payout (must exist before set_payout_status calls it)
CREATE OR REPLACE FUNCTION app_private.settle_payout(p_payout_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_user uuid; v_amount numeric(14,2); v_status text;
BEGIN
  SELECT user_id, amount_kes, status
    INTO v_user, v_amount, v_status
    FROM public.payout_requests WHERE id = p_payout_request_id FOR UPDATE;

  IF v_user IS NULL THEN RAISE EXCEPTION 'payout request not found'; END IF;
  IF v_status = 'paid' THEN RETURN; END IF;

  UPDATE public.payout_requests
     SET status = 'paid', updated_at = now()
   WHERE id = p_payout_request_id;

  UPDATE public.wallet_balances
     SET pending_payout_kes     = GREATEST(0, pending_payout_kes - v_amount),
         lifetime_withdrawn_kes = lifetime_withdrawn_kes + v_amount,
         updated_at             = now()
   WHERE user_id = v_user;
END;
$$;

REVOKE ALL ON FUNCTION app_private.settle_payout(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.settle_payout(uuid) TO service_role;

-- A2: Rewrite set_payout_status
CREATE OR REPLACE FUNCTION app_private.set_payout_status(
  p_payout_id   uuid,
  p_new_status  text,
  p_admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_status text;
BEGIN
  IF p_new_status = 'failed' THEN
    p_new_status := 'rejected';
  END IF;

  IF p_new_status NOT IN ('pending','approved','paid','rejected') THEN
    RAISE EXCEPTION 'invalid status %', p_new_status;
  END IF;

  SELECT status INTO v_status
    FROM public.payout_requests WHERE id = p_payout_id FOR UPDATE;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'payout request not found';
  END IF;

  IF p_new_status = 'paid' THEN
    PERFORM app_private.settle_payout(p_payout_id);
    IF p_admin_notes IS NOT NULL THEN
      UPDATE public.payout_requests
         SET admin_notes = p_admin_notes, updated_at = now()
       WHERE id = p_payout_id;
    END IF;

  ELSIF p_new_status = 'rejected' THEN
    IF v_status <> 'rejected' THEN
      PERFORM app_private.reverse_payout(
        p_payout_id, COALESCE(p_admin_notes, 'transfer failed')
      );
    END IF;

  ELSE
    UPDATE public.payout_requests
       SET status      = p_new_status,
           admin_notes = COALESCE(p_admin_notes, admin_notes),
           updated_at  = now()
     WHERE id = p_payout_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION app_private.set_payout_status(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION app_private.set_payout_status(uuid, text, text) TO service_role;

-- A4: Repair drift for already-paid payouts still holding pending reservations
UPDATE public.wallet_balances wb
   SET pending_payout_kes     = GREATEST(0, wb.pending_payout_kes - x.paid_total),
       lifetime_withdrawn_kes = wb.lifetime_withdrawn_kes + x.paid_total,
       updated_at             = now()
  FROM (
    SELECT user_id, SUM(amount_kes) AS paid_total
      FROM public.payout_requests WHERE status = 'paid' GROUP BY user_id
  ) x
 WHERE wb.user_id = x.user_id AND wb.pending_payout_kes > 0;

-- A5: Integrity view
CREATE OR REPLACE VIEW public.v_ledger_integrity AS
SELECT le.user_id,
       SUM(le.amount_kes)                                  AS ledger_sum,
       COALESCE(wb.available_kes, 0)                       AS cached_available,
       SUM(le.amount_kes) - COALESCE(wb.available_kes, 0)  AS drift
FROM public.ledger_entries le
LEFT JOIN public.wallet_balances wb ON wb.user_id = le.user_id
GROUP BY le.user_id, wb.available_kes
HAVING SUM(le.amount_kes) <> COALESCE(wb.available_kes, 0);

REVOKE ALL ON public.v_ledger_integrity FROM anon, authenticated;
GRANT SELECT ON public.v_ledger_integrity TO service_role;

-- PART C schema: cache Paystack recipient code per user
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paystack_recipient_code text;

-- PART C: auto-payouts feature flag
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('auto_payouts_enabled', false, 'When true, request_payout success immediately dispatches a Paystack transfer for that request.')
ON CONFLICT (key) DO NOTHING;
