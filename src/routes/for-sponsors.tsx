import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHero, PlaceholderBlock } from "@/components/page-hero";

export const Route = createFileRoute("/for-sponsors")({
  head: () => ({
    meta: [
      { title: "For Sponsors — Forecast Arena" },
      {
        name: "description",
        content:
          "Don't just advertise to Africa. Learn from it. Sponsor a poll: rigorous research, a published content series, and your brand on an experience people enjoy.",
      },
      { property: "og:title", content: "For Sponsors — Forecast Arena" },
      {
        property: "og:description",
        content: "Don't just advertise to Africa. Learn from it.",
      },
    ],
  }),
  component: () => (
    <SiteShell>
      <PageHero
        eyebrow="For Sponsors"
        title="Don't just advertise to Africa. Learn from it."
        subtitle="Sponsor a poll and get three assets from one budget: rigorous market research, a published content series, and your brand on an experience people genuinely enjoy."
      />
      <PlaceholderBlock note="Full For Sponsors page (catalogue, flywheel, revenue chart, lead form) lands in Phase 2." />
    </SiteShell>
  ),
});
