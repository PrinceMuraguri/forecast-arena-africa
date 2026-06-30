import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { PartnerBar } from "@/components/partner-bar";
import { listRankings } from "@/lib/insights.functions";

const rankingsQuery = () =>
  queryOptions({ queryKey: ["rankings"], queryFn: () => listRankings() });

export const Route = createFileRoute("/rankings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(rankingsQuery()),
  head: () => ({
    meta: [
      { title: "Rankings — Forecast Arena" },
      { name: "description", content: "Who's leading, who's losing — rankings built from Africa's voice." },
      { property: "og:title", content: "Rankings — Forecast Arena" },
      { property: "og:url", content: "https://forecast-arena-africa.lovable.app/rankings" },
    ],
    links: [{ rel: "canonical", href: "https://forecast-arena-africa.lovable.app/rankings" }],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  const { data: rankings } = useSuspenseQuery(rankingsQuery());
  return (
    <SiteShell>
      <PageHero
        eyebrow="Rankings"
        title="Who's winning Africa's attention."
        subtitle="Brand, leader, and product rankings — measured continuously by our panel."
      />
      <section className="mx-auto max-w-6xl px-4 py-12">
        {rankings.length === 0 ? (
          <p className="text-center text-muted-foreground">No rankings yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rankings.map((r: any) => (
              <Link
                key={r.id}
                to="/rankings/$slug"
                params={{ slug: r.slug }}
                className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-xs">
                  {r.category && (
                    <span
                      className="rounded-full px-2 py-0.5 font-medium"
                      style={{ background: `${r.category.color ?? "#888"}20`, color: r.category.color ?? "#888" }}
                    >
                      {r.category.icon} {r.category.name}
                    </span>
                  )}
                  {r.is_sample && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Sample
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold leading-tight">{r.title}</h3>
                {r.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                )}
                <div className="mt-4 text-xs text-muted-foreground">
                  Sample size: <span className="font-medium text-foreground">{r.sample_size ?? "—"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <PartnerBar />
    </SiteShell>
  );
}
