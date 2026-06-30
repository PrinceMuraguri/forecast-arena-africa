import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { PartnerBar } from "@/components/partner-bar";
import { listIndexes, getIndex } from "@/lib/insights.functions";

const indexesQuery = () =>
  queryOptions({ queryKey: ["indexes"], queryFn: () => listIndexes() });

export const Route = createFileRoute("/indexes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(indexesQuery()),
  head: () => ({
    meta: [
      { title: "Indexes & Trackers — Forecast Arena" },
      { name: "description", content: "Live indexes and trackers built from the polls Africa is taking." },
      { property: "og:title", content: "Indexes & Trackers — Forecast Arena" },
      { property: "og:url", content: "https://forecast-arena-africa.lovable.app/indexes" },
    ],
    links: [{ rel: "canonical", href: "https://forecast-arena-africa.lovable.app/indexes" }],
  }),
  component: IndexesPage,
});

function IndexesPage() {
  const { data: indexes } = useSuspenseQuery(indexesQuery());
  return (
    <SiteShell>
      <PageHero
        eyebrow="Indexes"
        title="Live trackers from the polls Africa is taking."
        subtitle="Sentiment, prices, brand health — measured continuously and shared openly."
      />
      <section className="mx-auto max-w-6xl px-4 py-12">
        {indexes.length === 0 ? (
          <p className="text-center text-muted-foreground">No indexes yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {indexes.map((idx: any) => (
              <IndexCard key={idx.id} idx={idx} />
            ))}
          </div>
        )}
      </section>
      <PartnerBar />
    </SiteShell>
  );
}

function IndexCard({ idx }: { idx: any }) {
  const change = Number(idx.change_value ?? 0);
  const isUp = change >= 0;
  return (
    <Link
      to="/indexes/$slug"
      params={{ slug: idx.slug }}
      className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          {idx.category && (
            <span
              className="rounded-full px-2 py-0.5 font-medium"
              style={{ background: `${idx.category.color}20`, color: idx.category.color }}
            >
              {idx.category.icon} {idx.category.name}
            </span>
          )}
          {idx.country_code && (
            <span className="text-muted-foreground">{idx.country_code}</span>
          )}
        </div>
        {idx.is_sample && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Sample
          </span>
        )}
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-tight">{idx.name}</h3>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="font-display text-3xl font-bold">{idx.latest_value ?? "—"}</div>
          <div className={`text-xs font-medium ${isUp ? "text-emerald-600" : "text-rose-600"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(1)} {idx.unit ?? ""}
          </div>
        </div>
      </div>
      {idx.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{idx.description}</p>
      )}
    </Link>
  );
}
