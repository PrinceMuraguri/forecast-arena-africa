import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { Input } from "@/components/ui/input";
import { globalSearch } from "@/lib/explore.functions";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search — Forecast Arena" },
      { name: "description", content: "Search across articles, polls, indexes, rankings, and reports." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

const GROUPS: { kind: string; label: string; path: string }[] = [
  { kind: "article", label: "Articles", path: "/insights" },
  { kind: "poll", label: "Polls", path: "/polls" },
  { kind: "index", label: "Indexes", path: "/indexes" },
  { kind: "ranking", label: "Rankings", path: "/rankings" },
  { kind: "report", label: "Reports", path: "/reports" },
];

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  useEffect(() => setQ(initialQ ?? ""), [initialQ]);

  const { data: hits, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => globalSearch({ data: { q } }),
    enabled: q.trim().length >= 2,
  });

  const grouped: Record<string, NonNullable<typeof hits>> = {};
  (hits ?? []).forEach((h) => {
    (grouped[h.kind] ||= []).push(h);
  });

  return (
    <SiteShell>
      <PageHero
        eyebrow="Search"
        title="Find anything Africa is asking."
        subtitle="Articles, polls, indexes, rankings, reports — one search."
      />
      <section className="mx-auto max-w-3xl px-4 py-6">
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for inflation, brands, elections…"
          className="h-12 text-base"
        />
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        {q.trim().length < 2 ? (
          <p className="text-center text-muted-foreground">
            Type at least 2 characters to search.
          </p>
        ) : isFetching && !hits ? (
          <p className="text-center text-muted-foreground">Searching…</p>
        ) : !hits || hits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              No matches for <span className="font-medium text-foreground">"{q}"</span>.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a broader term, or{" "}
              <Link to="/explore" className="text-primary underline">
                browse all polls
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {GROUPS.map((g) => {
              const items = grouped[g.kind] ?? [];
              if (items.length === 0) return null;
              return (
                <div key={g.kind}>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-semibold">{g.label}</h2>
                    <span className="text-xs text-muted-foreground">{items.length} result{items.length === 1 ? "" : "s"}</span>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {items.map((h) => (
                      <li key={`${h.kind}-${h.slug}`}>
                        <Link
                          to={`${g.path}/$slug` as any}
                          params={{ slug: h.slug }}
                          className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-md"
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                            {g.label.slice(0, -1)}
                          </div>
                          <div className="mt-1 font-medium">{h.title}</div>
                          {h.subtitle && (
                            <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {h.subtitle}
                            </div>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
