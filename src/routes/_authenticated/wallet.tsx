import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Forecast Arena" },
      { name: "description", content: "Your balance, rewards, and M-Pesa payouts." },
    ],
  }),
  component: () => (
    <AppShell>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Wallet</h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-card p-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Available balance
          </p>
          <p className="mt-2 font-mono-data text-5xl text-forecast-gold">
            KES 1,240
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Payouts to M-Pesa. Wired in Phase 5 (Wallet, Rewards & Payments).
          </p>
        </div>
      </section>
    </AppShell>
  ),
});
