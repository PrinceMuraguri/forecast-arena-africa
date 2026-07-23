import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WalletBalance = {
  available_kes: number;
  pending_payout_kes: number;
  lifetime_rewards_kes: number;
  lifetime_winnings_kes: number;
  lifetime_withdrawn_kes: number;
};

export type LedgerEntry = {
  id: string;
  entry_type: string;
  amount_kes: number;
  memo: string;
  source_type: string | null;
  created_at: string;
};

export type PayoutRequest = {
  id: string;
  amount_kes: number;
  mpesa_phone: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

export type WalletSnapshot = {
  balance: WalletBalance;
  transactions: LedgerEntry[];
  payouts: PayoutRequest[];
  mpesaPhone: string | null;
  mpesaVerified: boolean;
};

const EMPTY_BALANCE: WalletBalance = {
  available_kes: 0,
  pending_payout_kes: 0,
  lifetime_rewards_kes: 0,
  lifetime_winnings_kes: 0,
  lifetime_withdrawn_kes: 0,
};

export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WalletSnapshot> => {
    const { supabase, userId } = context;

    const [balRes, ledgerRes, payoutRes, profileRes] = await Promise.all([
      supabase
        .from("wallet_balances")
        .select("available_kes,pending_payout_kes,lifetime_rewards_kes,lifetime_winnings_kes,lifetime_withdrawn_kes")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("ledger_entries")
        .select("id,entry_type,amount_kes,memo,source_type,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("payout_requests")
        .select("id,amount_kes,mpesa_phone,status,admin_notes,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("mpesa_phone,mpesa_phone_verified")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const balance = (balRes.data ?? EMPTY_BALANCE) as WalletBalance;
    return {
      balance: {
        available_kes: Number(balance.available_kes ?? 0),
        pending_payout_kes: Number(balance.pending_payout_kes ?? 0),
        lifetime_rewards_kes: Number(balance.lifetime_rewards_kes ?? 0),
        lifetime_winnings_kes: Number(balance.lifetime_winnings_kes ?? 0),
        lifetime_withdrawn_kes: Number(balance.lifetime_withdrawn_kes ?? 0),
      },
      transactions: (ledgerRes.data ?? []) as LedgerEntry[],
      payouts: (payoutRes.data ?? []) as PayoutRequest[],
      mpesaPhone: (profileRes.data?.mpesa_phone as string | null) ?? null,
      mpesaVerified: Boolean(profileRes.data?.mpesa_phone_verified),
    };
  });

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amountKes: number }) => {
    const amount = Number(input?.amountKes);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount.");
    if (amount < 100) throw new Error("Minimum payout is KES 100.");
    return { amountKes: Math.round(amount * 100) / 100 };
  })
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("request_payout", {
      p_amount_kes: data.amountKes,
    });
    if (error) throw new Error(error.message);
    return { id: id as string };
  });
