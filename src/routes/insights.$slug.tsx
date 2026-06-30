import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { SiteShell } from "@/components/site-shell";
import { PartnerBar } from "@/components/partner-bar";
import { Button } from "@/components/ui/button";
import {
  getArticle,
  getIndex,
  getRanking,
  listArticles,
} from "@/lib/insights.functions";

const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article", slug],
    queryFn: () => getArticle({ data: { slug } }),
  });

const relatedQuery = () =>
  queryOptions({
    queryKey: ["articles", "related"],
    queryFn: () => listArticles({ data: { limit: 4 } }),
  });

export const Route = createFileRoute("/insights/$slug")({
  head: ({ params, loaderData }) => {
    const a: any = loaderData ?? {};
    const title = a?.title ?? params.slug;
    const dek = a?.dek ?? "Read what Africa is telling us — fresh from the polls.";
    return {
      meta: [
        { title: `${title} — Insights` },
        { name: "description", content: dek },
        { property: "og:title", content: title },
        { property: "og:description", content: dek },
        ...(a?.hero_image_url ? [{ property: "og:image", content: a.hero_image_url }] : []),
      ],
    };
  },
  loader: async ({ context, params }) => {
    context.queryClient.ensureQueryData(relatedQuery());
    return context.queryClient.ensureQueryData(articleQuery(params.slug));
  },
  component: ArticlePage,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl">Couldn't load this article.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link
          to="/insights"
          className="mt-6 inline-block text-xs uppercase tracking-widest text-arena-coral"
        >
          ← Back to Insights
        </Link>
      </div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">Article not found.</div>
    </SiteShell>
  ),
});

