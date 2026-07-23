
DROP FUNCTION IF EXISTS public.record_deposit(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.finalize_payout(uuid, text, text, text);

CREATE OR REPLACE FUNCTION app_private.record_deposit(
  p_user_id uuid, p_amount_kes numeric, p_provider_reference text, p_channel text DEFAULT 'mpesa'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app_private, pg_temp
AS $$
DECLARE v_entry_id uuid; v_idem text := 'paystack:deposit:' || p_provider_reference;
BEGIN
  IF p_amount_kes IS NULL OR p_amount_kes <= 0 THEN RAISE EXCEPTION 'invalid deposit amount'; END IF;
  v_entry_id := app_private.post_ledger_entry(
    p_user_id, 'deposit'::public.ledger_entry_type, p_amount_kes,
    'M-Pesa deposit via Paystack', 'payment_transaction', NULL, v_idem, NULL);
  INSERT INTO public.payment_transactions
    (user_id, direction, purpose, amount_kes, currency, provider,
     provider_reference, provider_status, channel, ledger_entry_id)
  VALUES (p_user_id, 'collection', 'deposit', p_amount_kes, 'KES', 'paystack',
     p_provider_reference, 'success', p_channel, v_entry_id)
  ON CONFLICT DO NOTHING;
  RETURN v_entry_id;
END; $$;

CREATE OR REPLACE FUNCTION app_private.finalize_payout(
  p_payout_id uuid, p_status text, p_provider_reference text, p_failure_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, app_private, pg_temp
AS $$
BEGIN
  IF p_status NOT IN ('paid', 'failed') THEN RAISE EXCEPTION 'invalid payout status %', p_status; END IF;
  PERFORM app_private.set_payout_status(p_payout_id, p_status, p_failure_reason);
  UPDATE public.payment_transactions
     SET provider_reference = COALESCE(provider_reference, p_provider_reference),
         provider_status    = CASE WHEN p_status = 'paid' THEN 'success'::public.payment_status
                                   ELSE 'failed'::public.payment_status END,
         failure_reason     = COALESCE(p_failure_reason, failure_reason),
         updated_at         = now()
   WHERE payout_request_id = p_payout_id;
END; $$;

REVOKE ALL ON FUNCTION app_private.record_deposit(uuid, numeric, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.finalize_payout(uuid, text, text, text) FROM PUBLIC;
