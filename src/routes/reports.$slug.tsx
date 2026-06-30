import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { PartnerBar } from "@/components/partner-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-stub";
import { getReport, listReports } from "@/lib/insights.functions";

const reportQuery = (slug: string) =>
  queryOptions({
    queryKey: ["report", slug],
    queryFn: () => getReport({ data: { slug } }),
  });

const relatedQuery = () =>
  queryOptions({ queryKey: ["reports"], queryFn: () => listReports() });

export const Route = createFileRoute("/reports/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(reportQuery(params.slug));
    if (!data) throw notFound();
    context.queryClient.ensureQueryData(relatedQuery());
    return data;
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.title
      ? `${loaderData.title} — Forecast Arena`
      : "Report — Forecast Arena";
    return {
      meta: [
        { title },
        { name: "description", content: loaderData?.summary ?? "Forecast Arena report." },
        { property: "og:title", content: title },
        { property: "og:type", content: "article" },
        {
          property: "og:url",
          content: `https://forecast-arena-africa.lovable.app/reports/${params.slug}`,
        },
        ...(loaderData?.cover_url
          ? [{ property: "og:image", content: loaderData.cover_url }]
          : []),
      ],
      links: [
        {
          rel: "canonical",
          href: `https://forecast-arena-africa.lovable.app/reports/${params.slug}`,
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Report not found</h1>
        <Link to="/reports" className="mt-4 inline-block text-primary underline">
          Browse all reports
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">
        Something went wrong loading this report.
      </div>
    </SiteShell>
  ),
  component: ReportDetail,
});

function ReportDetail() {
  const { slug } = Route.useParams();
  const { data: r } = useSuspenseQuery(reportQuery(slug));
  const { data: all } = useSuspenseQuery(relatedQuery());
  const { user } = useAuth();

  if (!r) return null;

  const isFree = r.access === "free" || !r.price_kes;
  const contents: string[] = Array.isArray(r.contents) ? (r.contents as string[]) : [];
  const related = all
    .filter((x: any) => x.slug !== r.slug && x.category?.slug === r.category?.slug)
    .slice(0, 3);

  return (
    <SiteShell>
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[1fr_1.2fr] md:py-16">
          <div className="overflow-hidden rounded-2xl border border-border bg-muted">
            <div className="aspect-[4/5]">
              {r.cover_url && (
                <img src={r.cover_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs">
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
              {r.country_code && (
                <span className="text-muted-foreground">{r.country_code}</span>
              )}
              {r.is_sample && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Sample
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {r.title}
            </h1>
            {r.summary && <p className="mt-4 text-lg text-muted-foreground">{r.summary}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isFree ? (
                <Button asChild size="lg">
                  <a
                    href={r.sample_url ?? "#preview"}
                    target={r.sample_url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                  >
                    Download free →
                  </a>
                </Button>
              ) : user ? (
                <Button asChild size="lg">
                  <Link to="/wallet">
                    Get the report — KES {r.price_kes?.toLocaleString()}
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link to="/auth">
                    Sign in to buy — KES {r.price_kes?.toLocaleString()}
                  </Link>
                </Button>
              )}
              {r.sample_url && (
                <Button asChild variant="outline" size="lg">
                  <a href={r.sample_url} target="_blank" rel="noopener noreferrer">
                    Preview sample (free)
                  </a>
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Preview is always free. Full report requires {isFree ? "no sign-in" : "purchase or subscription"}.
            </p>
          </div>
        </div>
      </header>

      {contents.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="font-display text-2xl font-bold">What's inside</h2>
          <ul className="mt-4 space-y-2">
            {contents.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-primary">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="preview" className="mx-auto max-w-3xl px-4 pb-12">
        <h2 className="font-display text-2xl font-bold">Sample preview</h2>
        {r.sample_url ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted">
            <iframe
              src={r.sample_url}
              title="Report preview"
              className="h-[600px] w-full"
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Preview coming soon.
          </p>
        )}
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-12">
          <h2 className="font-display text-2xl font-bold">Related reports</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((x: any) => (
              <Link
                key={x.id}
                to="/reports/$slug"
                params={{ slug: x.slug }}
                className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50"
              >
                <div className="font-display text-base font-semibold leading-tight">
                  {x.title}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {x.access === "free" || !x.price_kes
                    ? "Free"
                    : `KES ${x.price_kes.toLocaleString()}`}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <PartnerBar />
    </SiteShell>
  );
}
