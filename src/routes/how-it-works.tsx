import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Forecast Arena" },
      {
        name: "description",
        content:
          "Two layers. One questionnaire. You win on both. Finish a survey, earn instantly. Call the prediction right, share the prize pool.",
      },
      { property: "og:title", content: "How It Works — Forecast Arena" },
      {
        property: "og:description",
        content: "Two layers. One questionnaire. You win on both.",
      },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="How It Works"
        title="Two layers. One questionnaire. You win on both."
        subtitle="Every poll on Forecast Arena does two things at once: it asks what you think, and it asks what you think will happen. Answer the first, earn instantly. Call the second right, share the prize."
      />

      <section className="mx-auto max-w-5xl px-4 py-16">
        <Eyebrow>The big idea</Eyebrow>
        <H2>It's not an ordinary poll.</H2>
        <Body>
          A normal survey is a chore — you give your opinion and get nothing back. We
          rebuilt it. The first half is the research a sponsor pays for. The second half
          is a live prediction with real money on the line. The prediction sits at the
          end on purpose: it pulls you through the whole thing, so you finish, and so the
          data is good. You get rewarded twice. The sponsor gets research people
          actually complete.
        </Body>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
          <Step
            tone="coral"
            n="01"
            title="Share what you think."
            body="A short set of questions on something you have a view on — your money, the brands you use, your work, daily life across the continent. One question at a time, smart follow-ups, clean and quick. Finish it and a cash reward lands immediately, straight to M-Pesa."
            pull="Finish the survey. Earn on the spot."
          />
          <Step
            tone="cyan"
            n="02"
            title="Predict what's next."
            body="Then the fun part. A few forward-looking questions whose answers will be known later — will the central bank cut the rate? Will fuel prices rise? You lock your call, and it joins thousands of others to form a live, crowd-powered probability."
            pull="Watch the odds move. See if you're ahead of the crowd."
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <Eyebrow>The dual reward</Eyebrow>
        <H2>Money now, and money later.</H2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card title="Now" tone="gold">
            A completion reward the moment you finish, funded by the sponsor. Small,
            instant, yours.
          </Card>
          <Card title="Later" tone="cyan">
            A share of the prize pool when your prediction proves right, paid the day the
            real result lands. One pool, split among everyone who called it.
          </Card>
        </div>
        <p className="mt-6 text-sm italic text-muted-foreground">
          Instant gratification, plus a reason to come back. That's the habit.
        </p>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <Eyebrow>Two kinds of prediction</Eyebrow>
          <H2>Free to play, or stake your own.</H2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card title="Sponsored predictions (free)">
              The sponsor funds the prize pool, so you can win real money without
              risking any of your own. A safe, free way to experience prediction
              markets, and the perfect on-ramp.
            </Card>
            <Card title="Staked predictions (coming soon)">
              Markets where you stake your own capital and win bigger when you're right —
              proper prediction-market trading, in the spirit of Polymarket and Kalshi,
              built for Africa.
            </Card>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Staked markets launch progressively as we complete regulatory approval,
            including the Capital Markets Authority Regulatory Sandbox in Kenya.
            Sponsored predictions are live now.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 grid gap-12 md:grid-cols-2">
        <div>
          <Eyebrow>How outcomes resolve</Eyebrow>
          <H3>No arguments. Just the official number.</H3>
          <Body>
            Every prediction is tied to a documented, public source before the poll opens
            — a central bank decision, a statistics-bureau release, a regulator's data,
            an electoral commission. When that source publishes, the question resolves
            automatically against it.
          </Body>
        </div>
        <div>
          <Eyebrow>Why it's not gambling</Eyebrow>
          <H3>This is paid research. Not a bet.</H3>
          <Body>
            On sponsored polls you risk nothing of your own — the reward comes from the
            sponsor, and what you're doing is answering research and prediction
            questions. The same category as YouGov and Prolific, brought to Africa for
            the first time at scale.
          </Body>
        </div>
      </section>

      <section className="border-t border-border bg-arena-night text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <Eyebrow className="text-live-cyan">Built for Africa</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            One voice for Africa's markets.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Every poll you take makes the panel bigger and the picture sharper. Your
            view is part of something that, together, no one has ever measured before.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
              <Link to="/signup">Join the panel — it's free</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link to="/arena">Jump to the Arena →</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.25em] text-primary ${className}`}>
      {children}
    </p>
  );
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">{children}</h3>;
}
function Body({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{children}</p>;
}
function Step({
  tone, n, title, body, pull,
}: { tone: "coral" | "cyan"; n: string; title: string; body: string; pull: string }) {
  const accent = tone === "coral" ? "text-arena-coral" : "text-live-cyan";
  return (
    <div className="rounded-2xl border border-border bg-background p-8">
      <p className={`font-mono-data text-sm ${accent}`}>{n}</p>
      <h3 className="mt-2 font-display text-2xl font-bold">{title}</h3>
      <p className="mt-3 text-muted-foreground">{body}</p>
      <p className={`mt-6 border-l-2 pl-4 text-sm italic ${accent} border-current`}>{pull}</p>
    </div>
  );
}
function Card({
  title, children, tone,
}: { title: string; children: React.ReactNode; tone?: "gold" | "cyan" }) {
  const accent = tone === "gold" ? "text-forecast-gold" : tone === "cyan" ? "text-live-cyan" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <p className={`font-display text-lg font-semibold ${accent}`}>{title}</p>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </div>
  );
}
