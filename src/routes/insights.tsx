import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { listInsightsPolls, listCategories } from "@/lib/arena.functions";

const pollsQuery = () =>
  queryOptions({
    queryKey: ["insights", "polls"],
    queryFn: () => listInsightsPolls(),
  });

const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/insights")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Insights — Forecast Arena" },
      {
        name: "description",
        content:
          "Articles, reports, the live indexes, and The Opportunity Podcast. Independent research from Econsult Africa.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(pollsQuery());
    context.queryClient.ensureQueryData(categoriesQuery());
  },
  component: InsightsPage,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl">Insights are loading slowly.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">No polls.</div>
    </SiteShell>
  ),
});

function InsightsPage() {
  const { data: polls } = useSuspenseQuery(pollsQuery());
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/insights" });

  const filtered = category ? polls.filter((p) => p.category?.slug === category) : polls;

  return (
    <SiteShell>
      <PageHero
        eyebrow="Insights"
        title="Read what Africa is telling us."
        subtitle="Articles, reports, the live indexes, and The Opportunity Podcast — every poll becomes a story."
      />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold">Open polls</h2>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {filtered.length} live
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip
            active={!category}
            onClick={() => navigate({ search: { category: undefined } })}
            label="All"
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={category === c.slug}
              onClick={() => navigate({ search: { category: c.slug } })}
              label={c.name}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-foreground/10 bg-white/60 p-10 text-center">
            <p>No live polls in this category right now — new questions go out weekly.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {filtered.map((poll) => (
              <li
                key={poll.id}
                className="rounded-2xl border border-foreground/10 bg-white/70 p-6 transition-colors hover:border-arena-coral/60"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {poll.category?.name ?? "Poll"}
                  {poll.sponsor_name ? ` · ${poll.sponsor_name}` : ""}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug">
                  {poll.title}
                </h3>
                {poll.summary ? (
                  <p className="mt-2 text-sm text-muted-foreground">{poll.summary}</p>
                ) : null}
                {poll.closes_at ? (
                  <p className="mt-4 text-xs font-mono uppercase tracking-widest text-arena-coral">
                    Closes {new Date(poll.closes_at).toLocaleDateString()}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteShell>
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
