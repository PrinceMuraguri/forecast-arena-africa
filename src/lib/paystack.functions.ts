import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAYSTACK_BASE = "https://api.paystack.co";

function normalizeMpesaPhone(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("254")) return "+" + digits;
  if (digits.startsWith("0") && digits.length === 10) return "+254" + digits.slice(1);
  if (digits.length === 9) return "+254" + digits;
  throw new Error("Enter a valid Kenyan mobile number.");
}

async function paystack<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Payments are not configured yet.");
  const res = await fetch(PAYSTACK_BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || body.status === false) {
    throw new Error(body.message || `Paystack error (${res.status})`);
  }
  return body.data as T;
}

/**
 * Initiate an M-Pesa STK push deposit via Paystack Charge API.
 * Returns the reference so the client can poll or await the webhook.
 */
export const initiateMpesaDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amountKes: number; phone: string }) => {
    const amount = Number(input?.amountKes);
    if (!Number.isFinite(amount) || amount < 10) throw new Error("Minimum deposit is KES 10.");
    if (amount > 150000) throw new Error("Maximum single deposit is KES 150,000.");
    return { amountKes: Math.round(amount), phone: normalizeMpesaPhone(input.phone) };
  })
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();

    // Paystack account email (users identified by uuid; email optional)
    const email = `user-${userId}@wallet.forecastarena.africa`;
    const reference = `fa_dep_${userId.slice(0, 8)}_${Date.now()}`;

    const res = await paystack<{ reference: string; status: string; display_text?: string }>(
      "/charge",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          amount: data.amountKes * 100, // Paystack expects kobo/cents
          currency: "KES",
          reference,
          mobile_money: { phone: data.phone, provider: "mpesa" },
          metadata: {
            user_id: userId,
            purpose: "deposit",
            display_name: profile?.display_name ?? null,
          },
        }),
      },
    );

    // Log a pending transaction row via admin so we can reconcile in the webhook.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payment_transactions").insert({
      user_id: userId,
      direction: "collection",
      purpose: "deposit",
      amount_kes: data.amountKes,
      currency: "KES",
      provider: "paystack",
      provider_reference: res.reference ?? reference,
      provider_status: "pending",
      channel: "mpesa",
      mpesa_phone: data.phone,
    });

    return {
      reference: res.reference ?? reference,
      status: res.status,
      message:
        res.display_text ??
        "Check your phone for the M-Pesa prompt and enter your PIN to complete the deposit.",
    };
  });

/**
 * Admin-only: send a queued payout to M-Pesa via Paystack Transfer.
 * Called from the admin console after reviewing the request.
 */
export const sendMpesaPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { payoutId: string }) => {
    if (!input?.payoutId) throw new Error("Missing payout id.");
    return { payoutId: String(input.payoutId) };
  })
  .handler(async ({ data, context }) => {
    // Authorise: caller must be admin.
    const { data: adminRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payout, error } = await supabaseAdmin
      .from("payout_requests")
      .select("id, user_id, amount_kes, mpesa_phone, status")
      .eq("id", data.payoutId)
      .single();
    if (error || !payout) throw new Error("Payout not found.");
    if (payout.status !== "pending" && payout.status !== "approved") {
      throw new Error(`Cannot send a payout in status: ${payout.status}`);
    }

    const phone = normalizeMpesaPhone(payout.mpesa_phone);

    // 1. Create recipient
    const recipient = await paystack<{ recipient_code: string }>("/transferrecipient", {
      method: "POST",
      body: JSON.stringify({
        type: "mobile_money",
        name: `Forecast Arena user ${payout.user_id.slice(0, 8)}`,
        account_number: phone,
        bank_code: "MPESA",
        currency: "KES",
      }),
    });

    // 2. Initiate transfer
    const transferRef = `fa_pay_${payout.id.slice(0, 8)}_${Date.now()}`;
    const transfer = await paystack<{ reference: string; status: string }>("/transfer", {
      method: "POST",
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(Number(payout.amount_kes) * 100),
        currency: "KES",
        recipient: recipient.recipient_code,
        reference: transferRef,
        reason: "Forecast Arena payout",
      }),
    });

    await supabaseAdmin.from("payment_transactions").insert({
      user_id: payout.user_id,
      direction: "payout",
      purpose: "withdrawal",
      amount_kes: payout.amount_kes,
      currency: "KES",
      provider: "paystack",
      provider_reference: transfer.reference ?? transferRef,
      provider_status: "processing",
      channel: "mpesa",
      mpesa_phone: phone,
      recipient_code: recipient.recipient_code,
      payout_request_id: payout.id,
    });

    await supabaseAdmin
      .from("payout_requests")
      .update({ status: "processing" })
      .eq("id", payout.id);

    return { reference: transfer.reference, status: transfer.status };
  });
