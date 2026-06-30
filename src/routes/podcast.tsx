import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { PageHero } from "@/components/page-hero";
import { PartnerBar } from "@/components/partner-bar";
import { listPodcast } from "@/lib/insights.functions";

const podcastQuery = () =>
  queryOptions({ queryKey: ["podcast"], queryFn: () => listPodcast() });

export const Route = createFileRoute("/podcast")({
  loader: ({ context }) => context.queryClient.ensureQueryData(podcastQuery()),
  head: () => ({
    meta: [
      { title: "The Opportunity — Forecast Arena Podcast" },
      { name: "description", content: "Conversations with the people shaping Africa's markets." },
      { property: "og:title", content: "The Opportunity — Forecast Arena Podcast" },
      { property: "og:url", content: "https://forecast-arena-africa.lovable.app/podcast" },
    ],
    links: [{ rel: "canonical", href: "https://forecast-arena-africa.lovable.app/podcast" }],
  }),
  component: PodcastPage,
});

function PodcastPage() {
  const { data: episodes } = useSuspenseQuery(podcastQuery());
  const latest = episodes[0];
  const rest = episodes.slice(1);

  return (
    <SiteShell>
      <PageHero
        eyebrow="The Opportunity"
        title="Conversations behind the data."
        subtitle="Sponsors, founders, and forecasters on what's actually moving."
      />

      {latest && (
        <section className="mx-auto max-w-5xl px-4 py-10">
          <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-10">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Latest episode
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight">{latest.title}</h2>
            {latest.guest_name && (
              <p className="mt-2 text-sm text-muted-foreground">
                With <span className="font-medium text-foreground">{latest.guest_name}</span>
                {latest.guest_title && ` · ${latest.guest_title}`}
                {latest.guest_org && ` · ${latest.guest_org}`}
              </p>
            )}
            {latest.description && (
              <p className="mt-4 max-w-2xl text-muted-foreground">{latest.description}</p>
            )}
            {latest.audio_url && (
              <audio controls src={latest.audio_url} className="mt-5 w-full">
                Your browser does not support audio.
              </audio>
            )}
            <div className="mt-5">
              <Link
                to="/podcast/$slug"
                params={{ slug: latest.slug }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                Open episode →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="font-display text-2xl font-bold">All episodes</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {rest.map((ep: any) => (
            <Link
              key={ep.id}
              to="/podcast/$slug"
              params={{ slug: ep.slug }}
              className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-md"
            >
              <h3 className="font-display text-lg font-semibold leading-tight">{ep.title}</h3>
              {ep.guest_name && (
                <p className="mt-1 text-xs text-muted-foreground">
                  With {ep.guest_name}
                  {ep.duration_label && ` · ${ep.duration_label}`}
                </p>
              )}
              {ep.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ep.description}</p>
              )}
            </Link>
          ))}
          {rest.length === 0 && (
            <p className="text-muted-foreground">More episodes on the way.</p>
          )}
        </div>
      </section>

      <PartnerBar />
    </SiteShell>
  );
}
