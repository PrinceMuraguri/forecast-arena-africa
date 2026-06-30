import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHero, PlaceholderBlock } from "@/components/page-hero";

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
        content:
          "The market intelligence mature economies take for granted — built for Africa.",
      },
    ],
  }),
  component: () => (
    <SiteShell>
      <PageHero
        eyebrow="About"
        title="Built in Nairobi. Made for Africa."
        subtitle="We're starting where the questions are sharpest, in Kenya, and building the continent's first community of paid pollsters and forecasters."
      />
      <PlaceholderBlock note="Full About page content lands in Phase 2." />
    </SiteShell>
  ),
});
