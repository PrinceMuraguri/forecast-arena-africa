import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMySponsorOrgs, getSponsorMarkets } from "@/lib/sponsor.functions";
import { Building2, Users, TrendingUp, Coins } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/sponsor")({
  head: () => ({
    meta: [{ title: "Sponsor Portal — Forecast Arena" }],
  }),
  validateSearch: z.object({ org: z.string().optional() }),
  component: SponsorPortal,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-16 text-white">
        <h1 className="text-2xl font-bold">Couldn't load sponsor portal</h1>
        <p className="mt-2 text-white/70">{error.message}</p>
        <Button className="mt-4" onClick={reset}>Retry</Button>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-16 text-white">Not found.</div>
    </AppShell>
  ),
});

function SponsorPortal() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const orgsQuery = useQuery({
    queryKey: ["sponsor-orgs"],
    queryFn: () => getMySponsorOrgs(),
  });

  const orgs = orgsQuery.data ?? [];
  const activeSlug = search.org ?? orgs[0]?.slug;

  if (orgsQuery.isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-16 text-white/70">Loading…</div>
      </AppShell>
    );
  }

  if (!orgs.length) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-white">
          <Building2 className="h-10 w-10 text-forecast-gold" />
          <h1 className="mt-4 font-display text-3xl font-bold">Sponsor Portal</h1>
          <p className="mt-3 text-white/70">
            You're not yet linked to a sponsor organization. To get a sponsored market
            commissioned on Forecast Arena, reach out and we'll set up your workspace.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild className="bg-arena-coral text-white hover:bg-arena-coral/90">
              <Link to="/for-sponsors">Become a sponsor</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-live-cyan">
              Sponsor Portal
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
              Market performance
            </h1>
            <p className="mt-2 text-white/70">
              Live signal from every market your organization sponsors.
            </p>
          </div>
        </div>

        {orgs.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {orgs.map((o) => (
              <button
                key={o.id}
                onClick={() => navigate({ to: "/sponsor", search: { org: o.slug } })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  o.slug === activeSlug
                    ? "border-live-cyan bg-live-cyan/15 text-live-cyan"
                    : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {o.name}
              </button>
            ))}
          </div>
        )}

        {activeSlug && <SponsorMarketsPanel slug={activeSlug} />}
      </div>
    </AppShell>
  );
}

function SponsorMarketsPanel({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ["sponsor-markets", slug],
    queryFn: () => getSponsorMarkets({ data: { orgSlug: slug } }),
  });

  if (query.isLoading) {
    return <div className="mt-10 text-white/60">Loading markets…</div>;
  }
  const markets = query.data ?? [];
  if (!markets.length) {
    return (
      <Card className="mt-10 border-white/10 bg-white/5 text-white">
        <CardContent className="py-10 text-center text-white/70">
          No markets yet for this organization.
        </CardContent>
      </Card>
    );
  }

  const totals = markets.reduce(
    (acc, m) => {
      acc.predictions += m.predictions_count;
      acc.participants += m.unique_participants;
      acc.pool += m.prize_pool_kes;
      return acc;
    },
    { predictions: 0, participants: 0, pool: 0 },
  );

  return (
    <>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total forecasts" value={totals.predictions.toLocaleString()} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Unique participants" value={totals.participants.toLocaleString()} />
        <StatCard icon={<Coins className="h-4 w-4" />} label="Prize pool deployed" value={`KES ${totals.pool.toLocaleString()}`} />
      </div>

      <div className="mt-8 space-y-4">
        {markets.map((m) => (
          <MarketRow key={m.id} m={m} />
        ))}
      </div>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
          {icon} {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-mono-data text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function MarketRow({ m }: { m: ReturnType<typeof useQuery<Awaited<ReturnType<typeof getSponsorMarkets>>>>["data"] extends (infer T)[] | undefined ? T : never }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`border-white/20 text-[10px] uppercase tracking-widest ${
                m.status === "open"
                  ? "bg-live-cyan/15 text-live-cyan"
                  : m.status === "resolved"
                    ? "bg-forecast-gold/15 text-forecast-gold"
                    : "bg-white/10 text-white/70"
              }`}
            >
              {m.status}
            </Badge>
            {m.closes_at && (
              <span className="text-xs text-white/50">
                Closes {new Date(m.closes_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <CardTitle className="mt-2 text-lg text-white">
            <Link to="/arena/$slug" params={{ slug: m.slug }} className="hover:text-live-cyan">
              {m.title}
            </Link>
          </CardTitle>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-white/50">Prize pool</p>
          <p className="font-mono-data text-lg font-bold text-forecast-gold">
            KES {m.prize_pool_kes.toLocaleString()}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Forecasts</p>
            <p className="font-mono-data text-base">{m.predictions_count}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Participants</p>
            <p className="font-mono-data text-base">{m.unique_participants}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Avg confidence</p>
            <p className="font-mono-data text-base">
              {m.avg_confidence != null ? `${Math.round(m.avg_confidence)}%` : "—"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-medium text-live-cyan hover:underline"
        >
          {open ? "Hide" : "Show"} probability breakdown
        </button>
        {open && (
          <div className="space-y-2">
            {m.outcomes.map((o) => (
              <div key={o.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={o.is_winning ? "text-forecast-gold" : "text-white/80"}>
                    {o.label}
                    {o.is_winning && " · Winner"}
                  </span>
                  <span className="font-mono-data">{Math.round(o.implied_probability * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-white/10">
                  <div
                    className={`h-full ${o.is_winning ? "bg-forecast-gold" : "bg-live-cyan"}`}
                    style={{ width: `${Math.round(o.implied_probability * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
