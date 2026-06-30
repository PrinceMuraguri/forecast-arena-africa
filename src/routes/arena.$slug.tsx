import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { ProbabilityOrb } from "@/components/probability-orb";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-stub";
import { getMarketBySlug, type ArenaMarket } from "@/lib/arena.functions";
import { submitPrediction, getMyPredictionForMarket } from "@/lib/predictions.functions";

const marketQuery = (slug: string) =>
  queryOptions({
    queryKey: ["arena", "market", slug],
    queryFn: () => getMarketBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/arena/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — The Arena` },
      { name: "description", content: "Predict the outcome. Live, transparent, sponsored markets." },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(marketQuery(params.slug)),
  component: MarketPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Couldn't load this market.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/arena" className="mt-6 inline-block text-xs uppercase tracking-widest text-live-cyan">
          ← Back to the Arena
        </Link>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Market not found.</h1>
        <Link to="/arena" className="mt-6 inline-block text-xs uppercase tracking-widest text-live-cyan">
          ← Back to the Arena
        </Link>
      </div>
    </AppShell>
  ),
});

function MarketPage() {
  const { slug } = Route.useParams();
  const { data: market } = useSuspenseQuery(marketQuery(slug));

  if (!market) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl">Market not found.</h1>
          <Link to="/arena" className="mt-6 inline-block text-xs uppercase tracking-widest text-live-cyan">
            ← Back to the Arena
          </Link>
        </div>
      </AppShell>
    );
  }

  return <MarketView market={market} />;
}

function MarketView({ market }: { market: ArenaMarket }) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const submit = useServerFn(submitPrediction);
  const fetchMine = useServerFn(getMyPredictionForMarket);

  const yes = market.outcomes.find((o) => /^yes$/i.test(o.label));
  const headlineProb = Math.round(((yes?.implied_probability ?? 0.5) as number) * 100);

  const myQuery = useQuery({
    queryKey: ["predictions", "mine", market.id],
    queryFn: () => fetchMine({ data: { marketId: market.id } }),
    enabled: Boolean(user),
  });

  const [outcomeId, setOutcomeId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(70);

  useEffect(() => {
    if (myQuery.data) {
      setOutcomeId(myQuery.data.outcome_id);
      setConfidence(myQuery.data.confidence);
    } else if (!outcomeId && market.outcomes[0]) {
      setOutcomeId(market.outcomes[0].id);
    }
  }, [myQuery.data, market.outcomes, outcomeId]);

  const mutation = useMutation({
    mutationFn: (input: { marketId: string; outcomeId: string; confidence: number }) =>
      submit({ data: input }),
    onMutate: async (input) => {
      // Optimistic probability bump
      await queryClient.cancelQueries({ queryKey: ["arena", "market", market.slug] });
      const prev = queryClient.getQueryData<ArenaMarket | null>(["arena", "market", market.slug]);
      if (prev) {
        const totalConf =
          prev.outcomes.reduce((sum, o) => sum + (o.implied_probability ?? 0) * 100, 0) +
          input.confidence;
        const next: ArenaMarket = {
          ...prev,
          outcomes: prev.outcomes.map((o) => {
            const current = (o.implied_probability ?? 0) * 100;
            const bumped = o.id === input.outcomeId ? current + input.confidence : current;
            return { ...o, implied_probability: totalConf > 0 ? bumped / totalConf : 0 };
          }),
        };
        queryClient.setQueryData(["arena", "market", market.slug], next);
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["arena", "market", market.slug], ctx.prev);
      toast.error(err instanceof Error ? err.message : "Couldn't record prediction");
    },
    onSuccess: () => {
      toast.success("Prediction recorded.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["arena", "market", market.slug] });
      queryClient.invalidateQueries({ queryKey: ["predictions", "mine", market.id] });
      queryClient.invalidateQueries({ queryKey: ["arena", "markets"] });
    },
  });

  const isOpen = market.status === "open";

  return (
    <AppShell>
      <article className="mx-auto max-w-5xl px-4 py-10">
        <Link to="/arena" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-live-cyan">
          ← The Arena
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {market.sponsor_name ? `Sponsored · ${market.sponsor_name}` : market.category?.name ?? "Market"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{market.title}</h1>
            {market.summary ? (
              <p className="mt-3 max-w-2xl text-muted-foreground">{market.summary}</p>
            ) : null}
            <p className="mt-4 rounded-lg border border-white/10 bg-card/60 p-4 text-sm">
              <span className="text-xs uppercase tracking-widest text-live-cyan">Question</span>
              <br />
              {market.question}
            </p>
          </div>
          <ProbabilityOrb probability={headlineProb} size={140} />
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Live probabilities</h2>
            <ul className="mt-4 space-y-3">
              {market.outcomes.map((o) => {
                const pct = Math.round(o.implied_probability * 100);
                return (
                  <li key={o.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{o.label}</span>
                      <span className="font-mono-data text-live-cyan">{pct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-live-cyan transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-muted-foreground">Prize pool</div>
                <div className="font-mono-data text-forecast-gold">
                  KES {market.prize_pool_kes.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-muted-foreground">Closes</div>
                <div className="font-mono-data text-live-cyan">
                  {market.closes_at ? new Date(market.closes_at).toLocaleString() : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Your prediction</h2>

            {!isOpen ? (
              <p className="mt-4 text-sm text-muted-foreground">
                This market is {market.status}. Predictions are closed.
              </p>
            ) : !user ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to register your forecast and earn points when you're right.
                </p>
                <Button asChild className="bg-live-cyan text-forecast-ink hover:bg-live-cyan/90">
                  <Link to="/login">Sign in to predict</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Pick an outcome
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {market.outcomes.map((o) => {
                      const selected = outcomeId === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setOutcomeId(o.id)}
                          className={`rounded-xl border p-3 text-sm font-medium transition-colors ${
                            selected
                              ? "border-live-cyan bg-live-cyan/10 text-live-cyan"
                              : "border-white/10 bg-white/5 hover:border-white/30"
                          }`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                    <span>Confidence</span>
                    <span className="font-mono-data text-live-cyan">{confidence}%</span>
                  </div>
                  <Slider
                    value={[confidence]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(v) => setConfidence(v[0] ?? 50)}
                  />
                </div>

                <Button
                  disabled={!outcomeId || mutation.isPending}
                  onClick={() => {
                    if (!outcomeId) return;
                    mutation.mutate({ marketId: market.id, outcomeId, confidence });
                  }}
                  className="w-full bg-live-cyan text-forecast-ink hover:bg-live-cyan/90"
                >
                  {mutation.isPending
                    ? "Recording…"
                    : myQuery.data
                      ? "Update prediction"
                      : "Lock in prediction"}
                </Button>

                {myQuery.data ? (
                  <p className="text-xs text-muted-foreground">
                    Last updated{" "}
                    {new Date(myQuery.data.updated_at).toLocaleString()} — you can revise until the
                    market closes.
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => router.invalidate()}
                  className="text-xs uppercase tracking-widest text-muted-foreground hover:text-live-cyan"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        </section>
      </article>
    </AppShell>
  );
}
