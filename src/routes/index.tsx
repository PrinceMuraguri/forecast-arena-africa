import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Coins, LineChart } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PartnerBar } from "@/components/partner-bar";
import { ProbabilityOrb } from "@/components/probability-orb";
import { LiveTicker, type TickerItem } from "@/components/live-ticker";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forecast Arena — Africa's Polls & Predictions Platform" },
      {
        name: "description",
        content:
          "Share what you think. Predict what's next. Get paid for both. Powered by Econsult Africa.",
      },
      { property: "og:title", content: "Forecast Arena — Africa's Polls & Predictions Platform" },
      {
        property: "og:description",
        content:
          "Take surveys for instant rewards. Forecast outcomes that move the continent — and earn when you call it right.",
      },
    ],
  }),
  component: Index,
});

const TICKER: TickerItem[] = [
  { id: "1", title: "Will CBK cut the rate in November?", probability: 62, prizePoolKes: 250000, closesIn: "3d 4h" },
  { id: "2", title: "Will fuel prices rise next EPRA review?", probability: 71, prizePoolKes: 180000, closesIn: "1d 9h" },
  { id: "3", title: "Will Safaricom beat earnings?", probability: 54, prizePoolKes: 320000, closesIn: "6d 2h" },
  { id: "4", title: "Will KPLC tariff change in Q1?", probability: 41, prizePoolKes: 140000, closesIn: "9d 11h" },
  { id: "5", title: "Will Stanbic PMI cross 50?", probability: 49, prizePoolKes: 95000, closesIn: "2d 0h" },
];

function Index() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-forecast-ink text-white">
        <div className="absolute inset-0 arena-mesh opacity-90" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs font-semibold uppercase tracking-[0.25em] text-live-cyan"
            >
              Africa's Polls & Predictions Platform
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl"
            >
              Share what you think. Predict what's next.{" "}
              <span className="text-arena-coral">Get paid for both.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 max-w-xl text-lg text-white/75"
            >
              Answer surveys for instant rewards. Forecast the outcomes that
              move the continent — prices, elections, markets, brands — and
              earn when you call it right. Every question designed and verified
              by independent research from Econsult Africa.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button asChild size="lg" className="bg-arena-coral text-white hover:bg-arena-coral/90">
                <Link to="/signup">
                  Start earning <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/arena">Explore live predictions</Link>
              </Button>
            </motion.div>
            <p className="mt-5 text-xs text-white/55">
              Free to join · Paid straight to M-Pesa · Your data, your choice
            </p>
          </div>

          <div className="md:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto flex max-w-sm flex-col items-center gap-4 rounded-3xl glass-card p-8"
            >
              <ProbabilityOrb
                probability={62}
                size={220}
                label="Will CBK cut the rate in November? Crowd says 62% Yes."
              />
              <div className="grid w-full grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/60">
                    Prize pool
                  </p>
                  <p className="font-mono-data text-lg text-forecast-gold">
                    KES 250,000
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-white/60">
                    Closes in
                  </p>
                  <p className="font-mono-data text-lg text-live-cyan">3d 4h</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <LiveTicker items={TICKER} />
      </section>

      {/* PARTNER BAR */}
      <section className="border-b border-border bg-card py-6">
        <div className="mx-auto max-w-7xl px-4">
          <PartnerBar variant="partners" />
        </div>
      </section>

      {/* TWO WAYS TO EARN */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          Two ways to earn. One platform.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <EarnCard
            icon={<Coins className="h-5 w-5 text-forecast-gold" />}
            title="Take surveys, get paid."
            body="Share your view on the things shaping Africa — money, brands, work, daily life. Finish a survey and a cash reward lands instantly. No catch: the sponsor funds it, you earn from it."
            cta={["Browse surveys", "/arena"]}
          />
          <EarnCard
            icon={<LineChart className="h-5 w-5 text-signal-blue" />}
            title="Predict & earn."
            body="Call the next rate decision, the next election, the next price move. Lock your forecast, watch the crowd's odds shift live, and split the prize pool when you're proven right."
            cta={["See live markets", "/arena"]}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              How it works
            </h2>
            <p className="mt-2 text-muted-foreground">
              Two layers. One questionnaire. You win on both.
            </p>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            <Step n="1" title="Answer.">
              Pick a poll and share what you think. Finish it and earn a cash
              reward on the spot — straight to M-Pesa.
            </Step>
            <Step n="2" title="Predict.">
              Then forecast what happens next. Your call joins thousands of
              others to form a live, crowd-powered probability.
            </Step>
            <Step n="3" title="Earn.">
              When the real result lands — verified against official sources —
              everyone who called it right shares the prize pool.
            </Step>
          </ol>
          <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
            On sponsored polls, the sponsor funds the prize. You never risk
            your own money.
          </p>
          <Button asChild variant="link" className="mt-2 px-0">
            <Link to="/how-it-works">
              See how it works <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CREDIBLE BY DESIGN */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="font-display text-3xl font-bold md:text-4xl">
          Credible by design.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <TrustCard
            title="Independent research."
            body="Every number is designed and stood behind by Econsult Africa, an independent economics research firm. Citable, defensible, real."
          />
          <TrustCard
            title="Verified outcomes."
            body="Every prediction resolves against an official public source — central banks, statistics bureaus, regulators. No ambiguity about who won."
          />
          <TrustCard
            title="Not gambling."
            body="On sponsored polls you risk nothing. Rewards come from sponsors. This is paid research participation — the model behind YouGov and Prolific — brought to Africa."
          />
        </div>
      </section>

      {/* FINAL CALL */}
      <section className="relative overflow-hidden bg-arena-night text-white">
        <div className="absolute inset-0 arena-mesh opacity-80" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Your opinion has value. <span className="text-forecast-gold">Your foresight pays.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/75">
            Join Forecast Arena, take your first survey in two minutes, and get
            paid for it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-arena-coral text-white hover:bg-arena-coral/90">
              <Link to="/signup">Start earning</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/for-sponsors">I'm a brand → Sponsor a poll</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
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

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-6">
      <span className="font-mono-data text-3xl text-arena-coral">{n}</span>
      <h3 className="mt-2 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </li>
  );
}

function TrustCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <BadgeCheck className="h-5 w-5 text-signal-blue" />
      <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
