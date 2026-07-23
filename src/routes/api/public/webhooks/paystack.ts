import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Paystack webhook handler.
 *
 * Robustness rules:
 *  - HMAC SHA-512 verification against the raw body (never parse first).
 *  - Any unrecognised event / unknown reference / handler error logs and
 *    returns 200. Paystack retries 5xx indefinitely and the Econsult fan-out
 *    would amplify that.
 *  - Foreign refs (not starting with `fa_`) are ignored — Econsult may forward
 *    stray events during the fan-out window.
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
          // Never 5xx on bad JSON — Paystack would retry forever.
          console.error("[paystack] bad JSON body");
          return new Response("ok", { status: 200 });
        }

        const ref = event?.data?.reference ?? "";
        // Ignore events that don't belong to Forecast Arena. The Econsult fan-out
        // forwards by prefix, but stray events must never touch the ledger.
        if (!ref.startsWith("fa_")) {
          console.log("[paystack] ignoring foreign event", event.event, ref);
          return new Response("ok", { status: 200 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Best-effort audit log on the transaction row (if it exists yet).
          try {
            await supabaseAdmin
              .from("payment_transactions")
              .update({
                metadata: { last_event: event.event, at: new Date().toISOString() },
              } as any)
              .eq("provider_reference", ref);
          } catch (logErr) {
            console.error("[paystack] audit update failed", logErr);
          }

          switch (event.event) {
            case "charge.success": {
              // Deposits are dormant in the current product. Log and ack —
              // do NOT touch the ledger. If/when staked markets ship, revive
              // the record_deposit call here behind a feature flag.
              console.log("[paystack] charge.success ignored (deposits disabled)", ref);
              break;
            }

            case "transfer.success":
            case "transfer.failed":
            case "transfer.reversed": {
              const { data: tx } = await supabaseAdmin
                .from("payment_transactions")
                .select("payout_request_id")
                .eq("provider_reference", ref)
                .maybeSingle();
              if (!tx?.payout_request_id) {
                console.warn("[paystack] transfer event with no matching tx row", ref);
                break;
              }

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
              console.log("[paystack] unhandled event", event.event, ref);
              break;
          }
        } catch (err) {
          console.error("[paystack] handler error", err);
          // Fall through to 200 so Paystack does not retry a poison payload.
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
