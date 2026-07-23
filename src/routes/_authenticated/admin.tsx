import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  adminCheck,
  adminListMarkets,
  adminListPayouts,
  adminResolveMarket,
  adminSetPayoutStatus,
  adminCreateMarket,
} from "@/lib/admin.functions";
import { processPayoutBatch, sendMpesaPayout } from "@/lib/paystack.functions";
import { listCategories } from "@/lib/arena.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Forecast Arena" }] }),
  beforeLoad: async () => {
    const res = await adminCheck();
    if (!res.isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminPage,
});

function AdminPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Admin console</h1>
        <p className="mt-2 text-muted-foreground">
          Resolve markets, manage payouts, and publish new questions.
        </p>

        <Tabs defaultValue="markets" className="mt-8">
          <TabsList className="bg-white/5">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="create">Create market</TabsTrigger>
          </TabsList>
          <TabsContent value="markets" className="mt-6"><MarketsPanel /></TabsContent>
          <TabsContent value="payouts" className="mt-6"><PayoutsPanel /></TabsContent>
          <TabsContent value="create" className="mt-6"><CreateMarketPanel /></TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
}

function MarketsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "markets"],
    queryFn: () => adminListMarkets(),
  });
  const resolve = useMutation({
    mutationFn: (input: { marketId: string; winningOutcomeId: string; notes?: string }) =>
      adminResolveMarket({ data: input }),
    onSuccess: () => {
      toast.success("Market resolved and rewards credited");
      qc.invalidateQueries({ queryKey: ["admin", "markets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data) return <div className="text-white/60">Loading…</div>;

  return (
    <div className="space-y-4">
      {data.map((m) => (
        <div key={m.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-semibold">{m.title}</h3>
                <Badge variant="outline" className="border-white/20 text-white/70">
                  {m.status}
                </Badge>
              </div>
              <p className="text-xs text-white/60">
                /{m.slug} · KES {m.prize_pool_kes.toLocaleString()} pool · {m.predictions_count} forecasts
              </p>
            </div>
            {m.status !== "resolved" ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/60">Resolve as:</span>
                {m.outcomes.map((o) => (
                  <Button
                    key={o.id}
                    size="sm"
                    variant="outline"
                    disabled={resolve.isPending}
                    onClick={() => {
                      if (confirm(`Resolve "${m.title}" with winner: ${o.label}? This credits wallets.`)) {
                        resolve.mutate({ marketId: m.id, winningOutcomeId: o.id });
                      }
                    }}
                    className="border-live-cyan/40 bg-live-cyan/10 text-live-cyan hover:bg-live-cyan/20"
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-forecast-gold">
                Winner: {m.outcomes.find((o) => o.is_winning)?.label ?? "—"}
              </div>
            )}
          </div>
        </div>
      ))}
      {data.length === 0 && <div className="text-white/60">No markets yet.</div>}
    </div>
  );
}

function PayoutsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "payouts"],
    queryFn: () => adminListPayouts(),
  });
  const setStatus = useMutation({
    mutationFn: (input: {
      payoutId: string;
      status: "pending" | "approved" | "paid" | "rejected";
      notes?: string;
    }) => adminSetPayoutStatus({ data: input }),
    onSuccess: () => {
      toast.success("Payout updated");
      qc.invalidateQueries({ queryKey: ["admin", "payouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendOne = useMutation({
    mutationFn: (payoutId: string) => sendMpesaPayout({ data: { payoutId } }),
    onSuccess: () => {
      toast.success("Transfer dispatched");
      qc.invalidateQueries({ queryKey: ["admin", "payouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const batch = useMutation({
    mutationFn: () => processPayoutBatch({ data: {} }),
    onSuccess: (res: {
      batchId: string;
      attempted: number;
      dispatched: number;
      failed: number;
    }) => {
      toast.success(
        `Batch ${res.batchId.slice(0, 8)}: ${res.dispatched}/${res.attempted} dispatched, ${res.failed} failed`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "payouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data) return <div className="text-white/60">Loading…</div>;

  const pending = data.filter((p) => p.status === "pending");
  const pendingTotal = pending.reduce((s, p) => s + Number(p.amount_kes), 0);

  // Group by batch_id for a lightweight batch-history view.
  const batches = new Map<string, { count: number; total: number }>();
  for (const p of data) {
    const bid = (p as { batch_id?: string | null }).batch_id;
    if (!bid) continue;
    const cur = batches.get(bid) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += Number(p.amount_kes);
    batches.set(bid, cur);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-white">
            <span className="font-semibold">{pending.length}</span> pending ·{" "}
            <span className="font-mono-data text-forecast-gold">
              KES {pendingTotal.toLocaleString()}
            </span>
          </p>
          <p className="text-xs text-white/50">
            Batch dispatch chunks in groups of 100 to Paystack. Only the webhook marks each as paid.
          </p>
        </div>
        <Button
          disabled={batch.isPending || pending.length === 0}
          onClick={() => {
            if (
              window.confirm(
                `Dispatch ${pending.length} pending payouts totalling KES ${pendingTotal.toLocaleString()}?`,
              )
            ) {
              batch.mutate();
            }
          }}
        >
          {batch.isPending ? "Dispatching…" : `Process all pending`}
        </Button>
      </div>

      <div className="space-y-3">
        {data.map((p) => {
          const row = p as typeof p & {
            batch_id?: string | null;
            failure_reason?: string | null;
            provider_reference?: string | null;
            provider_status?: string | null;
          };
          return (
            <div key={p.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {p.profile?.display_name ?? p.user_id.slice(0, 8)}
                    </span>
                    <Badge variant="outline" className="border-white/20 text-white/70">
                      {p.status}
                    </Badge>
                    {row.provider_status && (
                      <Badge variant="outline" className="border-white/10 text-white/50">
                        {row.provider_status}
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono-data text-sm text-forecast-gold">
                    KES {p.amount_kes.toLocaleString()} → {p.mpesa_phone}
                  </p>
                  <p className="text-xs text-white/50">
                    {new Date(p.created_at).toLocaleString()}
                    {row.provider_reference && ` · ${row.provider_reference}`}
                  </p>
                  {row.failure_reason && (
                    <p className="mt-1 text-xs text-arena-coral">{row.failure_reason}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {p.status === "pending" && (
                    <Button
                      size="sm"
                      disabled={sendOne.isPending}
                      onClick={() => sendOne.mutate(p.id)}
                    >
                      Send now
                    </Button>
                  )}
                  {p.status !== "paid" && p.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={setStatus.isPending}
                      onClick={() =>
                        setStatus.mutate({
                          payoutId: p.id,
                          status: "rejected",
                          notes: "manually rejected",
                        })
                      }
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      Reject & refund
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {data.length === 0 && <div className="text-white/60">No payout requests yet.</div>}
      </div>

      {batches.size > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <h3 className="font-display text-sm font-semibold text-white">Batch history</h3>
          <ul className="mt-2 divide-y divide-white/5 text-xs text-white/70">
            {Array.from(batches.entries()).map(([bid, info]) => (
              <li key={bid} className="flex items-center justify-between py-2">
                <span className="font-mono-data">{bid.slice(0, 8)}</span>
                <span>
                  {info.count} · KES {info.total.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


function CreateMarketPanel() {
  const qc = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });
  const [form, setForm] = useState({
    slug: "",
    title: "",
    question: "",
    summary: "",
    sponsorName: "",
    categoryId: "",
    prizePoolKes: 0,
    closesAt: "",
    outcomes: "Yes\nNo",
    status: "open" as "draft" | "open",
  });
  const create = useMutation({
    mutationFn: () =>
      adminCreateMarket({
        data: {
          categoryId: form.categoryId || null,
          slug: form.slug,
          title: form.title,
          question: form.question,
          summary: form.summary,
          sponsorName: form.sponsorName,
          prizePoolKes: form.prizePoolKes,
          closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
          outcomes: form.outcomes.split("\n").map((s) => s.trim()).filter(Boolean),
          status: form.status,
        },
      }),
    onSuccess: () => {
      toast.success("Market created");
      qc.invalidateQueries({ queryKey: ["admin", "markets"] });
      setForm((f) => ({ ...f, slug: "", title: "", question: "", summary: "" }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="grid max-w-3xl gap-4 rounded-lg border border-white/10 bg-white/5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-white/80">Slug</Label>
          <Input
            required
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="kes-usd-end-of-month"
            className="bg-white/5 text-white"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-white/80">Category</Label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="h-9 rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white"
          >
            <option value="">— none —</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id} className="text-black">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-white/80">Title</Label>
        <Input
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="bg-white/5 text-white"
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-white/80">Question</Label>
        <Input
          required
          value={form.question}
          onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
          placeholder="Will KES/USD close above 130 on …?"
          className="bg-white/5 text-white"
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-white/80">Summary</Label>
        <Textarea
          value={form.summary}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          className="bg-white/5 text-white"
        />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <div className="grid gap-1.5">
          <Label className="text-white/80">Sponsor</Label>
          <Input
            value={form.sponsorName}
            onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
            className="bg-white/5 text-white"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-white/80">Prize pool (KES)</Label>
          <Input
            type="number"
            min={0}
            value={form.prizePoolKes}
            onChange={(e) => setForm((f) => ({ ...f, prizePoolKes: Number(e.target.value) }))}
            className="bg-white/5 text-white"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-white/80">Closes at</Label>
          <Input
            type="datetime-local"
            value={form.closesAt}
            onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))}
            className="bg-white/5 text-white"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-white/80">Outcomes (one per line, in order)</Label>
        <Textarea
          rows={4}
          value={form.outcomes}
          onChange={(e) => setForm((f) => ({ ...f, outcomes: e.target.value }))}
          className="bg-white/5 font-mono text-white"
        />
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-white/80">Status</Label>
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "open" }))}
          className="h-9 rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white"
        >
          <option value="draft" className="text-black">Draft</option>
          <option value="open" className="text-black">Open</option>
        </select>
      </div>

      <Button
        type="submit"
        disabled={create.isPending}
        className="justify-self-start bg-arena-coral text-white hover:bg-arena-coral/90"
      >
        {create.isPending ? "Creating…" : "Create market"}
      </Button>
    </form>
  );
}
