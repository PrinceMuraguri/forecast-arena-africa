import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { PartnerBar } from "@/components/partner-bar";
import { listReports, listThemes } from "@/lib/insights.functions";

const reportsQuery = () =>
  queryOptions({ queryKey: ["reports"], queryFn: () => listReports() });
const themesQuery = () =>
  queryOptions({ queryKey: ["themes"], queryFn: () => listThemes() });

export const Route = createFileRoute("/reports")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(reportsQuery());
    context.queryClient.ensureQueryData(themesQuery());
  },
  head: () => ({
    meta: [
      { title: "Reports & Data — Forecast Arena" },
      { name: "description", content: "Deep-dive reports and datasets from Africa's panel." },
      { property: "og:title", content: "Reports & Data — Forecast Arena" },
      { property: "og:url", content: "https://forecast-arena-africa.lovable.app/reports" },
    ],
    links: [{ rel: "canonical", href: "https://forecast-arena-africa.lovable.app/reports" }],
  }),
  component: ReportsPage,
});

function priceLabel(r: any) {
  if (r.access === "free" || !r.price_kes) return "Free";
  return `KES ${r.price_kes.toLocaleString()}`;
}

function ReportsPage() {
  const { data: reports } = useSuspenseQuery(reportsQuery());
  const { data: themes } = useSuspenseQuery(themesQuery());
  const [theme, setTheme] = useState<string | undefined>();

  const featured = reports.find((r: any) => r.is_featured) ?? reports[0];
  const rest = reports.filter((r: any) => r.id !== featured?.id);

  const filtered = useMemo(
    () => (theme ? rest.filter((r: any) => r.category?.slug === theme) : rest),
    [rest, theme],
  );

  return (
    <SiteShell>
      <PageHero
        eyebrow="Reports & Data"
        title="The deep dives behind the numbers."
        subtitle="Methodology, datasets, and analysis — free previews on every report."
      />

      {featured && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <Link
            to="/reports/$slug"
            params={{ slug: featured.slug }}
            className="grid gap-6 overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-[1.2fr_1fr]"
          >
            <div className="relative aspect-[16/10] bg-muted md:aspect-auto">
              {featured.cover_url && (
                <img
                  src={featured.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="p-6 md:p-10">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                Featured report
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight">
                {featured.title}
              </h2>
              {featured.summary && (
                <p className="mt-3 text-muted-foreground">{featured.summary}</p>
              )}
              <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
                {priceLabel(featured)} · Open report →
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTheme(undefined)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              !theme
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All themes
          </button>
          {themes.map((t: any) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.slug)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                theme === t.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground">No reports in this theme yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r: any) => (
              <Link
                key={r.id}
                to="/reports/$slug"
                params={{ slug: r.slug }}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50 hover:shadow-md"
              >
                <div className="aspect-[16/10] bg-muted">
                  {r.cover_url && (
                    <img src={r.cover_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs">
                    {r.category && (
                      <span
                        className="rounded-full px-2 py-0.5 font-medium"
                        style={{
                          background: `${r.category.color ?? "#888"}20`,
                          color: r.category.color ?? "#888",
                        }}
                      >
                        {r.category.icon} {r.category.name}
                      </span>
                    )}
                    <span className="font-semibold">{priceLabel(r)}</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold leading-tight">
                    {r.title}
                  </h3>
                  {r.summary && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.summary}</p>
                  )}
                  {r.is_sample && (
                    <span className="mt-3 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Sample
                    </span>
                  )}
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
