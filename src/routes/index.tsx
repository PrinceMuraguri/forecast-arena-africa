import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Search, Coins, LineChart as LineChartIcon } from "lucide-react";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Tooltip,
} from "recharts";
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { PartnerBar } from "@/components/partner-bar";

import { LiveTicker, type TickerItem } from "@/components/live-ticker";
import { Button } from "@/components/ui/button";
import { listArenaMarkets } from "@/lib/arena.functions";
import { listFeatureFlags } from "@/lib/feature-flags.functions";
import {
  listFeaturedArticles,
  listArticles,
  listThemes,
  listCountries,
  listIndexes,
  getIndex,
  listRankings,
  getRanking,
  getDailyQuestion,
} from "@/lib/insights.functions";

const themesQ = () => queryOptions({ queryKey: ["themes"], queryFn: () => listThemes() });
const countriesQ = () => queryOptions({ queryKey: ["countries"], queryFn: () => listCountries() });
const featuredQ = () =>
  queryOptions({
    queryKey: ["home", "featured"],
    queryFn: () => listFeaturedArticles({ data: { limit: 4 } }),
  });
const articlesQ = () =>
  queryOptions({
    queryKey: ["home", "articles"],
    queryFn: () => listArticles({ data: { limit: 6 } }),
  });
const indexesQ = () => queryOptions({ queryKey: ["indexes"], queryFn: () => listIndexes() });
const rankingsQ = () => queryOptions({ queryKey: ["rankings"], queryFn: () => listRankings() });
const dailyQ = () => queryOptions({ queryKey: ["daily"], queryFn: () => getDailyQuestion() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forecast Arena — What people are thinking, and what comes next" },
      {
        name: "description",
        content:
          "Africa's free polls & predictions platform. Browse articles, live indexes, rankings, reports and a daily question — then take part and earn.",
      },
      {
        property: "og:title",
        content: "Forecast Arena — What people are thinking, and what comes next",
      },
      {
        property: "og:description",
        content:
          "Articles, indexes, rankings and live prediction markets from across Africa. Explore freely. Earn when you take part.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(themesQ());
    context.queryClient.ensureQueryData(countriesQ());
    context.queryClient.ensureQueryData(featuredQ());
    context.queryClient.ensureQueryData(articlesQ());
    context.queryClient.ensureQueryData(indexesQ());
    context.queryClient.ensureQueryData(rankingsQ());
    context.queryClient.ensureQueryData(dailyQ());
  },
  component: Index,
});

const FALLBACK_TICKER: TickerItem[] = [
  { id: "1", title: "Will CBK cut the rate in November?", probability: 62, prizePoolKes: 250000, closesIn: "3d 4h" },
  { id: "2", title: "Will fuel prices rise next EPRA review?", probability: 71, prizePoolKes: 180000, closesIn: "1d 9h" },
  { id: "3", title: "Will Safaricom beat earnings?", probability: 54, prizePoolKes: 320000, closesIn: "6d 2h" },
  { id: "4", title: "Will KPLC tariff change in Q1?", probability: 41, prizePoolKes: 140000, closesIn: "9d 11h" },
  { id: "5", title: "Will Stanbic PMI cross 50?", probability: 49, prizePoolKes: 95000, closesIn: "2d 0h" },
];

function formatCloses(iso: string | null) {
  if (!iso) return "Open";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return `${days}d ${hours}h`;
}

