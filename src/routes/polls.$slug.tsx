import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { PartnerBar } from "@/components/partner-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-stub";
import { getPollDetail } from "@/lib/explore.functions";

const pollQuery = (slug: string) =>
  queryOptions({
    queryKey: ["polls", "detail", slug],
    queryFn: () => getPollDetail({ data: { slug } }),
  });

export const Route = createFileRoute("/polls/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Forecast Arena` },
      {
        name: "description",
        content:
          "Read the poll's purpose, what it measures, the cross-country picture, and preview the first questions.",
      },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(pollQuery(params.slug)),
  component: PollDetailPage,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Couldn't load this poll.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link
          to="/explore"
          className="mt-6 inline-block text-xs uppercase tracking-widest text-arena-coral"
        >
          ← Back to Explore
        </Link>
      </div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">Poll not found.</div>
    </SiteShell>
  ),
});

function PollDetailPage() {
  const { slug } = Route.useParams();
  const { data: poll } = useSuspenseQuery(pollQuery(slug));
  const { user } = useAuth();

  if (!poll) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">Poll not found.</div>
      </SiteShell>
    );
  }

  const cross = parseCrossCountry(poll.cross_country);
  const reward = Number(poll.completion_reward_kes ?? poll.reward_kes ?? 0);
  const isPrediction = poll.kind === "prediction";

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link
          to="/explore"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-arena-coral"
        >
          ← Explore
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
          {poll.category?.name ? (
            <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-muted-foreground">
              {(poll.category as any).icon ?? ""} {poll.category.name}
            </span>
          ) : null}
          <span className="text-muted-foreground">{poll.country_code}</span>
          {poll.kind ? <span className="text-arena-coral">{poll.kind}</span> : null}
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{poll.title}</h1>
        {poll.summary ? (
          <p className="mt-3 text-base text-muted-foreground">{poll.summary}</p>
        ) : null}

        <div className="mt-6">
          <PartnerBar variant="cobranded" sponsorName={poll.sponsor_name ?? undefined} />
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {user ? (
            <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
              <Link
                to={isPrediction ? "/arena/$slug" : "/take/$slug"}
                params={{ slug: poll.slug }}
              >
                Take part & earn{reward > 0 ? ` · KES ${reward.toLocaleString()}` : ""}
              </Link>
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
                <Link to="/signup">Sign in to take part & earn</Link>
              </Button>
              <span className="text-xs text-muted-foreground">
                It's free, and you get paid to M-Pesa.
              </span>
            </div>
          )}
          {poll.preview_enabled ? (
            <a
              href="#preview"
              className="text-xs uppercase tracking-widest text-arena-coral hover:underline"
            >
              Preview the survey →
            </a>
          ) : null}
        </div>

        {/* About */}
        {poll.description ? (
          <Section title="About this poll">
            <p className="text-sm leading-relaxed text-muted-foreground">{poll.description}</p>
          </Section>
        ) : null}

        {/* What it measures */}
        {poll.what_it_measures ? (
          <Section title="What it measures">
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {poll.what_it_measures
                .split(/\n|•|;/)
                .map((s: string) => s.trim())
                .filter(Boolean)
                .map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
            </ul>
          </Section>
        ) : null}

        {/* Purpose */}
        {poll.purpose ? (
          <Section title="What it's used for">
            <p className="text-sm leading-relaxed text-muted-foreground">{poll.purpose}</p>
          </Section>
        ) : null}

        {/* Cross-country */}
        {cross.length > 0 ? (
          <Section
            title="Across Africa"
            tag="Illustrative · sample"
          >
            <ul className="space-y-3">
              {cross.map((row, i) => {
                const max = Math.max(...cross.map((r) => r.value));
                const pct = max > 0 ? (row.value / max) * 100 : 0;
                return (
                  <li key={i}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">
                        {row.flag ? <span className="mr-2">{row.flag}</span> : null}
                        {row.country}
                      </span>
                      <span className="font-mono text-arena-coral">{row.value}{row.unit ?? "%"}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className="h-full rounded-full bg-arena-coral/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {row.note ? (
                      <p className="mt-1 text-xs text-muted-foreground">{row.note}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Section>
        ) : null}

        {/* Preview */}
        {poll.preview_enabled && (poll as any).preview_questions?.length > 0 ? (
          <Section title="Preview" id="preview">
            <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-white/70 p-5">
              <ol className="space-y-5">
                {(poll as any).preview_questions.map((q: any, i: number) => (
                  <li key={q.id}>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Question {i + 1}
                    </p>
                    <p className="mt-1 font-display text-base font-semibold">{q.prompt}</p>
                    {q.options?.length > 0 ? (
                      <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                        {q.options.map((o: any) => (
                          <li key={o.id} className="rounded-md border border-foreground/10 px-3 py-1.5">
                            {o.label}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
              <div className="mt-6 rounded-xl border border-dashed border-arena-coral/40 bg-arena-coral/5 p-4 text-center">
                <p className="text-sm font-medium">More questions in the full survey.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user
                    ? "Take it now to earn the reward."
                    : "Sign in to take the full survey and earn."}
                </p>
              </div>
            </div>
          </Section>
        ) : null}

        {/* Linked insights */}
        {poll.index_slug ? (
          <Section title="Linked insights">
            <Link
              to="/insights"
              className="inline-block rounded-xl border border-foreground/10 bg-white/60 px-4 py-3 text-sm text-arena-coral hover:border-arena-coral/40"
            >
              See the live index this feeds →
            </Link>
          </Section>
        ) : null}

        {/* Prediction shortcut */}
        {isPrediction ? (
          <Section title="Live prediction">
            <Link
              to="/arena/$slug"
              params={{ slug: poll.slug }}
              className="inline-block rounded-xl border border-live-cyan/30 bg-live-cyan/5 px-4 py-3 text-sm text-live-cyan hover:border-live-cyan/60"
            >
              See the live odds in the Arena →
            </Link>
          </Section>
        ) : null}

        {poll.methodology_note ? (
          <p className="mt-12 border-t border-foreground/10 pt-6 text-xs text-muted-foreground">
            <strong className="uppercase tracking-widest">Methodology · </strong>
            {poll.methodology_note}
          </p>
        ) : null}
      </article>
    </SiteShell>
  );
}

function Section({
  title,
  tag,
  id,
  children,
}: {
  title: string;
  tag?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {tag ? (
          <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            {tag}
          </span>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

type CrossRow = {
  country: string;
  flag?: string;
  value: number;
  unit?: string;
  note?: string;
};

function parseCrossCountry(raw: unknown): CrossRow[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : (raw as any).rows;
  if (!Array.isArray(arr)) return [];
  return arr
    .map((r: any) => ({
      country: r.country ?? r.name ?? r.country_code ?? "",
      flag: r.flag ?? r.flag_emoji,
      value: Number(r.value ?? r.percent ?? r.pct ?? 0),
      unit: r.unit,
      note: r.note,
    }))
    .filter((r) => r.country);
}
