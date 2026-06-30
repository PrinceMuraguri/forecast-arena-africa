import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WalletTx = {
  id: string;
  amount_kes: number;
  kind: string;
  memo: string | null;
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
  availableKes: number;
  lifetimeEarnedKes: number;
  pendingPayoutKes: number;
  transactions: WalletTx[];
  payouts: PayoutRequest[];
};

async function computeSnapshot(
  supabase: ReturnType<typeof requireSupabaseAuth> extends never ? never : any,
  userId: string,
): Promise<WalletSnapshot> {
  const [{ data: txs }, { data: payouts }] = await Promise.all([
    supabase
      .from("wallet_transactions")
      .select("id,amount_kes,kind,memo,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payout_requests")
      .select("id,amount_kes,mpesa_phone,status,admin_notes,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  let available = 0;
  let earned = 0;
  for (const t of (txs ?? []) as WalletTx[]) {
    const amt = Number(t.amount_kes);
    if (t.kind === "payout") available -= amt;
    else available += amt;
    if (t.kind === "reward" || t.kind === "bonus") earned += amt;
  }
  let pendingPayout = 0;
  for (const p of (payouts ?? []) as PayoutRequest[]) {
    if (p.status === "pending" || p.status === "approved") {
      pendingPayout += Number(p.amount_kes);
    }
  }
  available -= pendingPayout;

  return {
    availableKes: Math.round(available * 100) / 100,
    lifetimeEarnedKes: Math.round(earned * 100) / 100,
    pendingPayoutKes: Math.round(pendingPayout * 100) / 100,
    transactions: (txs ?? []) as WalletTx[],
    payouts: (payouts ?? []) as PayoutRequest[],
  };
}

export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return computeSnapshot(context.supabase, context.userId);
  });

export type RequestPayoutInput = {
  amountKes: number;
  mpesaPhone: string;
};

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: RequestPayoutInput) => {
    const amount = Number(input?.amountKes);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Enter a valid amount.");
    }
    if (amount < 100) throw new Error("Minimum payout is KES 100.");
    const phone = String(input?.mpesaPhone ?? "").trim();
    if (!/^(\+?254|0)?[17]\d{8}$/.test(phone.replace(/\s+/g, ""))) {
      throw new Error("Enter a valid Kenyan M-Pesa phone number.");
    }
    return { amountKes: Math.round(amount * 100) / 100, mpesaPhone: phone };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const snap = await computeSnapshot(supabase, userId);
    if (data.amountKes > snap.availableKes) {
      throw new Error(
        `Requested KES ${data.amountKes} exceeds available balance KES ${snap.availableKes}.`,
      );
    }
    const { data: row, error } = await supabase
      .from("payout_requests")
      .insert({
        user_id: userId,
        amount_kes: data.amountKes,
        mpesa_phone: data.mpesaPhone,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
