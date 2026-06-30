import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWallet, requestPayout } from "@/lib/wallet.functions";

const walletQuery = () =>
  queryOptions({ queryKey: ["wallet"], queryFn: () => getWallet() });

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Forecast Arena" },
      { name: "description", content: "Your balance, rewards, and M-Pesa payouts." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(walletQuery());
  },
  component: WalletPage,
});

const fmtKes = (n: number) =>
  `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function WalletPage() {
  const { data } = useSuspenseQuery(walletQuery());
  const qc = useQueryClient();
  const submit = useServerFn(requestPayout);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");

  const mutation = useMutation({
    mutationFn: (vars: { amountKes: number; mpesaPhone: string }) =>
      submit({ data: vars }),
    onSuccess: () => {
      toast.success("Payout request submitted. We'll text you on M-Pesa.");
      setAmount("");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Wallet</h1>
        <p className="mt-2 text-muted-foreground">
          Earn from forecasts. Cash out to M-Pesa.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card label="Available" value={fmtKes(data.availableKes)} accent="text-forecast-gold" />
          <Card label="Lifetime earned" value={fmtKes(data.lifetimeEarnedKes)} accent="text-live-cyan" />
          <Card label="Pending payout" value={fmtKes(data.pendingPayoutKes)} accent="text-signal-blue" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form
            className="rounded-2xl border border-white/10 bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const amt = Number(amount);
              if (!Number.isFinite(amt) || amt <= 0) {
                toast.error("Enter a valid amount.");
                return;
              }
              mutation.mutate({ amountKes: amt, mpesaPhone: phone });
            }}
          >
            <h2 className="font-display text-lg font-semibold">Cash out to M-Pesa</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Minimum KES 100. Sent to your M-Pesa number, usually within 24 hours.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={100}
                  step={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="mt-1 bg-background"
                />
              </div>
              <div>
                <Label htmlFor="phone">M-Pesa phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="mt-1 bg-background"
                />
              </div>
              <Button
                type="submit"
                disabled={mutation.isPending || data.availableKes <= 0}
                className="w-full bg-arena-coral hover:bg-arena-coral/90"
              >
                {mutation.isPending ? "Submitting…" : "Request payout"}
              </Button>
              {data.availableKes <= 0 ? (
                <p className="text-xs text-muted-foreground">
                  Your available balance is KES 0. Complete a forecast in the Arena to earn.
                </p>
              ) : null}
            </div>
          </form>

          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Payout history</h2>
            {data.payouts.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No payout requests yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {data.payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-mono-data text-sm">{fmtKes(Number(p.amount_kes))}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(p.created_at)} · {p.mpesa_phone}
                      </p>
                    </div>
                    <StatusPill status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Recent activity</h2>
          {data.transactions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {data.transactions.slice(0, 15).map((t) => {
                const debit = t.kind === "payout";
                return (
                  <li key={t.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm">
                        {t.memo ?? labelForKind(t.kind)}
                      </p>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {t.kind} · {fmtDate(t.created_at)}
                      </p>
                    </div>
                    <p
                      className={`font-mono-data text-sm ${
                        debit ? "text-muted-foreground" : "text-forecast-gold"
                      }`}
                    >
                      {debit ? "-" : "+"}
                      {fmtKes(Number(t.amount_kes))}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function labelForKind(kind: string) {
  switch (kind) {
    case "reward":
      return "Forecast reward";
    case "bonus":
      return "Bonus";
    case "adjustment":
      return "Adjustment";
    case "payout":
      return "M-Pesa payout";
    case "refund":
      return "Refund";
    default:
      return kind;
  }
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "border-live-cyan/40 text-live-cyan",
    approved: "border-signal-blue/40 text-signal-blue",
    paid: "bg-forecast-gold/15 text-forecast-gold border-transparent",
    rejected: "bg-muted text-muted-foreground border-transparent",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
        map[status] ?? "border-white/20 text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 font-mono-data text-3xl ${accent}`}>{value}</p>
    </div>
  );
}
