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

// Resolve or create the Paystack transfer recipient for a user, caching the code
// on profiles.paystack_recipient_code to avoid recreating it per payout.
async function resolveRecipient(
  supabaseAdmin: any,
  userId: string,
  mpesaPhone: string,
): Promise<string> {
  const phone = normalizeMpesaPhone(mpesaPhone);
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("paystack_recipient_code")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.paystack_recipient_code) return profile.paystack_recipient_code as string;

  const recipient = await paystack<{ recipient_code: string }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "mobile_money",
      name: `Forecast Arena user ${userId.slice(0, 8)}`,
      account_number: phone,
      bank_code: "MPESA",
      currency: "KES",
    }),
  });
  await supabaseAdmin
    .from("profiles")
    .update({ paystack_recipient_code: recipient.recipient_code })
    .eq("id", userId);
  return recipient.recipient_code;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: adminRow } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!adminRow) throw new Error("Forbidden");
}

/**
 * Admin-only: send a single queued payout to M-Pesa via Paystack Transfer.
 */
export const sendMpesaPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { payoutId: string }) => {
    if (!input?.payoutId) throw new Error("Missing payout id.");
    return { payoutId: String(input.payoutId) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

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
    const recipientCode = await resolveRecipient(supabaseAdmin, payout.user_id, phone);

    const transferRef = `fa_pay_${payout.id.slice(0, 8)}_${Date.now()}`;
    const transfer = await paystack<{ reference: string; status: string }>("/transfer", {
      method: "POST",
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(Number(payout.amount_kes) * 100),
        currency: "KES",
        recipient: recipientCode,
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
      recipient_code: recipientCode,
      payout_request_id: payout.id,
    });

    await supabaseAdmin
      .from("payout_requests")
      .update({ status: "approved" })
      .eq("id", payout.id);

    return { reference: transfer.reference, status: transfer.status };
  });

const CHUNK_SIZE = 100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Admin-only: dispatch a batch of pending payout requests to Paystack.
 * - If payoutRequestIds is omitted, drains up to `limit` oldest pending requests.
 * - Chunks into groups of 100 (Paystack's bulk-transfer limit).
 * - Per-item failures are refunded via set_payout_status('rejected', reason) and
 *   do not abort the batch.
 * - Marks each dispatched request as 'approved'. The webhook is the only path
 *   that moves a request to 'paid' (via finalize_payout -> settle_payout).
 */
export const processPayoutBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { payoutRequestIds?: string[]; limit?: number } = {}) => ({
    payoutRequestIds: Array.isArray(input.payoutRequestIds)
      ? input.payoutRequestIds.map(String)
      : undefined,
    limit: Math.min(Math.max(Number(input.limit) || 100, 1), 500),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Load the target payout rows.
    let query = supabaseAdmin
      .from("payout_requests")
      .select("id, user_id, amount_kes, mpesa_phone, status");

    if (data.payoutRequestIds && data.payoutRequestIds.length) {
      query = query.in("id", data.payoutRequestIds);
    } else {
      query = query
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(data.limit);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const targets = (rows ?? []).filter(
      (r) => r.status === "pending" || r.status === "approved",
    );

    const batchId = crypto.randomUUID();
    const errors: Array<{ payoutId: string; message: string }> = [];
    let dispatched = 0;

    // 2. Process in chunks of 100 with a small delay between chunks.
    for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
      const chunk = targets.slice(i, i + CHUNK_SIZE);

      for (const payout of chunk) {
        const transferRef = `fa_pay_${payout.id.slice(0, 8)}_${Date.now()}`;
        try {
          const phone = normalizeMpesaPhone(payout.mpesa_phone);
          const recipientCode = await resolveRecipient(
            supabaseAdmin,
            payout.user_id,
            phone,
          );

          // Log the intent BEFORE dispatch so nothing is untracked on crash.
          await supabaseAdmin.from("payment_transactions").insert({
            user_id: payout.user_id,
            direction: "payout",
            purpose: "withdrawal",
            amount_kes: payout.amount_kes,
            currency: "KES",
            provider: "paystack",
            provider_reference: transferRef,
            provider_status: "processing",
            channel: "mpesa",
            mpesa_phone: phone,
            recipient_code: recipientCode,
            payout_request_id: payout.id,
            batch_id: batchId,
          });

          const transfer = await paystack<{ reference: string; status: string }>(
            "/transfer",
            {
              method: "POST",
              body: JSON.stringify({
                source: "balance",
                amount: Math.round(Number(payout.amount_kes) * 100),
                currency: "KES",
                recipient: recipientCode,
                reference: transferRef,
                reason: "Forecast Arena payout",
              }),
            },
          );

          await supabaseAdmin
            .from("payout_requests")
            .update({ status: "approved" })
            .eq("id", payout.id);

          if (transfer.reference && transfer.reference !== transferRef) {
            await supabaseAdmin
              .from("payment_transactions")
              .update({ provider_reference: transfer.reference })
              .eq("provider_reference", transferRef);
          }

          dispatched += 1;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          errors.push({ payoutId: payout.id, message });

          // Refund the reservation so funds return to available_kes.
          try {
            await supabaseAdmin.rpc("set_payout_status", {
              p_payout_id: payout.id,
              p_new_status: "rejected",
              p_admin_notes: `batch dispatch failed: ${message.slice(0, 200)}`,
            });
          } catch (refundErr) {
            console.error("[batch] refund failed", payout.id, refundErr);
          }

          await supabaseAdmin
            .from("payment_transactions")
            .update({
              provider_status: "failed",
              failure_reason: message.slice(0, 500),
            })
            .eq("provider_reference", transferRef);
        }
      }

      if (i + CHUNK_SIZE < targets.length) await sleep(500);
    }

    return {
      batchId,
      attempted: targets.length,
      dispatched,
      failed: errors.length,
      errors,
    };
  });
