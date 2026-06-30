import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { listThemes, listCountries } from "@/lib/insights.functions";
import { listPollsCatalogue } from "@/lib/explore.functions";

const themesQuery = () =>
  queryOptions({ queryKey: ["themes"], queryFn: () => listThemes() });

const countriesQuery = () =>
  queryOptions({ queryKey: ["countries"], queryFn: () => listCountries() });

const catalogueQuery = (input: {
  category?: string;
  country?: string;
  kind?: string;
  q?: string;
}) =>
  queryOptions({
    queryKey: ["explore", "polls", input],
    queryFn: () => listPollsCatalogue({ data: input }),
  });

const searchSchema = z.object({
  category: z.string().optional(),
  country: z.string().optional(),
  kind: z.enum(["survey", "prediction", "tracker"]).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/explore")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  head: () => ({
    meta: [
      { title: "Explore — Forecast Arena" },
      {
        name: "description",
        content:
          "Browse every poll, survey and prediction shaping Africa — by theme, country, and kind.",
      },
    ],
  }),
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(themesQuery());
    context.queryClient.ensureQueryData(countriesQuery());
    context.queryClient.ensureQueryData(catalogueQuery(deps));
  },
  component: ExplorePage,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl">Couldn't load the catalogue.</h1>
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

function ExplorePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const { data: themes } = useSuspenseQuery(themesQuery());
  const { data: countries } = useSuspenseQuery(countriesQuery());
  const { data: polls } = useSuspenseQuery(catalogueQuery(search));
  const [qDraft, setQDraft] = useState(search.q ?? "");

  function update(patch: Partial<typeof search>) {
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  }

  const grouped = !search.category && !search.country && !search.kind && !search.q;

  return (
    <SiteShell>
      <PageHero
        eyebrow="Explore"
        title="Every question we're asking."
        subtitle="Browse the polls, surveys, and predictions shaping Africa — by theme and country."
      />

      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: qDraft.trim() || undefined });
          }}
          className="flex gap-2"
        >
          <input
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Search polls, surveys, predictions…"
            className="flex-1 rounded-full border border-foreground/15 bg-white px-4 py-2 text-sm focus:border-arena-coral focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-arena-coral px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white hover:bg-arena-coral/90"
          >
            Search
          </button>
        </form>

        {/* Kind filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip active={!search.kind} onClick={() => update({ kind: undefined })} label="All kinds" />
          <Chip active={search.kind === "survey"} onClick={() => update({ kind: "survey" })} label="Surveys" />
          <Chip
            active={search.kind === "prediction"}
            onClick={() => update({ kind: "prediction" })}
            label="Predictions"
          />
          <Chip
            active={search.kind === "tracker"}
            onClick={() => update({ kind: "tracker" })}
            label="Trackers"
          />
        </div>

        {/* Country filter */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            active={!search.country}
            onClick={() => update({ country: undefined })}
            label="All countries"
          />
          {countries.map((c) => (
            <Chip
              key={c.code}
              active={search.country === c.code}
              onClick={() => update({ country: c.code })}
              label={`${c.flag_emoji ?? ""} ${c.name}${c.is_live ? "" : " ·  soon"}`}
            />
          ))}
        </div>

        {/* Theme filter */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            active={!search.category}
            onClick={() => update({ category: undefined })}
            label="All themes"
          />
          {themes.map((t) => (
            <Chip
              key={t.id}
              active={search.category === t.slug}
              onClick={() => update({ category: t.slug })}
              label={`${t.icon ?? ""} ${t.name}`}
            />
          ))}
        </div>

        {/* Results */}
        {polls.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-foreground/10 bg-white/60 p-10 text-center">
            <p className="font-display text-lg">No polls match those filters.</p>
            <p className="mt-2 text-sm text-muted-foreground">Try clearing a filter.</p>
          </div>
        ) : grouped ? (
          <GroupedByTheme polls={polls} themes={themes} countries={countries} />
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((p) => (
              <PollCard key={p.id} poll={p} countries={countries} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function GroupedByTheme({
  polls,
  themes,
  countries,
}: {
  polls: any[];
  themes: any[];
  countries: any[];
}) {
  const byTheme = new Map<string, any[]>();
  polls.forEach((p) => {
    const k = p.category?.slug ?? "other";
    if (!byTheme.has(k)) byTheme.set(k, []);
    byTheme.get(k)!.push(p);
  });
  return (
    <div className="mt-10 space-y-12">
      {themes
        .filter((t) => byTheme.has(t.slug))
        .map((t) => (
          <div key={t.id}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold">
                {t.icon ? <span className="mr-2">{t.icon}</span> : null}
                {t.name}
              </h2>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {byTheme.get(t.slug)!.length} polls
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {byTheme.get(t.slug)!.map((p) => (
                <PollCard key={p.id} poll={p} countries={countries} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function PollCard({ poll, countries }: { poll: any; countries: any[] }) {
  const country = countries.find((c) => c.code === poll.country_code);
  const status = pollStatus(poll);
  const reward = Number(poll.completion_reward_kes ?? poll.reward_kes ?? 0);
  return (
    <Link
      to="/polls/$slug"
      params={{ slug: poll.slug }}
      className="group flex h-full flex-col rounded-2xl border border-foreground/10 bg-white/70 p-5 transition-colors hover:border-arena-coral/60"
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
        <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-muted-foreground">
          {poll.category?.icon ?? ""} {poll.category?.name ?? "Theme"}
        </span>
        <span className="text-muted-foreground">
          {country?.flag_emoji} {country?.name ?? poll.country_code}
        </span>
      </div>
      <h3 className="mt-3 font-display text-base font-semibold leading-snug group-hover:text-arena-coral">
        {poll.title}
      </h3>
      {poll.summary ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{poll.summary}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
        <span className={`rounded-full px-2 py-0.5 ${status.cls}`}>{status.label}</span>
        {reward > 0 ? (
          <span className="rounded-full bg-forecast-gold/10 px-2 py-0.5 text-forecast-gold">
            KES {reward.toLocaleString()}
          </span>
        ) : null}
        {poll.kind ? (
          <span className="text-muted-foreground">{poll.kind}</span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{poll.respondent_count ?? 0} respondents</span>
        {poll.sponsor_name ? <span>w/ {poll.sponsor_name}</span> : null}
      </div>
    </Link>
  );
}

function pollStatus(p: any): { label: string; cls: string } {
  if (p.status === "closed")
    return { label: "Results in", cls: "bg-forecast-gold/10 text-forecast-gold" };
  if (p.closes_at) {
    const ms = new Date(p.closes_at).getTime() - Date.now();
    if (ms > 0 && ms < 1000 * 60 * 60 * 48)
      return { label: "Closing soon", cls: "bg-arena-coral/10 text-arena-coral" };
  }
  return { label: "Open", cls: "bg-live-cyan/10 text-live-cyan" };
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
