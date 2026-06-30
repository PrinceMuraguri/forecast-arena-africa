import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Tooltip,
} from "recharts";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { PartnerBar } from "@/components/partner-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-stub";
import {
  listFeaturedArticles,
  listArticles,
  listThemes,
  listCountries,
  listIndexes,
  getIndex,
  listRankings,
  getRanking,
  listReports,
  listPodcast,
  getDailyQuestion,
} from "@/lib/insights.functions";

const themesQuery = () =>
  queryOptions({ queryKey: ["themes"], queryFn: () => listThemes() });

const countriesQuery = () =>
  queryOptions({ queryKey: ["countries"], queryFn: () => listCountries() });

const featuredQuery = () =>
  queryOptions({
    queryKey: ["insights", "featured"],
    queryFn: () => listFeaturedArticles({ data: { limit: 1 } }),
  });

const articlesQuery = (input: { category?: string; country?: string }) =>
  queryOptions({
    queryKey: ["insights", "articles", input],
    queryFn: () => listArticles({ data: { ...input, limit: 24 } }),
  });

const indexesQuery = () =>
  queryOptions({ queryKey: ["indexes"], queryFn: () => listIndexes() });

const rankingsQuery = () =>
  queryOptions({ queryKey: ["rankings"], queryFn: () => listRankings() });

const reportsQuery = () =>
  queryOptions({ queryKey: ["reports"], queryFn: () => listReports() });

const podcastQuery = () =>
  queryOptions({ queryKey: ["podcast"], queryFn: () => listPodcast() });

const dailyQuery = () =>
  queryOptions({ queryKey: ["daily"], queryFn: () => getDailyQuestion() });

const tabs = ["all", "articles", "indexes", "rankings", "reports", "podcast"] as const;
type Tab = (typeof tabs)[number];

const searchSchema = z.object({
  category: z.string().optional(),
  country: z.string().optional(),
  tab: z.enum(tabs).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/insights")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ category: search.category, country: search.country }),
  head: () => ({
    meta: [
      { title: "Insights — Forecast Arena" },
      {
        name: "description",
        content:
          "Articles, live indexes, rankings, reports and podcasts — from the polls you help create.",
      },
      { property: "og:title", content: "Insights — Forecast Arena" },
      {
        property: "og:description",
        content: "What Africa is thinking. And what comes next.",
      },
    ],
  }),
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(themesQuery());
    context.queryClient.ensureQueryData(countriesQuery());
    context.queryClient.ensureQueryData(featuredQuery());
    context.queryClient.ensureQueryData(articlesQuery(deps));
    context.queryClient.ensureQueryData(indexesQuery());
    context.queryClient.ensureQueryData(rankingsQuery());
    context.queryClient.ensureQueryData(reportsQuery());
    context.queryClient.ensureQueryData(podcastQuery());
    context.queryClient.ensureQueryData(dailyQuery());
  },
  component: InsightsPage,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl">Insights couldn't load.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">Nothing here yet.</div>
    </SiteShell>
  ),
});

function InsightsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/insights" });
  const tab: Tab = search.tab ?? "all";

  const { data: themes } = useSuspenseQuery(themesQuery());
  const { data: countries } = useSuspenseQuery(countriesQuery());
  const { data: featured } = useSuspenseQuery(featuredQuery());
  const { data: articles } = useSuspenseQuery(
    articlesQuery({ category: search.category, country: search.country }),
  );
  const { data: indexes } = useSuspenseQuery(indexesQuery());
  const { data: rankings } = useSuspenseQuery(rankingsQuery());
  const { data: reports } = useSuspenseQuery(reportsQuery());
  const { data: podcasts } = useSuspenseQuery(podcastQuery());
  const { data: daily } = useSuspenseQuery(dailyQuery());

  const [qDraft, setQDraft] = useState(search.q ?? "");

  function update(patch: Partial<typeof search>) {
    navigate({ search: (prev: any) => ({ ...prev, ...patch }) });
  }

  const featuredArticle = featured[0];

  const show = (k: Tab) => tab === "all" || tab === k;

  const filteredArticles = search.q
    ? articles.filter(
        (a: any) =>
          a.title.toLowerCase().includes(search.q!.toLowerCase()) ||
          (a.dek ?? "").toLowerCase().includes(search.q!.toLowerCase()),
      )
    : articles;

  return (
    <SiteShell>
      <PageHero
        eyebrow="Insights"
        title="What Africa is thinking. And what comes next."
        subtitle="Articles, live indexes, rankings, and reports — from the polls you help create."
      />

      {/* Search + country */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: qDraft.trim() || undefined });
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Search articles, indexes, rankings…"
            className="min-w-0 flex-1 rounded-full border border-foreground/15 bg-white px-4 py-2 text-sm focus:border-arena-coral focus:outline-none"
          />
          <select
            value={search.country ?? ""}
            onChange={(e) => update({ country: e.target.value || undefined })}
            className="rounded-full border border-foreground/15 bg-white px-4 py-2 text-sm"
          >
            <option value="">All countries</option>
            {countries.map((c: any) => (
              <option key={c.code} value={c.code} disabled={!c.is_live}>
                {c.flag_emoji} {c.name}
                {c.is_live ? "" : " · soon"}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-arena-coral px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-arena-coral/90"
          >
            Search
          </button>
        </form>

        {/* Theme row */}
        <div className="mt-5 flex flex-wrap gap-2">
          <Chip
            active={!search.category}
            onClick={() => update({ category: undefined })}
            label="All themes"
          />
          {themes.map((t: any) => (
            <Chip
              key={t.id}
              active={search.category === t.slug}
              onClick={() => update({ category: t.slug })}
              label={`${t.icon ?? ""} ${t.name}`}
            />
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Chip
              key={t}
              active={tab === t}
              onClick={() => update({ tab: t === "all" ? undefined : t })}
              label={t === "all" ? "All" : capitalize(t)}
            />
          ))}
        </div>
      </section>

      {/* Featured */}
      {show("articles") && featuredArticle ? (
        <section className="mx-auto max-w-6xl px-4 pb-6">
          <FeaturedArticle a={featuredArticle} />
        </section>
      ) : null}

      {/* Latest articles */}
      {show("articles") ? (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <SectionHeader title="Latest" tag={`${filteredArticles.length} stories`} />
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((a: any) => (
              <ArticleCard key={a.id} a={a} countries={countries} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Indexes strip */}
      {show("indexes") ? (
        <section className="border-y border-foreground/10 bg-foreground/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <SectionHeader title="The Indexes" tag="Live trackers" />
            <div className="mt-5 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
              {indexes.map((ix: any) => (
                <IndexMiniCard key={ix.id} ix={ix} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Rankings strip */}
      {show("rankings") ? (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <SectionHeader title="Rankings" tag="What Africa rates" />
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rankings.slice(0, 6).map((r: any) => (
              <RankingMiniCard key={r.id} r={r} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Daily question */}
      {tab === "all" && daily ? (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <DailyQuestionCard daily={daily} />
        </section>
      ) : null}

      {/* Reports */}
      {show("reports") ? (
        <section className="border-t border-foreground/10 bg-foreground/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <SectionHeader title="Reports & Data" tag="Deep dives" />
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {reports.map((r: any) => (
                <ReportCard key={r.id} r={r} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Podcast */}
      {show("podcast") && podcasts.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <SectionHeader title="The Opportunity" tag="Podcast" />
          <PodcastFeatured ep={podcasts[0]} more={podcasts.slice(1, 4)} />
        </section>
      ) : null}

      {/* Across Africa */}
      {tab === "all" ? (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <SectionHeader title="Across Africa" tag="Country desks" />
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {countries.map((c: any) => (
              <button
                key={c.code}
                type="button"
                onClick={() => c.is_live && update({ country: c.code })}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  c.is_live
                    ? "border-foreground/10 bg-white/70 hover:border-arena-coral/60"
                    : "border-dashed border-foreground/10 bg-foreground/[0.02] text-muted-foreground"
                }`}
              >
                <p className="text-2xl">{c.flag_emoji}</p>
                <p className="mt-2 font-display text-sm font-semibold">{c.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {c.is_live ? "Live" : "Coming soon"}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Newsletter */}
      {tab === "all" ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-3xl border border-foreground/10 bg-gradient-to-br from-arena-coral/10 to-forecast-gold/10 p-8 md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-arena-coral">
              The Brief
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold md:text-3xl">
              The data that moves Africa, every Friday.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              One short email. The week's index moves, the polls closing, and the article
              everyone's talking about.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-5 flex max-w-md flex-wrap gap-2"
            >
              <input
                type="email"
                required
                placeholder="you@workplace.co.ke"
                className="min-w-0 flex-1 rounded-full border border-foreground/15 bg-white px-4 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-full bg-foreground px-5 py-2 text-xs font-semibold uppercase tracking-widest text-background hover:opacity-90"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <PartnerBar variant="footer" />
      </section>
    </SiteShell>
  );
}

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

function SectionHeader({ title, tag }: { title: string; tag?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {tag ? (
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{tag}</span>
      ) : null}
    </div>
  );
}

function Chip({
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
          ? "border-arena-coral bg-arena-coral/10 text-arena-coral"
          : "border-foreground/15 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function FeaturedArticle({ a }: { a: any }) {
  return (
    <Link
      to="/insights/$slug"
      params={{ slug: a.slug }}
      className="group block overflow-hidden rounded-3xl border border-foreground/10 bg-white/70 transition-colors hover:border-arena-coral/60"
    >
      <div className="grid md:grid-cols-2">
        <div
          className="relative min-h-[240px] bg-gradient-to-br from-arena-coral/30 via-forecast-gold/20 to-live-cyan/20"
          style={
            a.hero_image_url
              ? { backgroundImage: `url(${a.hero_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        >
          <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-arena-coral">
            Featured
          </span>
        </div>
        <div className="p-6 md:p-8">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {a.category?.icon ?? ""} {a.category?.name ?? "Insight"}
            {a.country_code ? ` · ${a.country_code}` : ""}
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight md:text-3xl group-hover:text-arena-coral">
            {a.title}
          </h2>
          {a.dek ? (
            <p className="mt-3 text-base text-muted-foreground">{a.dek}</p>
          ) : null}
          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
            {a.author ?? "Forecast Arena"}
            {a.byline ? ` · ${a.byline}` : ""}
            {a.read_minutes ? ` · ${a.read_minutes} min read` : ""}
          </p>
          <p className="mt-6 text-xs uppercase tracking-widest text-arena-coral">
            See the data →
          </p>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ a, countries }: { a: any; countries: any[] }) {
  const c = countries.find((x) => x.code === a.country_code);
  return (
    <Link
      to="/insights/$slug"
      params={{ slug: a.slug }}
      className="group flex h-full flex-col rounded-2xl border border-foreground/10 bg-white/70 p-5 transition-colors hover:border-arena-coral/60"
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
        <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-muted-foreground">
          {a.category?.icon ?? ""} {a.category?.name ?? "Insight"}
        </span>
        <span className="text-muted-foreground">
          {c?.flag_emoji} {a.country_code}
        </span>
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold leading-snug group-hover:text-arena-coral">
        {a.title}
      </h3>
      {a.dek ? (
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.dek}</p>
      ) : null}
      <p className="mt-auto pt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
        {a.author ?? "Forecast Arena"}
        {a.read_minutes ? ` · ${a.read_minutes} min` : ""}
      </p>
      {a.linked_poll_slug ? (
        <span className="mt-2 inline-block rounded-full bg-arena-coral/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-arena-coral">
          Take this poll →
        </span>
      ) : null}
    </Link>
  );
}

function IndexMiniCard({ ix }: { ix: any }) {
  const { data } = useQuery({
    queryKey: ["index", ix.slug],
    queryFn: () => getIndex({ data: { slug: ix.slug } }),
  });
  const points = (data?.points ?? []) as Array<{ period: string; value: number }>;
  const change = Number(ix.change_value ?? 0);
  const up = change >= 0;
  return (
    <a
      href={`/indexes/${ix.slug}`}
      className="group block w-[260px] shrink-0 snap-start rounded-2xl border border-foreground/10 bg-white p-4 transition-colors hover:border-arena-coral/60"
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {ix.category?.icon ?? ""} {ix.category?.name ?? "Index"}
      </p>
      <p className="mt-1 font-display text-sm font-semibold leading-snug">{ix.name}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-2xl">{ix.latest_value}</span>
        <span
          className={`font-mono text-xs ${up ? "text-live-cyan" : "text-arena-coral"}`}
        >
          {up ? "▲" : "▼"} {Math.abs(change)}
        </span>
      </div>
      <div className="mt-2 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip
              contentStyle={{ fontSize: 10 }}
              formatter={(v: any) => [v, ix.unit ?? ""]}
              labelFormatter={(l: any) => String(l)}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={up ? "var(--color-live-cyan, #06b6d4)" : "var(--color-arena-coral, #ff5a4d)"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {ix.is_sample ? (
        <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">
          Illustrative · sample
        </p>
      ) : null}
    </a>
  );
}

function RankingMiniCard({ r }: { r: any }) {
  const { data } = useQuery({
    queryKey: ["ranking", r.slug],
    queryFn: () => getRanking({ data: { slug: r.slug } }),
  });
  const entries = (data?.entries ?? []) as Array<{ label: string; score: number; rank: number }>;
  return (
    <a
      href={`/rankings/${r.slug}`}
      className="group block rounded-2xl border border-foreground/10 bg-white/70 p-5 transition-colors hover:border-arena-coral/60"
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {r.category?.icon ?? ""} {r.category?.name ?? "Ranking"}
      </p>
      <h3 className="mt-1 font-display text-base font-semibold leading-snug group-hover:text-arena-coral">
        {r.title}
      </h3>
      <ol className="mt-3 space-y-1.5 text-sm">
        {entries.slice(0, 3).map((e) => (
          <li key={e.rank} className="flex items-center justify-between gap-2">
            <span className="truncate">
              <span className="mr-2 inline-block w-4 text-xs text-muted-foreground">
                {e.rank}
              </span>
              {e.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{e.score}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[10px] uppercase tracking-widest text-arena-coral">
        See full ranking →
      </p>
    </a>
  );
}

function DailyQuestionCard({ daily }: { daily: any }) {
  const { user } = useAuth();
  const options = (daily.options ?? []) as Array<{ value: string; label: string }>;
  const results = (daily.results ?? []) as Array<{ label: string; pct: number }>;
  const max = Math.max(1, ...results.map((r) => r.pct));
  return (
    <div className="rounded-3xl border border-foreground/10 bg-white/70 p-6 md:p-8">
      <p className="text-[10px] uppercase tracking-widest text-arena-coral">
        Question of the day
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold md:text-2xl">
        {daily.question}
      </h3>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.label} className="text-sm">
              <div className="flex items-center justify-between">
                <span>{r.label}</span>
                <span className="font-mono text-xs text-muted-foreground">{r.pct}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full bg-arena-coral"
                  style={{ width: `${(r.pct / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col justify-between rounded-2xl bg-foreground/[0.03] p-4">
          {user ? (
            <div className="grid gap-2">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className="rounded-xl border border-foreground/15 px-4 py-2 text-left text-sm hover:border-arena-coral hover:bg-arena-coral/5"
                >
                  Vote · {o.label}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <p className="font-display text-base font-semibold">Add your vote.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sign in to lock your answer and see it count.
              </p>
              <div className="mt-3 flex gap-2">
                <Button asChild size="sm" className="bg-arena-coral hover:bg-arena-coral/90">
                  <Link to="/signup">Sign in</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/explore">Browse polls</Link>
                </Button>
              </div>
            </div>
          )}
          <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            Results update live · {daily.country_code}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ r }: { r: any }) {
  return (
    <a
      href={`/reports/${r.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-white transition-colors hover:border-arena-coral/60"
    >
      <div
        className="h-32 bg-gradient-to-br from-foreground/10 to-arena-coral/20"
        style={
          r.cover_url
            ? { backgroundImage: `url(${r.cover_url})`, backgroundSize: "cover" }
            : undefined
        }
      />
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {r.category?.name ?? "Report"}
        </p>
        <h3 className="mt-1 font-display text-sm font-semibold leading-snug group-hover:text-arena-coral">
          {r.title}
        </h3>
        <div className="mt-auto pt-3 text-[10px] uppercase tracking-widest">
          {r.access === "free" || r.price_kes === 0 ? (
            <span className="text-live-cyan">Free download</span>
          ) : (
            <span className="text-arena-coral">KES {Number(r.price_kes).toLocaleString()}</span>
          )}
        </div>
      </div>
    </a>
  );
}

function PodcastFeatured({ ep, more }: { ep: any; more: any[] }) {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-3">
      <a
        href={`/podcast/${ep.slug}`}
        className="group block rounded-3xl border border-foreground/10 bg-gradient-to-br from-foreground to-foreground/80 p-8 text-background lg:col-span-2"
      >
        <p className="text-[10px] uppercase tracking-widest text-forecast-gold">
          Latest episode · {ep.duration_label}
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold leading-tight group-hover:text-forecast-gold">
          {ep.title}
        </h3>
        {ep.description ? (
          <p className="mt-3 max-w-xl text-sm opacity-80">{ep.description}</p>
        ) : null}
        <p className="mt-4 text-xs uppercase tracking-widest opacity-70">
          {ep.guest_name}
          {ep.guest_title ? ` · ${ep.guest_title}` : ""}
          {ep.guest_org ? `, ${ep.guest_org}` : ""}
        </p>
        <p className="mt-6 text-xs uppercase tracking-widest text-forecast-gold">
          ▶ Listen / Watch →
        </p>
      </a>
      <div className="space-y-3">
        {more.map((e) => (
          <a
            key={e.id}
            href={`/podcast/${e.slug}`}
            className="block rounded-2xl border border-foreground/10 bg-white p-4 hover:border-arena-coral/60"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {e.duration_label}
            </p>
            <p className="mt-1 font-display text-sm font-semibold leading-snug">{e.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{e.guest_name}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
