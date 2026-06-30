import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { ProbabilityOrb } from "@/components/probability-orb";
import { listArenaMarkets, listCategories, type ArenaMarket } from "@/lib/arena.functions";

const marketsQuery = () =>
  queryOptions({
    queryKey: ["arena", "markets"],
    queryFn: () => listArenaMarkets(),
  });

const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/arena")({
  validateSearch: searchSchema,
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
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(marketsQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
  },
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
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const router = useRouter();
  const navigate = useNavigate({ from: "/arena" });
  const { category } = Route.useSearch();

  const filtered = category
    ? markets.filter((m) => m.category?.slug === category)
    : markets;

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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Want the full picture? Browse every poll, survey and tracker we run across Africa.
          </p>
          <Link
            to="/explore"
            className="text-xs uppercase tracking-widest text-live-cyan hover:underline"
          >
            Browse all polls →
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <FilterChip
            active={!category}
            onClick={() => navigate({ search: { category: undefined } })}
            label="All"
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              active={category === c.slug}
              onClick={() => navigate({ search: { category: c.slug } })}
              label={c.name}
            />
          ))}
        </div>


        {filtered.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-white/10 bg-card p-10 text-center">
            <p className="font-display text-lg">No open markets in this category.</p>
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
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest transition-colors ${
        active
          ? "border-live-cyan bg-live-cyan/10 text-live-cyan"
          : "border-white/15 text-muted-foreground hover:border-white/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function MarketCard({ market }: { market: ArenaMarket }) {
  const yes = market.outcomes.find((o) => /^yes$/i.test(o.label));
  const probability = Math.round(((yes?.implied_probability ?? 0.5) as number) * 100);
  const closes = market.closes_at ? new Date(market.closes_at) : null;
  const countdown = closes ? formatCountdown(closes) : "—";

  return (
    <Link
      to="/arena/$slug"
      params={{ slug: market.slug }}
      className="group block rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:border-live-cyan/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
            {market.category ? (
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-muted-foreground">
                {market.category.name}
              </span>
            ) : null}
            {market.sponsor_name ? (
              <span className="text-live-cyan">Sponsored · {market.sponsor_name}</span>
            ) : null}
          </div>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug group-hover:text-live-cyan">
            {market.title}
          </h3>
          {market.summary ? (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{market.summary}</p>
          ) : null}
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
    </Link>
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
