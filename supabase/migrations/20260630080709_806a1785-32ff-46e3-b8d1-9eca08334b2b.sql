
-- Wallet transactions (ledger)
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_kes numeric(12,2) NOT NULL,
  kind text NOT NULL CHECK (kind IN ('reward','bonus','adjustment','payout','refund')),
  market_id uuid REFERENCES public.markets(id) ON DELETE SET NULL,
  payout_request_id uuid,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wallet_tx_user_idx ON public.wallet_transactions(user_id, created_at DESC);

GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet tx"
  ON public.wallet_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage wallet tx"
  ON public.wallet_transactions FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));

-- Payout requests
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_kes numeric(12,2) NOT NULL CHECK (amount_kes > 0),
  mpesa_phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payout_req_user_idx ON public.payout_requests(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payouts"
  ON public.payout_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users create own payouts"
  ON public.payout_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins manage payouts"
  ON public.payout_requests FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));

CREATE TRIGGER payout_requests_set_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Balance helper (available = credits - debits - pending payouts)
CREATE OR REPLACE FUNCTION app_private.user_wallet_balance(uid uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT SUM(CASE WHEN kind IN ('payout') THEN -amount_kes ELSE amount_kes END)
    FROM public.wallet_transactions WHERE user_id = uid
  ),0)
  - COALESCE((
    SELECT SUM(amount_kes) FROM public.payout_requests
    WHERE user_id = uid AND status IN ('pending','approved')
  ),0);
$$;

REVOKE ALL ON FUNCTION app_private.user_wallet_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.user_wallet_balance(uuid) TO authenticated, service_role;

-- Convenience: small demo bonus for any existing user with no transactions (so dashboard isn't empty)
INSERT INTO public.wallet_transactions (user_id, amount_kes, kind, memo)
SELECT u.id, 250, 'bonus', 'Welcome bonus'
FROM auth.users u
LEFT JOIN public.wallet_transactions w ON w.user_id = u.id
WHERE w.id IS NULL;