function Index() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: themes } = useSuspenseQuery(themesQ());
  const { data: countries } = useSuspenseQuery(countriesQ());
  const { data: featured } = useSuspenseQuery(featuredQ());
  const { data: articles } = useSuspenseQuery(articlesQ());
  const { data: indexes } = useSuspenseQuery(indexesQ());
  const { data: rankings } = useSuspenseQuery(rankingsQ());
  const { data: daily } = useSuspenseQuery(dailyQ());

  const flagsQuery = useQuery({
    queryKey: ["feature-flags"],
    queryFn: () => listFeatureFlags(),
    staleTime: 5 * 60_000,
  });
  const liveEnabled =
    flagsQuery.data?.find((f) => f.key === "arena_live_markets")?.enabled ?? false;

  const marketsQuery = useQuery({
    queryKey: ["home-arena-markets"],
    queryFn: () => listArenaMarkets(),
    enabled: liveEnabled,
    staleTime: 60_000,
  });

  const liveItems: TickerItem[] =
    liveEnabled && marketsQuery.data?.length
      ? marketsQuery.data.slice(0, 8).map((m) => {
          const yes = m.outcomes.find((o) => /yes/i.test(o.label)) ?? m.outcomes[0];
          return {
            id: m.id,
            title: m.title,
            probability: Math.round(Number(yes?.implied_probability ?? 0) * 100),
            prizePoolKes: Number(m.prize_pool_kes ?? 0),
            closesIn: formatCloses(m.closes_at),
          };
        })
      : FALLBACK_TICKER;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate({ to: "/search", search: { q: term } as any });
  }

  const featuredArticle = featured[0];
  const liveMarkets = marketsQuery.data ?? [];

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-forecast-ink text-white">
        <div className="absolute inset-0 arena-mesh opacity-90" />
        <div className="pointer-events-none absolute -right-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-arena-coral/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 md:py-32">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-semibold uppercase tracking-[0.28em] text-live-cyan"
          >
            AFRICA'S FREE POLLS & PREDICTIONS PLATFORM
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-6 max-w-5xl font-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl"
          >
            Share what you think. Predict what's next.{" "}
            <span className="text-arena-coral">Get paid in real time.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 max-w-2xl text-lg text-white/75 md:text-xl"
          >
            Answer surveys for instant rewards. Forecast the outcomes that move real
            markets — prices, elections, markets, brands — and earn when you call it right.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="bg-arena-coral text-white hover:bg-arena-coral/90"
            >
              <Link to="/signup">
                Start earning <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/arena">Explore live predictions</Link>
            </Button>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            onSubmit={submitSearch}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur"
          >
            <Search className="h-4 w-4 text-white/60" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search insights, polls, indexes, rankings…"
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-white/20"
            >
              Search
            </button>
          </motion.form>

          <p className="mt-6 text-xs text-white/60">
            Free to join&nbsp; · Your data, your choice
          </p>
        </div>

        <LiveTicker items={liveItems} />
      </section>

      {/* PARTNER BAR */}
      <section className="border-b border-border bg-card py-6">
        <div className="mx-auto max-w-7xl px-4">
          <PartnerBar variant="partners" />
        </div>
      </section>

      {/* WHAT PEOPLE ARE SAYING NOW */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeader
          eyebrow="Live now"
          title="What people are saying — right now."
          tag="Updated continuously"
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          {featuredArticle ? (
            <Link
              to="/insights/$slug"
              params={{ slug: featuredArticle.slug }}
              className="group block overflow-hidden rounded-3xl border border-foreground/10 bg-white/70 lg:col-span-7 hover:border-arena-coral/60"
            >
              <div
                className="h-56 bg-gradient-to-br from-arena-coral/30 via-forecast-gold/20 to-live-cyan/20"
                style={
                  featuredArticle.hero_image_url
                    ? {
                        backgroundImage: `url(${featuredArticle.hero_image_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              />
              <div className="p-6 md:p-7">
                <p className="text-[10px] uppercase tracking-widest text-arena-coral">
                  Featured · {(featuredArticle as any).category?.name ?? "Insight"}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold leading-tight group-hover:text-arena-coral">
                  {featuredArticle.title}
                </h3>
                {featuredArticle.dek ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {featuredArticle.dek}
                  </p>
                ) : null}
              </div>
            </Link>
          ) : null}

          <div className="grid gap-3 lg:col-span-5">
            {indexes.slice(0, 2).map((ix: any) => (
              <IndexStripCard key={ix.id} ix={ix} />
            ))}
            {daily ? <DailyQuestionMini daily={daily} /> : null}
          </div>
        </div>
      </section>

      {/* BROWSE BY THEME */}
      <section className="border-y border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeader eyebrow="Browse" title="By theme." tag="Pick what moves you" />
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {themes.map((t: any) => (
              <Link
                key={t.id}
                to="/insights"
                search={{ category: t.slug } as any}
                className="group rounded-2xl border border-foreground/10 bg-white p-4 transition-colors hover:border-arena-coral/60"
              >
                <p className="text-2xl">{t.icon}</p>
                <p className="mt-2 font-display text-sm font-semibold group-hover:text-arena-coral">
                  {t.name}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Articles · polls
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INDEXES STRIP */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeader
          eyebrow="The Indexes"
          title="Live trackers."
          tag="From the crowd, updated weekly"
          link={["See all indexes", "/indexes"]}
        />
        <div className="mt-6 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {indexes.map((ix: any) => (
            <IndexMiniCard key={ix.id} ix={ix} />
          ))}
        </div>
      </section>

      {/* TRENDING RANKINGS */}
      <section className="border-t border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeader
            eyebrow="Rankings"
            title="What Africa rates."
            tag="Brands · leaders · cities"
            link={["See all rankings", "/rankings"]}
          />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {rankings.slice(0, 3).map((r: any) => (
              <RankingMiniCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      </section>

      {/* LIVE IN THE ARENA */}
      <section className="relative overflow-hidden bg-arena-night text-white">
        <div className="absolute inset-0 arena-mesh opacity-70" />
        <div className="relative mx-auto max-w-7xl px-4 py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-live-cyan">
                Predict & earn
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
                Live in The Arena.
              </h2>
              <p className="mt-1 max-w-xl text-sm text-white/70">
                Forecast the outcomes that move real markets — and split the prize pool when
                you call it right.
              </p>
            </div>
            <Link
              to="/arena"
              className="hidden text-xs uppercase tracking-widest text-live-cyan hover:underline md:inline"
            >
              See all markets →
            </Link>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(liveMarkets.length ? liveMarkets.slice(0, 6) : FALLBACK_TICKER.slice(0, 6)).map(
              (m: any) => {
                const yes = m.outcomes?.find((o: any) => /yes/i.test(o.label)) ?? m.outcomes?.[0];
                const prob = yes
                  ? Math.round(Number(yes.implied_probability ?? 0) * 100)
                  : m.probability ?? 50;
                const pool = Number(m.prize_pool_kes ?? m.prizePoolKes ?? 0);
                const href = m.slug ? `/arena/${m.slug}` : "/arena";
                return (
                  <a
                    key={m.id}
                    href={href}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-live-cyan/60 hover:bg-white/10"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-white/55">
                      Live · forecast
                    </p>
                    <p className="mt-2 line-clamp-2 font-display text-base font-semibold group-hover:text-live-cyan">
                      {m.title}
                    </p>
                    <div className="mt-4 flex items-baseline justify-between">
                      <div>
                        <p className="font-mono text-3xl text-live-cyan">{prob}%</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/55">
                          Crowd says Yes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm text-forecast-gold">
                          KES {pool.toLocaleString()}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-white/55">
                          Prize pool
                        </p>
                      </div>
                    </div>
                  </a>
                );
              },
            )}
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-widest text-white/50">
            Illustrative · sample data shown until live markets open in your country
          </p>
        </div>
      </section>

      {/* LATEST ARTICLES */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeader
          eyebrow="Read"
          title="Latest stories."
          tag="From the polls you help create"
          link={["All articles", "/insights"]}
        />
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((a: any) => (
            <Link
              key={a.id}
              to="/insights/$slug"
              params={{ slug: a.slug }}
              className="group flex h-full flex-col rounded-2xl border border-foreground/10 bg-white/70 p-5 transition-colors hover:border-arena-coral/60"
            >
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-muted-foreground">
                  {a.category?.icon ?? ""} {a.category?.name ?? "Insight"}
                </span>
                <span className="text-muted-foreground">{a.country_code}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold leading-snug group-hover:text-arena-coral">
                {a.title}
              </h3>
              {a.dek ? (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.dek}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      {/* TWO WAYS TO TAKE PART */}
      <section className="border-y border-foreground/10 bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-arena-coral">
            Take part
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
            Two ways to earn. One platform.
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <EarnCard
              icon={<Coins className="h-5 w-5 text-forecast-gold" />}
              title="Take surveys, get paid."
              body="Share your view on the things shaping Africa — money, brands, work, daily life. Finish a survey and a cash reward lands instantly."
              cta={["Browse surveys", "/explore"]}
            />
            <EarnCard
              icon={<LineChartIcon className="h-5 w-5 text-signal-blue" />}
              title="Predict & earn."
              body="Call the next rate decision, the next election, the next price move. Lock your forecast and split the prize pool when you're proven right."
              cta={["See live markets", "/arena"]}
            />
          </div>
        </div>
      </section>

      {/* ACROSS AFRICA */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeader
          eyebrow="Geography"
          title="Across Africa."
          tag="Live in Kenya · expanding"
        />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {countries.map((c: any) =>
            c.is_live ? (
              <Link
                key={c.code}
                to="/insights"
                search={{ country: c.code } as any}
                className="rounded-2xl border border-foreground/10 bg-white/70 p-4 text-left transition-colors hover:border-arena-coral/60"
              >
                <p className="text-2xl">{c.flag_emoji}</p>
                <p className="mt-2 font-display text-sm font-semibold">{c.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Live
                </p>
              </Link>
            ) : (
              <div
                key={c.code}
                className="rounded-2xl border border-dashed border-foreground/10 bg-foreground/[0.02] p-4 text-left text-muted-foreground"
              >
                <p className="text-2xl">{c.flag_emoji}</p>
                <p className="mt-2 font-display text-sm font-semibold">{c.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Coming soon
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* FOR BRANDS */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-14 md:flex md:items-center md:justify-between md:gap-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-forecast-gold">
              For brands
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              Go beyond advertising. Learn from your audience.
            </h2>
            <p className="mt-3 text-sm opacity-80">
              Sponsor a poll, see how Africa really thinks about your category, and turn the
              answers into editorial-grade content on Insights.
            </p>
          </div>
          <Button asChild size="lg" className="mt-6 bg-forecast-gold text-foreground hover:bg-forecast-gold/90 md:mt-0">
            <Link to="/for-sponsors">
              Sponsor a poll <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-arena-night text-white">
        <div className="absolute inset-0 arena-mesh opacity-80" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Explore freely. <span className="text-forecast-gold">Earn when you take part.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/75">
            Read the articles, follow the indexes, browse the polls — and when you're ready,
            join the panel and get paid for your view.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-forecast-ink hover:bg-white/90">
              <Link to="/insights">Explore the insights</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/signup">Join & earn</Link>
            </Button>
          </div>
          <div className="mt-10">
            <PartnerBar variant="partners" />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function SectionHeader({
  eyebrow,
  title,
  tag,
  link,
}: {
  eyebrow?: string;
  title: string;
  tag?: string;
  link?: [string, string];
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-arena-coral">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">{title}</h2>
        {tag ? (
          <p className="mt-0.5 text-xs uppercase tracking-widest text-muted-foreground">{tag}</p>
        ) : null}
      </div>
      {link ? (
        <Link
          to={link[1]}
          className="text-xs uppercase tracking-widest text-arena-coral hover:underline"
        >
          {link[0]} →
        </Link>
      ) : null}
    </div>
  );
}

function EarnCard({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: [string, string];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-7"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{body}</p>
      <Button asChild variant="link" className="mt-3 px-0">
        <Link to={cta[1]}>
          {cta[0]} <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </motion.div>
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
    <Link
      to="/indexes/$slug"
      params={{ slug: ix.slug }}
      className="group block w-[260px] shrink-0 snap-start rounded-2xl border border-foreground/10 bg-white p-4 transition-colors hover:border-arena-coral/60"
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {ix.category?.icon ?? ""} {ix.category?.name ?? "Index"}
      </p>
      <p className="mt-1 font-display text-sm font-semibold leading-snug">{ix.name}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-2xl">{ix.latest_value}</span>
        <span className={`font-mono text-xs ${up ? "text-live-cyan" : "text-arena-coral"}`}>
          {up ? "▲" : "▼"} {Math.abs(change)}
        </span>
      </div>
      <div className="mt-2 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip contentStyle={{ fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={up ? "#06b6d4" : "#ff5a4d"}
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
    </Link>
  );
}

function IndexStripCard({ ix }: { ix: any }) {
  const change = Number(ix.change_value ?? 0);
  const up = change >= 0;
  return (
    <Link
      to="/indexes/$slug"
      params={{ slug: ix.slug }}
      className="group flex items-center justify-between rounded-2xl border border-foreground/10 bg-white/70 p-4 hover:border-arena-coral/60"
    >
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {ix.category?.icon ?? ""} Live index
        </p>
        <p className="mt-1 font-display text-sm font-semibold group-hover:text-arena-coral">
          {ix.name}
        </p>
      </div>
      <div className="text-right">
        <p className="font-mono text-xl">{ix.latest_value}</p>
        <p className={`font-mono text-xs ${up ? "text-live-cyan" : "text-arena-coral"}`}>
          {up ? "▲" : "▼"} {Math.abs(change)}
        </p>
      </div>
    </Link>
  );
}

function RankingMiniCard({ r }: { r: any }) {
  const { data } = useQuery({
    queryKey: ["ranking", r.slug],
    queryFn: () => getRanking({ data: { slug: r.slug } }),
  });
  const entries = (data?.entries ?? []) as Array<{ label: string; score: number; rank: number }>;
  return (
    <Link
      to="/rankings/$slug"
      params={{ slug: r.slug }}
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
              <span className="mr-2 inline-block w-4 text-xs text-muted-foreground">{e.rank}</span>
              {e.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{e.score}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[10px] uppercase tracking-widest text-arena-coral">
        See full ranking →
      </p>
    </Link>
  );
}

function DailyQuestionMini({ daily }: { daily: any }) {
  const results = (daily.results ?? []) as Array<{ label: string; pct: number }>;
  const top = results[0];
  return (
    <Link
      to="/insights"
      className="group block rounded-2xl border border-foreground/10 bg-gradient-to-br from-arena-coral/10 to-forecast-gold/10 p-4 hover:border-arena-coral/60"
    >
      <p className="text-[10px] uppercase tracking-widest text-arena-coral">
        Question of the day
      </p>
      <p className="mt-1 font-display text-sm font-semibold leading-snug group-hover:text-arena-coral">
        {daily.question}
      </p>
      {top ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Crowd leading: <span className="font-semibold text-foreground">{top.label}</span> ·{" "}
          <span className="font-mono">{top.pct}%</span>
        </p>
      ) : null}
    </Link>
  );
}
