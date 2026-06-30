import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/lib/dashboard.functions";
import { useResolutionToasts } from "@/lib/use-resolution-toasts";

const dashboardQuery = () =>
  queryOptions({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(),
  });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Forecast Arena" },
      { name: "description", content: "Your panel, your earnings, your forecasts." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(dashboardQuery());
  },
  component: DashboardPage,
});

function fmtKes(n: number) {
  return `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function DashboardPage() {
  useResolutionToasts();
  const { data } = useSuspenseQuery(dashboardQuery());
  const { stats, recent } = data;

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold md:text-4xl">
          Welcome to the Arena.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your panel, your earnings, your open forecasts — all in one place.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat label="Wallet" value={fmtKes(stats.balanceKes)} tone="gold" />
          <Stat label="Open forecasts" value={String(stats.openForecasts)} tone="cyan" />
          <Stat
            label="Accuracy"
            value={stats.accuracyPct === null ? "—" : `${stats.accuracyPct}%`}
            tone="blue"
            sub={`${stats.correct}/${stats.resolvedForecasts} resolved`}
          />
          <Stat
            label="Brier score"
            value={stats.brierScore === null ? "—" : stats.brierScore.toFixed(3)}
            tone="coral"
            sub="lower is better"
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Recent forecasts</h2>
              <Button asChild size="sm" variant="ghost">
                <Link to="/arena">Find a market →</Link>
              </Button>
            </div>
            {recent.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No forecasts yet. Step into the Arena and call your first market.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/arena/$slug"
                        params={{ slug: r.market?.slug ?? "" }}
                        className="block truncate text-sm font-medium hover:text-arena-coral"
                      >
                        {r.market?.title ?? "Untitled market"}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Called <span className="text-foreground">{r.outcome?.label}</span>{" "}
                        @ {r.confidence}% confidence
                      </p>
                    </div>
                    <ResultPill row={r} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Next up</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a poll. Finish it. Earn instantly. Call what's next.
            </p>
            <Button asChild className="mt-4 w-full bg-arena-coral hover:bg-arena-coral/90">
              <Link to="/arena">Enter the Arena</Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full border-white/20">
              <Link to="/wallet">Manage wallet</Link>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Lifetime earned:{" "}
              <span className="font-mono-data text-forecast-gold">
                {fmtKes(stats.totalEarnedKes)}
              </span>
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function ResultPill({
  row,
}: {
  row: { is_resolved: boolean; outcome: { is_winning: boolean | null } | null };
}) {
  if (!row.is_resolved) {
    return (
      <span className="ml-3 shrink-0 rounded-full border border-live-cyan/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-live-cyan">
        Open
      </span>
    );
  }
  const won = row.outcome?.is_winning === true;
  return (
    <span
      className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
        won
          ? "bg-forecast-gold/15 text-forecast-gold"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {won ? "Correct" : "Missed"}
    </span>
  );
}

function Stat({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone: "gold" | "cyan" | "blue" | "coral";
  sub?: string;
}) {
  const color =
    tone === "gold"
      ? "text-forecast-gold"
      : tone === "cyan"
        ? "text-live-cyan"
        : tone === "coral"
          ? "text-arena-coral"
          : "text-signal-blue";
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 font-mono-data text-3xl ${color}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
