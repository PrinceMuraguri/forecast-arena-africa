import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHero, PlaceholderBlock } from "@/components/page-hero";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Forecast Arena" },
      {
        name: "description",
        content:
          "Articles, reports, the live indexes, and The Opportunity Podcast. Independent research from Econsult Africa, distributed with The Kenyan Wall Street.",
      },
    ],
  }),
  component: () => (
    <SiteShell>
      <PageHero
        eyebrow="Insights"
        title="Read what Africa is telling us."
        subtitle="Articles, reports, the live indexes, and The Opportunity Podcast — every poll becomes a story."
      />
      <PlaceholderBlock note="The Insights hub (Articles · Reports · Indexes · Podcast) wires up in Phase 2 and Phase 8." />
    </SiteShell>
  ),
});