type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "stat"; label: string; value: string }
  | { type: "chart"; ref: { kind: "index" | "ranking"; slug: string } }
  | { type: "image"; src: string; alt?: string; caption?: string };

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(slug));
  const { data: related } = useSuspenseQuery(relatedQuery());

  if (!article) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">Article not found.</div>
      </SiteShell>
    );
  }

  const blocks: Block[] = Array.isArray(article.body) ? (article.body as any) : [];
  const others = related.filter((r: any) => r.slug !== article.slug).slice(0, 3);

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/insights"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-arena-coral"
        >
          ← Insights
        </Link>

        <header className="mt-6">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {(article.category as any)?.icon ?? ""} {(article.category as any)?.name ?? "Insight"}
            {article.country_code ? ` · ${article.country_code}` : ""}
            {article.article_type ? ` · ${article.article_type}` : ""}
          </p>
          <h1
            className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl"
            style={{ fontFamily: "var(--font-display, ui-serif, Georgia, serif)" }}
          >
            {article.title}
          </h1>
          {article.dek ? (
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">{article.dek}</p>
          ) : null}
          <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
            {article.author ?? "Forecast Arena"}
            {article.byline ? ` · ${article.byline}` : ""}
            {article.read_minutes ? ` · ${article.read_minutes} min read` : ""}
            {article.published_at
              ? ` · ${new Date(article.published_at).toLocaleDateString()}`
              : ""}
          </p>
        </header>

        {article.hero_image_url ? (
          <img
            src={article.hero_image_url}
            alt={article.title}
            className="mt-8 w-full rounded-2xl border border-foreground/10 object-cover"
          />
        ) : (
          <div className="mt-8 h-48 rounded-2xl bg-gradient-to-br from-arena-coral/20 via-forecast-gold/15 to-live-cyan/15" />
        )}

        <div className="mt-10 space-y-6">
          {blocks.map((b, i) => (
            <BlockRenderer key={i} block={b} />
          ))}
        </div>

        {/* Loop CTA */}
        <LoopCta article={article} />

        {article.linked_report_slug ? (
          <a
            href={`/reports/${article.linked_report_slug}`}
            className="mt-6 block rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 hover:border-arena-coral/60"
          >
            <p className="text-[10px] uppercase tracking-widest text-arena-coral">Go deeper</p>
            <p className="mt-1 font-display text-base font-semibold">
              Download the full report →
            </p>
          </a>
        ) : null}

        <div className="mt-10">
          <PartnerBar variant="footer" />
          <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            Powered by Econsult Africa
          </p>
        </div>
      </article>

      {others.length > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <h2 className="font-display text-xl font-semibold">More from Insights</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {others.map((o: any) => (
              <Link
                key={o.id}
                to="/insights/$slug"
                params={{ slug: o.slug }}
                className="block rounded-2xl border border-foreground/10 bg-white/70 p-4 hover:border-arena-coral/60"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {(o.category as any)?.name ?? "Insight"}
                </p>
                <h3 className="mt-1 font-display text-base font-semibold leading-snug">
                  {o.title}
                </h3>
                {o.dek ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{o.dek}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </SiteShell>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-base leading-relaxed text-foreground/90 md:text-lg">{block.text}</p>;
    case "heading":
      return (
        <h2 className="mt-4 font-display text-2xl font-semibold md:text-3xl">{block.text}</h2>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-arena-coral pl-5 italic text-foreground/80">
          <p className="text-lg md:text-xl">"{block.text}"</p>
          {block.attribution ? (
            <footer className="mt-2 text-xs uppercase tracking-widest text-muted-foreground not-italic">
              — {block.attribution}
            </footer>
          ) : null}
        </blockquote>
      );
    case "stat":
      return (
        <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-arena-coral/5 to-forecast-gold/5 p-6">
          <p className="font-mono text-4xl font-bold text-arena-coral md:text-5xl">
            {block.value}
          </p>
          <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
            {block.label}
          </p>
        </div>
      );
    case "image":
      return (
        <figure>
          <img
            src={block.src}
            alt={block.alt ?? ""}
            className="w-full rounded-2xl border border-foreground/10"
          />
          {block.caption ? (
            <figcaption className="mt-2 text-xs text-muted-foreground">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    case "chart":
      return <ChartBlock refr={block.ref} />;
    default:
      return null;
  }
}

function ChartBlock({ refr }: { refr: { kind: "index" | "ranking"; slug: string } }) {
  if (refr.kind === "index") return <IndexChart slug={refr.slug} />;
  if (refr.kind === "ranking") return <RankingChart slug={refr.slug} />;
  return null;
}

function IndexChart({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ["index", slug],
    queryFn: () => getIndex({ data: { slug } }),
  });
  if (!data) {
    return (
      <div className="h-48 rounded-2xl border border-dashed border-foreground/10 bg-foreground/[0.02]" />
    );
  }
  const points = (data.points ?? []) as Array<{ period: string; value: number }>;
  return (
    <figure className="rounded-2xl border border-foreground/10 bg-white p-4">
      <figcaption className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
        {data.name} · {data.unit ?? ""}
      </figcaption>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={["dataMin", "dataMax"]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-arena-coral, #ff5a4d)"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {data.is_sample ? (
        <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          Illustrative · sample data
        </p>
      ) : null}
    </figure>
  );
}

function RankingChart({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ["ranking", slug],
    queryFn: () => getRanking({ data: { slug } }),
  });
  if (!data) {
    return (
      <div className="h-48 rounded-2xl border border-dashed border-foreground/10 bg-foreground/[0.02]" />
    );
  }
  const entries = (data.entries ?? []) as Array<{ label: string; score: number }>;
  return (
    <figure className="rounded-2xl border border-foreground/10 bg-white p-4">
      <figcaption className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
        {data.title}
      </figcaption>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={entries} layout="vertical" margin={{ left: 12 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="score" fill="var(--color-arena-coral, #ff5a4d)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function LoopCta({ article }: { article: any }) {
  const slug = article.linked_poll_slug;
  if (!slug) return null;
  const isMidflight = article.article_type === "midflight";
  return (
    <div className="sticky bottom-4 z-10 mt-12 rounded-2xl border border-arena-coral/40 bg-arena-coral/5 p-5 backdrop-blur">
      <p className="text-[10px] uppercase tracking-widest text-arena-coral">
        {isMidflight ? "Poll still open" : "From a live poll"}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-base font-semibold">
          This story came from a live poll — take it yourself.
        </p>
        <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
          <Link to="/polls/$slug" params={{ slug }}>
            Take the poll →
          </Link>
        </Button>
      </div>
    </div>
  );
}
