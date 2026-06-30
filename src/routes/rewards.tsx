import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHero, PlaceholderBlock } from "@/components/page-hero";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards & Pricing — Forecast Arena" },
      {
        name: "description",
        content:
          "Two sides. Same platform. Participants get paid for surveys and forecasts. Sponsors fund research, content, and brand exposure.",
      },
    ],
  }),
  component: () => (
    <SiteShell>
      <PageHero
        eyebrow="Rewards & Pricing"
        title="Two sides. Same platform."
        subtitle="Participants get paid for surveys and forecasts. Sponsors fund research, content, and brand exposure in one product."
      />
      <PlaceholderBlock note="Full participant/sponsor pricing toggle lands in Phase 2." />
    </SiteShell>
  ),
});
