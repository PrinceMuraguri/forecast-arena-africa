import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getWallet, requestPayout } from "@/lib/wallet.functions";
import { confirmMpesaVerification, normalizeKenyanPhone } from "@/lib/verification.functions";

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
  new Date(s).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });

function maskPhone(p: string): string {
  if (!p) return "";
  const tail = p.slice(-4);
  return `•••• ${tail}`;
}

function WalletPage() {
  const { data } = useSuspenseQuery(walletQuery());
  const qc = useQueryClient();

  // Realtime: refresh when balance changes.
  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      ch = supabase
        .channel(`wallet:${u.user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "wallet_balances", filter: `user_id=eq.${u.user.id}` },
          () => qc.invalidateQueries({ queryKey: ["wallet"] }),
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "ledger_entries", filter: `user_id=eq.${u.user.id}` },
          () => qc.invalidateQueries({ queryKey: ["wallet"] }),
        )
        .subscribe();
    })();
    return () => {
      if (ch) supabase.removeChannel(ch);
    };
  }, [qc]);

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Wallet</h1>
        <p className="mt-2 text-muted-foreground">
          Earn from forecasts. Cash out to M-Pesa.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card label="Available" value={fmtKes(data.balance.available_kes)} accent="text-forecast-gold" />
          <Card label="Pending withdrawal" value={fmtKes(data.balance.pending_payout_kes)} accent="text-live-cyan" />
          <Card
            label="Lifetime earned"
            value={fmtKes(data.balance.lifetime_rewards_kes + data.balance.lifetime_winnings_kes)}
            accent="text-signal-blue"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <WithdrawPanel snapshot={data} />

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
                        {fmtDate(p.created_at)} · {maskPhone(p.mpesa_phone)}
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
            <p className="mt-4 text-sm text-muted-foreground">
              Nothing here yet. Take your first poll and watch this fill up.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {data.transactions.slice(0, 15).map((t) => {
                const amt = Number(t.amount_kes);
                const debit = amt < 0;
                return (
                  <li key={t.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm">{t.memo || labelForType(t.entry_type)}</p>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {labelForType(t.entry_type)} · {fmtDate(t.created_at)}
                      </p>
                    </div>
                    <p
                      className={`font-mono-data text-sm ${
                        debit ? "text-muted-foreground" : "text-forecast-gold"
                      }`}
                    >
                      {debit ? "-" : "+"}
                      {fmtKes(Math.abs(amt))}
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

function WithdrawPanel({ snapshot }: { snapshot: Awaited<ReturnType<typeof getWallet>> }) {
  const qc = useQueryClient();
  const submit = useServerFn(requestPayout);
  const confirm = useServerFn(confirmMpesaVerification);

  const [amount, setAmount] = useState("");
  const [phoneStage, setPhoneStage] = useState<"idle" | "code">(snapshot.mpesaVerified ? "idle" : "idle");
  const [phone, setPhone] = useState(snapshot.mpesaPhone ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [wantsChange, setWantsChange] = useState(false);

  const verified = snapshot.mpesaVerified && !wantsChange;

  const payoutMut = useMutation({
    mutationFn: (vars: { amountKes: number }) => submit({ data: vars }),
    onSuccess: () => {
      toast.success("Payout request submitted. We'll text you on M-Pesa.");
      setAmount("");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function sendCode() {
    const msisdn = normalizeKenyanPhone(phone);
    if (!/^254[17]\d{8}$/.test(msisdn)) {
      toast.error("Enter a valid Kenyan number (07XXXXXXXX).");
      return;
    }
    setBusy(true);
    // Update the user's phone → Supabase sends OTP for phone change.
    const { error } = await supabase.auth.updateUser({ phone: msisdn });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPhoneStage("code");
    toast.success("We sent a 6-digit code to your phone.");
  }

  async function verifyCode() {
    const msisdn = normalizeKenyanPhone(phone);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: msisdn,
      token: code,
      type: "phone_change",
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    try {
      await confirm({ data: { phone: msisdn } });
      toast.success("M-Pesa number verified.");
      setPhoneStage("idle");
      setWantsChange(false);
      setCode("");
      qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="rounded-2xl border border-white/10 bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!verified) {
          toast.error("Verify your M-Pesa number first.");
          return;
        }
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) {
          toast.error("Enter a valid amount.");
          return;
        }
        payoutMut.mutate({ amountKes: amt });
      }}
    >
      <h2 className="font-display text-lg font-semibold">Cash out to M-Pesa</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Minimum KES 100. Sent to your verified M-Pesa number, usually within 24 hours.
      </p>

      {verified ? (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-background px-3 py-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Verified number</p>
            <p className="font-mono-data text-sm">{maskPhone(snapshot.mpesaPhone ?? "")}</p>
          </div>
          <button
            type="button"
            className="text-xs text-live-cyan underline"
            onClick={() => {
              setWantsChange(true);
              setPhoneStage("idle");
              setPhone("");
            }}
          >
            Change number
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3 rounded-lg border border-arena-coral/30 bg-arena-coral/5 p-3">
          <p className="text-xs font-medium text-arena-coral">
            Verify your M-Pesa number to withdraw
          </p>
          {phoneStage === "idle" ? (
            <>
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
              <Button type="button" onClick={sendCode} disabled={busy} className="w-full">
                {busy ? "Sending code…" : "Send verification code"}
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="code">6-digit code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="mt-1 bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setPhoneStage("idle")}>
                  Back
                </Button>
                <Button type="button" onClick={verifyCode} disabled={busy || code.length !== 6} className="flex-1">
                  {busy ? "Verifying…" : "Verify"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

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
            disabled={!verified}
            className="mt-1 bg-background"
          />
        </div>
        <Button
          type="submit"
          disabled={payoutMut.isPending || !verified || snapshot.balance.available_kes <= 0}
          className="w-full bg-arena-coral hover:bg-arena-coral/90"
        >
          {payoutMut.isPending ? "Submitting…" : "Request payout"}
        </Button>
        {snapshot.balance.available_kes <= 0 ? (
          <p className="text-xs text-muted-foreground">
            Your available balance is KES 0. Complete a forecast in the Arena to earn.
          </p>
        ) : null}
      </div>
    </form>
  );
}

function labelForType(t: string) {
  switch (t) {
    case "survey_reward":
      return "Survey reward";
    case "prediction_winning":
      return "Forecast winnings";
    case "referral_bonus":
      return "Referral bonus";
    case "deposit":
      return "Deposit";
    case "stake_debit":
      return "Stake";
    case "stake_refund":
      return "Stake refund";
    case "payout_debit":
      return "M-Pesa payout";
    case "payout_reversal":
      return "Payout reversed";
    case "adjustment":
      return "Adjustment";
    default:
      return t;
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

function Card({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono-data text-3xl ${accent}`}>{value}</p>
    </div>
  );
}
