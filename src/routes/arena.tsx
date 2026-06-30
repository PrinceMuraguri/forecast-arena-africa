import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ProbabilityOrb } from "@/components/probability-orb";
import { listArenaMarkets, type ArenaMarket } from "@/lib/arena.functions";

const marketsQuery = () =>
  queryOptions({
    queryKey: ["arena", "markets"],
    queryFn: () => listArenaMarkets(),
  });

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [
      { title: "The Arena — Forecast Arena" },
      {
        name: "description",
        content:
          "Step into the Arena. Real questions. Real rewards. Real outcomes — updating live.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(marketsQuery()),
  component: ArenaPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">The Arena is catching its breath.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p>No markets yet.</p>
      </div>
    </AppShell>
  ),
});

function ArenaPage() {
  const { data: markets } = useSuspenseQuery(marketsQuery());
  const router = useRouter();

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-live-cyan">
          The Arena
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
          Step into the Arena.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Real questions. Real rewards. Real outcomes — updating live.
        </p>

        {markets.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-white/10 bg-card p-10 text-center">
            <p className="font-display text-lg">No open markets right now.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              New questions drop weekly. Check back soon.
            </p>
            <button
              onClick={() => router.invalidate()}
              className="mt-4 text-xs uppercase tracking-widest text-live-cyan hover:underline"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {markets.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function MarketCard({ market }: { market: ArenaMarket }) {
  const yes = market.outcomes.find((o) => /^yes$/i.test(o.label));
  const probability = Math.round(((yes?.implied_probability ?? 0.5) as number) * 100);
  const closes = market.closes_at ? new Date(market.closes_at) : null;
  const countdown = closes ? formatCountdown(closes) : "—";

  return (
    <article className="rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-live-cyan/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {market.sponsor_name ? `Sponsored · ${market.sponsor_name}` : market.category?.name ?? "Market"}
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug">
            {market.title}
          </h3>
        </div>
        <ProbabilityOrb probability={probability} size={88} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <div className="text-muted-foreground">Prize</div>
          <div className="font-mono-data text-forecast-gold">
            KES {market.prize_pool_kes.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <div className="text-muted-foreground">Closes</div>
          <div className="font-mono-data text-live-cyan">{countdown}</div>
        </div>
      </div>
    </article>
  );
}

function formatCountdown(target: Date): string {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}
