import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-sponsors")({
  head: () => ({
    meta: [
      { title: "For Sponsors — Forecast Arena" },
      {
        name: "description",
        content:
          "Go beyond advertising. Learn from your audience. Sponsor a poll and get three assets from one budget: research, content, and brand experience.",
      },
      { property: "og:title", content: "For Sponsors — Forecast Arena" },
      {
        property: "og:description",
        content: "Go beyond advertising. Learn from your audience.",
      },
    ],
  }),
  component: ForSponsorsPage,
});

const PROBLEMS = [
  {
    title: "Readers consume, then leave.",
    body: "Engagement ends the moment interest peaks. A poll turns a passive reader into an active participant who's taken a position — and has a reason to come back.",
  },
  {
    title: "Your own poll isn't credible.",
    body: "“You asked your own followers” kills a number's commercial value. An independent research firm with a published methodology makes it citable, sellable, syndicable.",
  },
  {
    title: "Surveys don't get finished.",
    body: "The hardest thing in research is getting people to start and complete. Our prediction incentive is engineered to solve exactly that.",
  },
  {
    title: "Data journalism needs data.",
    body: "Bloomberg, the FT, and Morning Consult compete on proprietary numbers. We supply both the data and the talent to visualise it.",
  },
];

const REVENUE_LINES = [
  { label: "Poll design & hosting", weight: 1 },
  { label: "Article pipeline (newsroom distribution)", weight: 1 },
  { label: "The Opportunity podcast episode", weight: 0.8 },
  { label: "Participation & prize pool", weight: 1.4 },
  { label: "Data analysis & visualisation", weight: 0.9 },
];

function ForSponsorsPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="For Sponsors & Partners"
        title="Go beyond advertising. Learn from your audience."
        subtitle="Sponsor a poll and get three assets from a single budget: rigorous market research, a published content series across a leading newsroom, and your brand on an experience people actually enjoy."
      />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          The problem we solve
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
          Four problems. One product.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            One budget, five assets
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            A sponsor's budget isn't one fee. It funds five lines.
          </h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Where a client engagement used to mean an article and maybe a podcast, it now
            means up to five billable components from one budget — and the prize pool is
            funded by the sponsor, not by either partner.
          </p>

          <div className="mt-10 space-y-3">
            {REVENUE_LINES.map((line) => (
              <div key={line.label} className="flex items-center gap-4">
                <span className="w-64 shrink-0 font-medium">{line.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-arena-coral"
                    style={{ width: `${Math.min(100, line.weight * 60)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          How we keep it rigorous
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
          Built to be believed.
        </h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Attention and consistency checks on every instrument. Identity and
          de-duplication controls, so one person can't stuff a poll. Demographic weighting
          against known benchmarks. A published methodology note for every poll. And a
          resolution discipline that ties each prediction to an objective public source,
          fixed before the poll opens.
        </p>
      </section>

      <section className="border-t border-border bg-arena-night text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Ready to sponsor a poll?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Research, distribution, and brand exposure in one product. Tell us the
            question you'd like answered — we'll come back with a proposal.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
              <a href="mailto:sponsors@forecast.africa">Sponsor a poll →</a>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link to="/rewards">See the product catalogue →</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
