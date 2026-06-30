import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards & Pricing — Forecast Arena" },
      {
        name: "description",
        content:
          "Everyone walks away with something. Participants get paid for surveys and forecasts. Sponsors fund research, content, and brand exposure in one product.",
      },
      { property: "og:title", content: "Rewards & Pricing — Forecast Arena" },
      {
        property: "og:description",
        content: "Everyone walks away with something.",
      },
    ],
  }),
  component: RewardsPage,
});

const PARTICIPANT = [
  { title: "Completion rewards", body: "Finish a survey, earn a cash reward instantly — funded by the sponsor, paid straight to M-Pesa." },
  { title: "Prize-pool shares", body: "Call a prediction right and split the pool with everyone else who did. One good call can be worth far more than the completion reward." },
  { title: "Your panel profile", body: "Tell us a bit about yourself once, and you'll be matched to the polls that fit — more relevant questions, more chances to earn." },
  { title: "The leaderboard", body: "Build an accuracy record. The sharpest forecasters rise, earn recognition, and get first access to the biggest pools." },
  { title: "Cash out anytime", body: "Withdraw your balance to M-Pesa whenever you like. It usually lands in under a minute." },
  { title: "Bring friends", body: "Refer others and earn when they take their first poll." },
];

const SPONSOR = [
  { title: "Five billable lines from one budget", body: "Poll design & hosting, the article pipeline, the podcast, the data analysis, and the participation pool the sponsor funds and passes through to participants." },
  { title: "Sell the index, not the survey", body: "A subscription to a monthly tracker is recurring revenue; a one-off is not. Most products are trackers you subscribe to." },
  { title: "Syndicate where buyers overlap", body: "Several brands want the same brand-health data — sold cheaper to each, with a bespoke cut at a premium for exclusivity." },
  { title: "Bundle your own questions", body: "Sponsor a flagship index and insert your own questions into the wave." },
  { title: "Lead with the decision, not the method", body: "We price on what the data is worth to your next decision." },
];

function RewardsPage() {
  const [track, setTrack] = useState<"earn" | "sponsor">("earn");

  return (
    <SiteShell>
      <PageHero
        eyebrow="Rewards & Pricing"
        title="Everyone walks away with something."
        subtitle="Two tracks, one platform. Pick the side you're on."
      />

      <section className="mx-auto max-w-6xl px-4 py-12">
        {/* Toggle */}
        <div className="mx-auto flex w-full max-w-sm rounded-full border border-border bg-card p-1">
          <ToggleBtn active={track === "earn"} onClick={() => setTrack("earn")}>
            I'm here to earn
          </ToggleBtn>
          <ToggleBtn active={track === "sponsor"} onClick={() => setTrack("sponsor")}>
            I'm here to sponsor
          </ToggleBtn>
        </div>

        {track === "earn" ? (
          <div className="mt-12">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              How you earn.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              No fees to join. No catch. Your data stays yours, and you choose what you
              share.
            </p>
            <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {PARTICIPANT.map((item) => (
                <li key={item.title} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-10 text-center">
              <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
                <Link to="/signup">Start earning</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-12">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              How sponsoring is priced.
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              All figures are agreed per deal, drawing on the newsroom's commercial
              experience in each market. We'd rather build something large together than
              win a hard bargain on something small.
            </p>
            <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SPONSOR.map((item) => (
                <li key={item.title} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
                <a href="mailto:sponsors@forecast.africa">Sponsor a poll</a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/for-sponsors">Book a call →</Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function ToggleBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-arena-coral text-white shadow"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
