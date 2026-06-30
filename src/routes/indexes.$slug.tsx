import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { SiteShell } from "@/components/site-shell";
import { PartnerBar } from "@/components/partner-bar";
import { Button } from "@/components/ui/button";
import { getIndex } from "@/lib/insights.functions";

const indexQuery = (slug: string) =>
  queryOptions({
    queryKey: ["index", slug],
    queryFn: () => getIndex({ data: { slug } }),
  });

export const Route = createFileRoute("/indexes/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(indexQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.name ? `${loaderData.name} — Forecast Arena` : "Index — Forecast Arena";
    return {
      meta: [
        { title },
        { name: "description", content: loaderData?.description ?? "Live tracker on Forecast Arena." },
        { property: "og:title", content: title },
        { property: "og:url", content: `https://forecast-arena-africa.lovable.app/indexes/${params.slug}` },
      ],
      links: [
        { rel: "canonical", href: `https://forecast-arena-africa.lovable.app/indexes/${params.slug}` },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Index not found</h1>
        <Link to="/indexes" className="mt-4 inline-block text-primary underline">
          Browse all indexes
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">
        Something went wrong loading this index.
      </div>
    </SiteShell>
  ),
  component: IndexDetail,
});

const RANGES = [
  { key: "6m", label: "6 months", months: 6 },
  { key: "1y", label: "1 year", months: 12 },
  { key: "all", label: "All", months: 0 },
] as const;

function IndexDetail() {
  const { slug } = Route.useParams();
  const { data: idx } = useSuspenseQuery(indexQuery(slug));
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("1y");

  if (!idx) return null;

  const points = useMemo(() => {
    const all = (idx.points ?? []).map((p: any) => ({
      period: p.period,
      value: Number(p.value),
      label: new Date(p.period).toLocaleDateString("en", { month: "short", year: "2-digit" }),
    }));
    const cfg = RANGES.find((r) => r.key === range)!;
    if (!cfg.months) return all;
    return all.slice(-cfg.months);
  }, [idx.points, range]);

  const change = Number(idx.change_value ?? 0);
  const isUp = change >= 0;

  return (
    <SiteShell>
      {idx.is_sample && (
        <div className="border-b border-amber-500/30 bg-amber-500/10">
          <div className="mx-auto max-w-5xl px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
            Illustrative · sample data — methodology in place, real waves rolling out.
          </div>
        </div>
      )}

      <header className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex items-center gap-2 text-xs">
            {idx.category && (
              <span
                className="rounded-full px-2 py-0.5 font-medium"
                style={{ background: `${idx.category.color ?? "#888"}20`, color: idx.category.color ?? "#888" }}
              >
                {idx.category.icon} {idx.category.name}
              </span>
            )}
            {idx.country_code && (
              <span className="text-muted-foreground">{idx.country_code}</span>
            )}
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {idx.name}
          </h1>
          {idx.description && (
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{idx.description}</p>
          )}
          <div className="mt-6 flex items-end gap-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Latest value
              </div>
              <div className="font-display text-5xl font-bold">{idx.latest_value ?? "—"}</div>
            </div>
            <div className={`pb-2 text-sm font-semibold ${isUp ? "text-emerald-600" : "text-rose-600"}`}>
              {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)} {idx.unit ?? ""}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Trend</h2>
          <div className="flex gap-1 rounded-full border border-border p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  range === r.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80 w-full rounded-2xl border border-border bg-card p-4">
          {points.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No data points yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points}>
                <defs>
                  <linearGradient id="idxFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#idxFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold">How we measure this</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {idx.methodology_note ??
                "Continuously updated from panel polls, weighted to reflect a nationally representative sample."}
            </p>
            {idx.source_standard && (
              <p className="mt-2 text-xs text-muted-foreground">
                Standard: <span className="font-medium">{idx.source_standard}</span>
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h3 className="font-display text-lg font-semibold">Help shape the next wave</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              This index is fed by a live panel poll. Take part to add your voice and earn.
            </p>
            <Button asChild className="mt-4">
              <Link to="/explore">Take the poll that feeds this index →</Link>
            </Button>
          </div>
        </div>
      </section>

      <PartnerBar />
    </SiteShell>
  );
}
