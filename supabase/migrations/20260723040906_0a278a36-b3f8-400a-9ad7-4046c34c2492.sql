
-- ============================================================
-- STAGE 1: SAFE MONEY LAYER
-- ============================================================

-- 1.0 — Close the payout_requests write vulnerability
DROP POLICY IF EXISTS "Users create own payouts" ON public.payout_requests;
REVOKE INSERT ON public.payout_requests FROM authenticated;

-- Also close direct writes on predictions (Step 1.6)
DROP POLICY IF EXISTS "users insert own prediction on open market" ON public.predictions;
DROP POLICY IF EXISTS "users update own prediction while market open" ON public.predictions;
REVOKE INSERT, UPDATE ON public.predictions FROM authenticated;

-- ============================================================
-- 1.1 — Enums
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.ledger_entry_type AS ENUM (
    'survey_reward','prediction_winning','referral_bonus','deposit',
    'stake_debit','stake_refund','payout_debit','payout_reversal','adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_direction AS ENUM ('collection','payout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending','processing','success','failed','reversed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_purpose AS ENUM ('deposit','report_purchase','subscription','withdrawal','prize_payout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1.1a — ledger_entries
-- ============================================================
CREATE TABLE public.ledger_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type      public.ledger_entry_type NOT NULL,
  amount_kes      numeric(14,2) NOT NULL CHECK (amount_kes <> 0),
  currency        text NOT NULL DEFAULT 'KES',
  source_type     text,
  source_id       uuid,
  memo            text NOT NULL,
  idempotency_key text UNIQUE,
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ledger_user_created_idx ON public.ledger_entries(user_id, created_at DESC);
CREATE INDEX ledger_source_idx ON public.ledger_entries(source_type, source_id);

GRANT SELECT ON public.ledger_entries TO authenticated;
GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ledger" ON public.ledger_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins read all ledger" ON public.ledger_entries FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 1.1b — wallet_balances
-- ============================================================
CREATE TABLE public.wallet_balances (
  user_id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_kes          numeric(14,2) NOT NULL DEFAULT 0 CHECK (available_kes >= 0),
  pending_payout_kes     numeric(14,2) NOT NULL DEFAULT 0 CHECK (pending_payout_kes >= 0),
  lifetime_rewards_kes   numeric(14,2) NOT NULL DEFAULT 0,
  lifetime_winnings_kes  numeric(14,2) NOT NULL DEFAULT 0,
  lifetime_withdrawn_kes numeric(14,2) NOT NULL DEFAULT 0,
  updated_at             timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_balances TO authenticated;
GRANT ALL ON public.wallet_balances TO service_role;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own balance" ON public.wallet_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins read all balances" ON public.wallet_balances FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'));

ALTER TABLE public.wallet_balances REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_balances;

-- ============================================================
-- 1.1c — prize_pools
-- ============================================================
CREATE TABLE public.prize_pools (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id              uuid REFERENCES public.markets(id) ON DELETE CASCADE,
  poll_id                uuid REFERENCES public.polls(id) ON DELETE CASCADE,
  sponsor_org_id         uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  prize_amount_kes       numeric(14,2) NOT NULL DEFAULT 0 CHECK (prize_amount_kes >= 0),
  completion_budget_kes  numeric(14,2) NOT NULL DEFAULT 0 CHECK (completion_budget_kes >= 0),
  disbursed_kes          numeric(14,2) NOT NULL DEFAULT 0 CHECK (disbursed_kes >= 0),
  funding_status         text NOT NULL DEFAULT 'pledged'
                         CHECK (funding_status IN ('pledged','funded','disbursed','closed')),
  is_pass_through        boolean NOT NULL DEFAULT true,
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CHECK (market_id IS NOT NULL OR poll_id IS NOT NULL)
);
CREATE INDEX prize_pools_market_idx ON public.prize_pools(market_id);
CREATE INDEX prize_pools_poll_idx ON public.prize_pools(poll_id);

GRANT SELECT ON public.prize_pools TO anon, authenticated;
GRANT ALL ON public.prize_pools TO service_role;
ALTER TABLE public.prize_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prize pools are publicly readable" ON public.prize_pools FOR SELECT USING (true);
CREATE POLICY "Admins manage prize pools" ON public.prize_pools FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER prize_pools_set_updated_at
  BEFORE UPDATE ON public.prize_pools
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- 1.1d — payment_transactions
-- ============================================================
CREATE TABLE public.payment_transactions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  direction          public.payment_direction NOT NULL,
  purpose            public.payment_purpose NOT NULL,
  amount_kes         numeric(14,2) NOT NULL CHECK (amount_kes > 0),
  currency           text NOT NULL DEFAULT 'KES',
  provider           text NOT NULL DEFAULT 'paystack',
  provider_reference text UNIQUE,
  provider_status    public.payment_status NOT NULL DEFAULT 'pending',
  channel            text,
  recipient_code     text,
  mpesa_phone        text,
  payout_request_id  uuid REFERENCES public.payout_requests(id) ON DELETE SET NULL,
  ledger_entry_id    uuid REFERENCES public.ledger_entries(id) ON DELETE SET NULL,
  batch_id           uuid,
  failure_reason     text,
  metadata           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_tx_user_idx ON public.payment_transactions(user_id, created_at DESC);
CREATE INDEX payment_tx_ref_idx ON public.payment_transactions(provider_reference);
CREATE INDEX payment_tx_status_idx ON public.payment_transactions(provider_status);

GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payments" ON public.payment_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins read all payments" ON public.payment_transactions FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payment_tx_set_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- 1.2 — profiles: verified payout identity
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mpesa_phone            text,
  ADD COLUMN IF NOT EXISTS mpesa_phone_verified   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mpesa_verified_at      timestamptz,
  ADD COLUMN IF NOT EXISTS email_verified_cached  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payouts_blocked        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payouts_blocked_reason text;

-- ============================================================
-- 1.3 — post_ledger_entry (single write path)
-- ============================================================
CREATE OR REPLACE FUNCTION app_private.post_ledger_entry(
  p_user_id         uuid,
  p_entry_type      public.ledger_entry_type,
  p_amount_kes      numeric,
  p_memo            text,
  p_source_type     text DEFAULT NULL,
  p_source_id       uuid DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL,
  p_created_by      uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_entry_id  uuid;
  v_existing  uuid;
  v_available numeric(14,2);
BEGIN
  IF p_amount_kes IS NULL OR p_amount_kes = 0 THEN
    RAISE EXCEPTION 'ledger: amount must be non-zero';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.ledger_entries WHERE idempotency_key = p_idempotency_key;
    IF v_existing IS NOT NULL THEN
      RETURN v_existing;
    END IF;
  END IF;

  INSERT INTO public.wallet_balances(user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT available_kes INTO v_available FROM public.wallet_balances
    WHERE user_id = p_user_id FOR UPDATE;

  IF p_amount_kes < 0 AND (v_available + p_amount_kes) < 0 THEN
    RAISE EXCEPTION 'insufficient balance: available %, attempted %', v_available, abs(p_amount_kes);
  END IF;

  INSERT INTO public.ledger_entries(
    user_id, entry_type, amount_kes, memo, source_type, source_id, idempotency_key, created_by
  ) VALUES (
    p_user_id, p_entry_type, p_amount_kes, p_memo, p_source_type, p_source_id, p_idempotency_key, p_created_by
  ) RETURNING id INTO v_entry_id;

  UPDATE public.wallet_balances
     SET available_kes = available_kes + p_amount_kes,
         pending_payout_kes = pending_payout_kes
           + CASE WHEN p_entry_type = 'payout_debit'    THEN abs(p_amount_kes)
                  WHEN p_entry_type = 'payout_reversal' THEN -abs(p_amount_kes)
                  ELSE 0 END,
         lifetime_rewards_kes = lifetime_rewards_kes
           + CASE WHEN p_entry_type = 'survey_reward' THEN p_amount_kes ELSE 0 END,
         lifetime_winnings_kes = lifetime_winnings_kes
           + CASE WHEN p_entry_type = 'prediction_winning' THEN p_amount_kes ELSE 0 END,
         updated_at = now()
   WHERE user_id = p_user_id;

  RETURN v_entry_id;
END;
$$;

REVOKE ALL ON FUNCTION app_private.post_ledger_entry(uuid, public.ledger_entry_type, numeric, text, text, uuid, text, uuid)
  FROM public, anon, authenticated;

-- ============================================================
-- 1.4 — complete_survey_reward
-- ============================================================
CREATE OR REPLACE FUNCTION app_private.complete_survey_reward(p_response_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_user_id uuid; v_poll_id uuid; v_reward numeric(12,2); v_already boolean;
BEGIN
  SELECT r.user_id, r.poll_id, r.reward_kes,
         EXISTS (SELECT 1 FROM public.ledger_entries le
                  WHERE le.source_type = 'poll_response' AND le.source_id = r.id)
    INTO v_user_id, v_poll_id, v_reward, v_already
    FROM public.poll_responses r WHERE r.id = p_response_id FOR UPDATE;

  IF v_user_id IS NULL THEN RAISE EXCEPTION 'response not found'; END IF;
  IF v_already THEN RETURN 0; END IF;
  IF v_reward IS NULL OR v_reward <= 0 THEN RETURN 0; END IF;

  IF auth.uid() IS DISTINCT FROM v_user_id AND NOT app_private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  PERFORM app_private.post_ledger_entry(
    v_user_id, 'survey_reward', v_reward,
    'Completion reward — ' || COALESCE((SELECT title FROM public.polls WHERE id = v_poll_id), 'poll'),
    'poll_response', p_response_id,
    'survey_reward:' || p_response_id::text
  );

  UPDATE public.prize_pools SET disbursed_kes = disbursed_kes + v_reward
   WHERE poll_id = v_poll_id;

  RETURN v_reward;
END;
$$;

REVOKE ALL ON FUNCTION app_private.complete_survey_reward(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION app_private.complete_survey_reward(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_survey_reward(p_response_id uuid)
RETURNS numeric LANGUAGE sql SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$ SELECT app_private.complete_survey_reward(p_response_id); $$;
REVOKE ALL ON FUNCTION public.complete_survey_reward(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.complete_survey_reward(uuid) TO authenticated;

-- ============================================================
-- 1.5 — request_payout and reverse_payout
-- ============================================================
CREATE OR REPLACE FUNCTION app_private.request_payout(p_amount_kes numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_phone text; v_verified boolean; v_blocked boolean; v_req_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_amount_kes IS NULL OR p_amount_kes < 100 THEN
    RAISE EXCEPTION 'Minimum payout is KES 100.';
  END IF;

  SELECT mpesa_phone, mpesa_phone_verified, payouts_blocked
    INTO v_phone, v_verified, v_blocked
    FROM public.profiles WHERE id = v_user;

  IF COALESCE(v_blocked, false) THEN
    RAISE EXCEPTION 'Payouts are temporarily blocked on this account.';
  END IF;
  IF v_phone IS NULL OR NOT COALESCE(v_verified, false) THEN
    RAISE EXCEPTION 'Verify your M-Pesa number before withdrawing.';
  END IF;

  INSERT INTO public.payout_requests(user_id, amount_kes, mpesa_phone, status)
       VALUES (v_user, p_amount_kes, v_phone, 'pending')
    RETURNING id INTO v_req_id;

  PERFORM app_private.post_ledger_entry(
    v_user, 'payout_debit', -p_amount_kes,
    'Withdrawal to M-Pesa', 'payout_request', v_req_id,
    'payout_debit:' || v_req_id::text
  );

  RETURN v_req_id;
END;
$$;

REVOKE ALL ON FUNCTION app_private.request_payout(numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION app_private.request_payout(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_payout(p_amount_kes numeric)
RETURNS uuid LANGUAGE sql SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$ SELECT app_private.request_payout(p_amount_kes); $$;
REVOKE ALL ON FUNCTION public.request_payout(numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.request_payout(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION app_private.reverse_payout(p_payout_request_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE v_user uuid; v_amount numeric(14,2); v_status text;
BEGIN
  SELECT user_id, amount_kes, status INTO v_user, v_amount, v_status
    FROM public.payout_requests WHERE id = p_payout_request_id FOR UPDATE;
  IF v_user IS NULL THEN RAISE EXCEPTION 'payout request not found'; END IF;
  IF v_status = 'rejected' THEN RETURN; END IF;

  PERFORM app_private.post_ledger_entry(
    v_user, 'payout_reversal', v_amount,
    'Withdrawal reversed — ' || COALESCE(p_reason, 'transfer failed'),
    'payout_request', p_payout_request_id,
    'payout_reversal:' || p_payout_request_id::text
  );

  UPDATE public.payout_requests
     SET status = 'rejected', admin_notes = COALESCE(p_reason, 'transfer failed'), updated_at = now()
   WHERE id = p_payout_request_id;
END;
$$;
REVOKE ALL ON FUNCTION app_private.reverse_payout(uuid, text) FROM public, anon, authenticated;

-- ============================================================
-- 1.6 — place_prediction
-- ============================================================
CREATE OR REPLACE FUNCTION app_private.place_prediction(
  p_market_id uuid, p_outcome_id uuid,
  p_confidence int DEFAULT 100, p_stake_kes numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_status public.market_status;
  v_closes timestamptz;
  v_staked_enabled boolean;
  v_pred_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT status, closes_at INTO v_status, v_closes
    FROM public.markets WHERE id = p_market_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'market not found'; END IF;
  IF v_status <> 'open' THEN RAISE EXCEPTION 'market is not open'; END IF;
  IF v_closes IS NOT NULL AND now() > v_closes THEN RAISE EXCEPTION 'market has closed'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.market_outcomes WHERE id = p_outcome_id AND market_id = p_market_id) THEN
    RAISE EXCEPTION 'outcome does not belong to this market';
  END IF;

  IF p_stake_kes > 0 THEN
    SELECT enabled INTO v_staked_enabled FROM public.feature_flags WHERE key = 'staked_markets_enabled';
    IF NOT COALESCE(v_staked_enabled, false) THEN
      RAISE EXCEPTION 'staked markets are not enabled';
    END IF;
  END IF;

  INSERT INTO public.predictions(user_id, market_id, outcome_id, confidence, stake)
       VALUES (v_user, p_market_id, p_outcome_id, GREATEST(1, LEAST(100, p_confidence)), COALESCE(p_stake_kes, 0))
  ON CONFLICT (user_id, market_id)
  DO UPDATE SET outcome_id = EXCLUDED.outcome_id,
                confidence = EXCLUDED.confidence,
                updated_at = now()
  RETURNING id INTO v_pred_id;

  IF p_stake_kes > 0 THEN
    PERFORM app_private.post_ledger_entry(
      v_user, 'stake_debit', -p_stake_kes,
      'Stake placed', 'market', p_market_id,
      'stake:' || v_pred_id::text
    );
  END IF;

  RETURN v_pred_id;
END;
$$;

REVOKE ALL ON FUNCTION app_private.place_prediction(uuid, uuid, int, numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION app_private.place_prediction(uuid, uuid, int, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.place_prediction(
  p_market_id uuid, p_outcome_id uuid,
  p_confidence int DEFAULT 100, p_stake_kes numeric DEFAULT 0
)
RETURNS uuid LANGUAGE sql SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$ SELECT app_private.place_prediction(p_market_id, p_outcome_id, p_confidence, p_stake_kes); $$;
REVOKE ALL ON FUNCTION public.place_prediction(uuid, uuid, int, numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.place_prediction(uuid, uuid, int, numeric) TO authenticated;

-- Seed the staked-markets flag (off by default).
INSERT INTO public.feature_flags(key, enabled, description)
VALUES ('staked_markets_enabled', false, 'Enables users to stake real money on predictions.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 1.7 — resolve_market: pay through the ledger
-- ============================================================
CREATE OR REPLACE FUNCTION app_private.resolve_market(
  p_market_id uuid, p_winning_outcome_id uuid, p_resolution_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private, pg_temp
AS $$
DECLARE
  v_status public.market_status;
  v_pool numeric(14,2);
  v_total_winning_conf bigint;
  v_market_title text;
BEGIN
  IF NOT app_private.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT status, prize_pool_kes, title
    INTO v_status, v_pool, v_market_title
    FROM public.markets WHERE id = p_market_id FOR UPDATE;

  IF v_status IS NULL THEN RAISE EXCEPTION 'market not found'; END IF;
  IF v_status = 'resolved' THEN RAISE EXCEPTION 'market already resolved'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.market_outcomes
    WHERE id = p_winning_outcome_id AND market_id = p_market_id
  ) THEN
    RAISE EXCEPTION 'outcome does not belong to market';
  END IF;

  UPDATE public.market_outcomes
    SET is_winning = (id = p_winning_outcome_id), updated_at = now()
    WHERE market_id = p_market_id;

  UPDATE public.markets
    SET status = 'resolved',
        resolves_at = COALESCE(resolves_at, now()),
        resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
        updated_at = now()
    WHERE id = p_market_id;

  SELECT COALESCE(SUM(confidence), 0)::bigint INTO v_total_winning_conf
    FROM public.predictions
    WHERE market_id = p_market_id AND outcome_id = p_winning_outcome_id;

  IF v_pool > 0 AND v_total_winning_conf > 0 THEN
    -- Mark winners
    UPDATE public.predictions p
       SET is_resolved = true,
           points_awarded = ROUND((v_pool * (p.confidence::numeric / v_total_winning_conf::numeric))::numeric, 2),
           updated_at = now()
     WHERE p.market_id = p_market_id AND p.outcome_id = p_winning_outcome_id;

    -- Credit each winner through the ledger
    PERFORM app_private.post_ledger_entry(
      w.user_id, 'prediction_winning', w.award,
      'Winnings — ' || v_market_title, 'market', p_market_id,
      'winning:' || p_market_id::text || ':' || w.user_id::text
    )
    FROM (
      SELECT user_id,
             ROUND((v_pool * (confidence::numeric / v_total_winning_conf::numeric))::numeric, 2) AS award
        FROM public.predictions
       WHERE market_id = p_market_id AND outcome_id = p_winning_outcome_id
    ) w
    WHERE w.award > 0;

    -- Losers: mark resolved with 0 award
    UPDATE public.predictions p
       SET is_resolved = true, points_awarded = 0, updated_at = now()
     WHERE p.market_id = p_market_id AND p.outcome_id <> p_winning_outcome_id AND NOT p.is_resolved;

    UPDATE public.prize_pools
       SET disbursed_kes = disbursed_kes + v_pool,
           funding_status = 'disbursed'
     WHERE market_id = p_market_id;
  ELSE
    UPDATE public.predictions p
       SET is_resolved = true, points_awarded = 0, updated_at = now()
     WHERE p.market_id = p_market_id AND NOT p.is_resolved;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION app_private.resolve_market(uuid, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION app_private.resolve_market(uuid, uuid, text) TO authenticated;
-- The public wrapper already exists from prior migration; it re-delegates here.

-- ============================================================
-- 1.8 — Backfill from wallet_transactions
-- ============================================================
INSERT INTO public.ledger_entries(
  user_id, entry_type, amount_kes, memo, source_type, source_id, idempotency_key, created_at
)
SELECT
  wt.user_id,
  CASE wt.kind
    WHEN 'reward'     THEN 'survey_reward'::public.ledger_entry_type
    WHEN 'bonus'      THEN 'referral_bonus'::public.ledger_entry_type
    WHEN 'payout'     THEN 'payout_debit'::public.ledger_entry_type
    WHEN 'refund'     THEN 'stake_refund'::public.ledger_entry_type
    ELSE 'adjustment'::public.ledger_entry_type
  END,
  CASE WHEN wt.kind = 'payout' THEN -abs(wt.amount_kes) ELSE wt.amount_kes END,
  COALESCE(wt.memo, 'Migrated from wallet_transactions'),
  CASE WHEN wt.market_id IS NOT NULL THEN 'market' ELSE 'legacy' END,
  wt.market_id,
  'legacy:' || wt.id::text,
  wt.created_at
FROM public.wallet_transactions wt
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO public.wallet_balances(user_id)
SELECT DISTINCT user_id FROM public.ledger_entries
ON CONFLICT (user_id) DO NOTHING;

UPDATE public.wallet_balances wb
   SET available_kes = GREATEST(0, COALESCE(agg.total, 0)),
       pending_payout_kes = 0,
       lifetime_rewards_kes  = COALESCE(agg.rewards, 0),
       lifetime_winnings_kes = COALESCE(agg.winnings, 0),
       lifetime_withdrawn_kes = COALESCE(agg.withdrawn, 0),
       updated_at = now()
  FROM (
    SELECT user_id,
           SUM(amount_kes) AS total,
           SUM(CASE WHEN entry_type = 'survey_reward' THEN amount_kes ELSE 0 END) AS rewards,
           SUM(CASE WHEN entry_type = 'prediction_winning' THEN amount_kes ELSE 0 END) AS winnings,
           SUM(CASE WHEN entry_type = 'payout_debit' THEN abs(amount_kes) ELSE 0 END) AS withdrawn
      FROM public.ledger_entries GROUP BY user_id
  ) agg
 WHERE wb.user_id = agg.user_id;

-- Freeze legacy wallet_transactions from further writes by authenticated users.
REVOKE INSERT, UPDATE, DELETE ON public.wallet_transactions FROM authenticated;
