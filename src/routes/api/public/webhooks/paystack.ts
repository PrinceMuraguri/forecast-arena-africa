import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Paystack webhook handler.
 *
 * Paystack signs the raw request body with HMAC SHA-512 using your secret key
 * and sends the signature in the `x-paystack-signature` header. We verify that
 * signature before touching the ledger.
 *
 * Configure the webhook URL as:
 *   https://<your-domain>/api/public/webhooks/paystack
 */
export const Route = createFileRoute("/api/public/webhooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return new Response("Payments not configured", { status: 503 });

        const signature = request.headers.get("x-paystack-signature") ?? "";
        const raw = await request.text();
        const expected = createHmac("sha512", secret).update(raw).digest("hex");

        const a = Buffer.from(signature, "utf8");
        const b = Buffer.from(expected, "utf8");
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event: string;
          data: {
            reference?: string;
            amount?: number;
            currency?: string;
            status?: string;
            gateway_response?: string;
            metadata?: { user_id?: string; purpose?: string } | string;
          };
        };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          switch (event.event) {
            case "charge.success": {
              const ref = event.data.reference;
              if (!ref) break;

              // Prefer the pending row we created at initiation; fall back to metadata.
              const { data: pending } = await supabaseAdmin
                .from("payment_transactions")
                .select("user_id, amount_kes")
                .eq("provider_reference", ref)
                .maybeSingle();

              let userId = pending?.user_id as string | undefined;
              let amountKes = pending?.amount_kes ? Number(pending.amount_kes) : undefined;

              if (!userId) {
                const meta =
                  typeof event.data.metadata === "string"
                    ? (JSON.parse(event.data.metadata) as { user_id?: string })
                    : event.data.metadata;
                userId = meta?.user_id;
              }
              if (!amountKes && event.data.amount) {
                amountKes = Number(event.data.amount) / 100;
              }
              if (!userId || !amountKes) {
                console.error("[paystack] charge.success missing user/amount", ref);
                break;
              }

              const { error } = await (supabaseAdmin as any)
                .schema("app_private")
                .rpc("record_deposit", {
                  p_user_id: userId,
                  p_amount_kes: amountKes,
                  p_provider_reference: ref,
                  p_channel: "mpesa",
                });
              if (error) console.error("[paystack] record_deposit failed", error);
              break;
            }

            case "transfer.success":
            case "transfer.failed":
            case "transfer.reversed": {
              const ref = event.data.reference;
              if (!ref) break;
              const { data: tx } = await supabaseAdmin
                .from("payment_transactions")
                .select("payout_request_id")
                .eq("provider_reference", ref)
                .maybeSingle();
              if (!tx?.payout_request_id) break;

              const status = event.event === "transfer.success" ? "paid" : "failed";
              const { error } = await (supabaseAdmin as any)
                .schema("app_private")
                .rpc("finalize_payout", {
                  p_payout_id: tx.payout_request_id,
                  p_status: status,
                  p_provider_reference: ref,
                  p_failure_reason:
                    status === "failed" ? event.data.gateway_response ?? event.event : null,
                });
              if (error) console.error("[paystack] finalize_payout failed", error);
              break;
            }

            default:
              // Ignore other events; still ack so Paystack stops retrying.
              break;
          }
        } catch (err) {
          console.error("[paystack] handler error", err);
          // Return 200 anyway so Paystack doesn't retry a poison payload forever.
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
