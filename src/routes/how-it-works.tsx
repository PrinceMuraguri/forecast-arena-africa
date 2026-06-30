import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PageHero, PlaceholderBlock } from "@/components/page-hero";

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
        content:
          "Two layers. One questionnaire. You win on both.",
      },
    ],
  }),
  component: () => (
    <SiteShell>
      <PageHero
        eyebrow="How It Works"
        title="Two layers. One questionnaire. You win on both."
        subtitle="Every poll on Forecast Arena does two things at once: it asks what you think, and it asks what you think will happen. Answer the first, earn instantly. Call the second right, share the prize."
      />
      <PlaceholderBlock note="Full How It Works content lands in Phase 2 (Marketing Pages)." />
    </SiteShell>
  ),
});
