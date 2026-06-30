import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { PartnerBar } from "@/components/partner-bar";
import { Button } from "@/components/ui/button";
import { listPodcast } from "@/lib/insights.functions";

const podcastQuery = () =>
  queryOptions({ queryKey: ["podcast"], queryFn: () => listPodcast() });

export const Route = createFileRoute("/podcast/$slug")({
  loader: async ({ context, params }) => {
    const episodes = await context.queryClient.ensureQueryData(podcastQuery());
    const ep = episodes.find((e: any) => e.slug === params.slug);
    if (!ep) throw notFound();
    return ep;
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.title
      ? `${loaderData.title} — The Opportunity`
      : "Episode — Forecast Arena";
    return {
      meta: [
        { title },
        { name: "description", content: loaderData?.description ?? "Forecast Arena podcast." },
        { property: "og:title", content: title },
        { property: "og:type", content: "article" },
        {
          property: "og:url",
          content: `https://forecast-arena-africa.lovable.app/podcast/${params.slug}`,
        },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://forecast-arena-africa.lovable.app/podcast/${params.slug}`,
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Episode not found</h1>
        <Link to="/podcast" className="mt-4 inline-block text-primary underline">
          Back to all episodes
        </Link>
      </div>
    </SiteShell>
  ),
  errorComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">
        Something went wrong loading this episode.
      </div>
    </SiteShell>
  ),
  component: EpisodeDetail,
});

function EpisodeDetail() {
  const { slug } = Route.useParams();
  const { data: episodes } = useSuspenseQuery(podcastQuery());
  const ep = episodes.find((e: any) => e.slug === slug);
  if (!ep) return null;

  return (
    <SiteShell>
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            The Opportunity
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {ep.title}
          </h1>
          {ep.guest_name && (
            <p className="mt-3 text-muted-foreground">
              With <span className="font-medium text-foreground">{ep.guest_name}</span>
              {ep.guest_title && ` · ${ep.guest_title}`}
              {ep.guest_org && ` · ${ep.guest_org}`}
              {ep.duration_label && ` · ${ep.duration_label}`}
            </p>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10">
        {ep.video_url ? (
          <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-black">
            <iframe
              src={ep.video_url}
              title={ep.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : ep.audio_url ? (
          <audio controls src={ep.audio_url} className="w-full">
            Your browser does not support audio.
          </audio>
        ) : (
          <p className="text-muted-foreground">Episode media coming soon.</p>
        )}

        {ep.description && (
          <p className="mt-6 text-lg text-muted-foreground">{ep.description}</p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {ep.audio_url && (
            <a
              href={ep.audio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary"
            >
              Apple Podcasts
            </a>
          )}
          {ep.audio_url && (
            <a
              href={ep.audio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary"
            >
              Spotify
            </a>
          )}
        </div>
      </section>

      {ep.linked_market_slug && (
        <section className="mx-auto max-w-3xl px-4 pb-12">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h3 className="font-display text-lg font-semibold">
              Heard the experts? Make your call.
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This episode connects to a live prediction market. Lock in your forecast.
            </p>
            <Button asChild className="mt-4">
              <Link to="/arena/$slug" params={{ slug: ep.linked_market_slug }}>
                Open the market →
              </Link>
            </Button>
          </div>
        </section>
      )}

      <PartnerBar />
    </SiteShell>
  );
}
