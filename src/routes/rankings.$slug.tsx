import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { PartnerBar } from "@/components/partner-bar";
import { Button } from "@/components/ui/button";
import { getRanking } from "@/lib/insights.functions";

const rankingQuery = (slug: string) =>
  queryOptions({
    queryKey: ["ranking", slug],
    queryFn: () => getRanking({ data: { slug } }),
  });

export const Route = createFileRoute("/rankings/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(rankingQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.title
      ? `${loaderData.title} — Forecast Arena`
      : "Ranking — Forecast Arena";
    return {
      meta: [
        { title },
        {
          name: "description",
          content: loaderData?.description ?? "Africa's voice, ranked.",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData?.description ?? "Africa's voice, ranked." },
        { property: "og:type", content: "article" },
        {
          property: "og:url",
          content: `https://forecast-arena-africa.lovable.app/rankings/${params.slug}`,
        },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://forecast-arena-africa.lovable.app/rankings/${params.slug}`,
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Ranking not found</h1>
        <Link to="/rankings" className="mt-4 inline-block text-primary underline">
          Browse all rankings
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">
        Something went wrong loading this ranking.
      </div>
    </SiteShell>
  ),
  component: RankingDetail,
});

function RankingDetail() {
  const { slug } = Route.useParams();
  const { data: r } = useSuspenseQuery(rankingQuery(slug));
  if (!r) return null;

  const entries = (r.entries ?? []) as Array<{
    label: string;
    logo_url: string | null;
    score: number;
    rank: number;
    change: number | null;
  }>;
  const maxScore = Math.max(1, ...entries.map((e) => Number(e.score ?? 0)));

  const shareUrl = `https://forecast-arena-africa.lovable.app/rankings/${slug}`;

  return (
    <SiteShell>
      {r.is_sample && (
        <div className="border-b border-amber-500/30 bg-amber-500/10">
          <div className="mx-auto max-w-5xl px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
            Illustrative · sample data
          </div>
        </div>
      )}

      <header className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="flex items-center gap-2 text-xs">
            {r.category && (
              <span
                className="rounded-full px-2 py-0.5 font-medium"
                style={{ background: `${r.category.color}20`, color: r.category.color }}
              >
                {r.category.icon} {r.category.name}
              </span>
            )}
            {r.country_code && <span className="text-muted-foreground">{r.country_code}</span>}
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {r.title}
          </h1>
          {r.description && (
            <p className="mt-3 text-lg text-muted-foreground">{r.description}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>
              Sample size:{" "}
              <span className="font-medium text-foreground">{r.sample_size ?? "—"}</span>
            </span>
            {r.published_at && (
              <span>
                Published:{" "}
                <span className="font-medium text-foreground">
                  {new Date(r.published_at).toLocaleDateString()}
                </span>
              </span>
            )}
            <ShareLinks url={shareUrl} title={r.title} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground">No entries yet.</p>
        ) : (
          <ol className="space-y-3">
            {entries.map((e) => {
              const pct = (Number(e.score ?? 0) / maxScore) * 100;
              const change = Number(e.change ?? 0);
              return (
                <li
                  key={e.rank}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="w-8 text-center font-display text-xl font-bold text-muted-foreground">
                    {e.rank}
                  </div>
                  {e.logo_url ? (
                    <img
                      src={e.logo_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{e.label}</div>
                      <div className="font-display text-sm font-semibold tabular-nums">
                        {Number(e.score ?? 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {change !== 0 && (
                    <div
                      className={`w-10 text-right text-xs font-medium ${
                        change > 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {change > 0 ? "▲" : "▼"} {Math.abs(change)}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold">How we measure this</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {r.methodology_note ??
                "Scores are calculated from panel responses, weighted to reflect a representative sample."}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h3 className="font-display text-lg font-semibold">Help shape the next ranking</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              This ranking updates as more people respond. Add your voice and earn.
            </p>
            <Button asChild className="mt-4">
              <Link to="/explore">Take the poll →</Link>
            </Button>
          </div>
        </div>
      </section>

      <PartnerBar />
    </SiteShell>
  );
}

function ShareLinks({ url, title }: { url: string; title: string }) {
  const enc = encodeURIComponent;
  return (
    <span className="flex items-center gap-3 text-xs">
      <span>Share:</span>
      <a
        className="underline hover:text-foreground"
        href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        X
      </a>
      <a
        className="underline hover:text-foreground"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
      <a
        className="underline hover:text-foreground"
        href={`https://wa.me/?text=${enc(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
    </span>
  );
}
