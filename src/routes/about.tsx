import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Forecast Arena" },
      {
        name: "description",
        content:
          "The market intelligence mature economies take for granted — built for Africa, starting in Kenya. Independent research by Econsult Africa.",
      },
      { property: "og:title", content: "About — Forecast Arena" },
      {
        property: "og:description",
        content: "The market intelligence mature economies take for granted — built for Africa.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="About"
        title="Built in Nairobi. Made for Africa."
        subtitle="The market intelligence mature economies take for granted — built for Africa, starting in Kenya. We're building the continent's first community of paid pollsters and forecasters."
      />

      <section className="mx-auto max-w-4xl px-4 py-16 prose-look">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          The mission
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
          One opted-in panel. One credible voice for Africa's markets.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Forecast Arena pays people to share what they think and predict what's next —
          producing research, content, and live indexes that brands, investors, and
          institutions can actually use. Powered by Econsult Africa. Distributed with The
          Kenyan Wall Street. Made in Nairobi, for Africa.
        </p>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            How the partnership works
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            Research, newsroom, and platform — in one stack.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <PartnerCard
              eyebrow="Tier 1"
              title="Powered by Econsult Africa"
              body="The independent research engine and credibility stamp. Designs every instrument, stands behind every number. Present on every poll, report, and index."
            />
            <PartnerCard
              eyebrow="Tier 2"
              title="Official Media Partner — The Kenyan Wall Street"
              body="Our pioneer media partner and Kenya's leading business newsroom — the editorial and distribution home for the data."
            />
            <PartnerCard
              eyebrow="Tier 3"
              title="Sponsors"
              body="The brands that fund the polls and walk away with research, reach, and reward. Shown clearly on every poll they back."
            />
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Across Africa — we're adding media partners country by country as the
            platform grows.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            How we keep it rigorous
          </p>
          <h3 className="mt-3 font-display text-2xl font-bold">Built to be believed.</h3>
          <p className="mt-4 text-muted-foreground">
            Attention and consistency checks. Identity and de-duplication controls.
            Demographic weighting against known benchmarks. A published methodology note
            for every poll. Every prediction ties to a documented, public source — fixed
            before the poll opens.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Ethics & trust
          </p>
          <h3 className="mt-3 font-display text-2xl font-bold">Rewarding, not risky.</h3>
          <p className="mt-4 text-muted-foreground">
            On sponsored polls, participation is free, rewards are sponsor-funded, and
            outcomes are independently verified. Paid research participation, not
            gambling. The user-staked product is being built compliantly through the CMA
            Regulatory Sandbox.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            The team
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold">Who's behind it.</h2>
          <div className="mt-8 rounded-2xl border border-border bg-background p-6">
            <h3 className="font-display text-xl font-semibold">
              Prince Muraguri — Founder & Chief Economist, Econsult Africa
            </h3>
            <p className="mt-3 text-muted-foreground">
              A development economist and TEDx speaker whose work spans economic
              research, survey design, and impact evaluation, with experience across
              international research programmes and institutions. He hosts{" "}
              <span className="text-foreground">The Opportunity</span> podcast.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-arena-night text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Built in Nairobi. Made for Africa.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">
            The same engine, country by country, until "run a poll with Forecast Arena"
            is how the continent's brands, investors, and institutions learn what people
            think, and what comes next.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
              <Link to="/signup">Join the panel</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link to="/for-sponsors">Partner with us →</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function PartnerCard({
  eyebrow, title, body,
}: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
      <h3 className="mt-2 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
