import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-stub";
import {
  getPollBySlug,
  getMyPollResponse,
  submitPollResponse,
  type PollQuestion,
  type PollAnswerInput,
} from "@/lib/polls.functions";

const pollQuery = (slug: string) =>
  queryOptions({
    queryKey: ["insights", "poll", slug],
    queryFn: () => getPollBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/insights/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Insights poll` },
      {
        name: "description",
        content:
          "Share your view, earn instantly, and shape Africa's next data story.",
      },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(pollQuery(params.slug)),
  component: PollPage,
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Couldn't load this poll.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/insights" className="mt-6 inline-block text-xs uppercase tracking-widest text-arena-coral">
          ← Back to Insights
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

type Answers = Record<string, PollAnswerInput>;

function PollPage() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const { data: poll } = useSuspenseQuery(pollQuery(slug));
  const { user } = useAuth();
  const qc = useQueryClient();

  const myResp = useQuery({
    queryKey: ["insights", "poll", slug, "me"],
    queryFn: () => (poll ? getMyPollResponse({ data: { pollId: poll.id } }) : null),
    enabled: !!user && !!poll,
  });

  const submit = useServerFn(submitPollResponse);
  const mutation = useMutation({
    mutationFn: submit,
    onSuccess: (res) => {
      toast.success(
        res?.rewardKes
          ? `Submitted. KES ${res.rewardKes} credited to your wallet.`
          : "Submitted. Thanks for your view.",
      );
      qc.invalidateQueries({ queryKey: ["insights", "poll", slug, "me"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!poll) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">Poll not found.</div>
      </SiteShell>
    );
  }

  const completed = myResp.data;

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/insights" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-arena-coral">
          ← Insights
        </Link>
        <p className="mt-6 text-[10px] uppercase tracking-widest text-arena-coral">
          {poll.category?.name ?? "Poll"}
          {poll.sponsor_name ? ` · Sponsored by ${poll.sponsor_name}` : ""}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{poll.title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{poll.question}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest">
          <span className="rounded-full bg-arena-coral/10 px-3 py-1 text-arena-coral">
            Reward KES {Number(poll.reward_kes).toLocaleString()}
          </span>
          {poll.closes_at ? (
            <span className="text-muted-foreground">
              Closes {new Date(poll.closes_at).toLocaleDateString()}
            </span>
          ) : null}
          <span className="text-muted-foreground">
            {poll.questions.length} question{poll.questions.length === 1 ? "" : "s"}
          </span>
        </div>

        {completed ? (
          <div className="mt-8 rounded-2xl border border-forecast-gold/40 bg-forecast-gold/5 p-6">
            <p className="font-display text-lg font-semibold">You've completed this poll.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              KES {Number(completed.reward_kes).toLocaleString()} was credited on{" "}
              {new Date(completed.completed_at).toLocaleDateString()}.
            </p>
            <div className="mt-4 flex gap-3">
              <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
                <Link to="/insights">Find another poll</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/wallet">View wallet</Link>
              </Button>
            </div>
          </div>
        ) : !user ? (
          <SignInCta slug={slug} />
        ) : (
          <Questionnaire
            poll={poll}
            onSubmit={(answers) => mutation.mutate({ data: { pollId: poll.id, answers } })}
            submitting={mutation.isPending}
          />
        )}
      </section>
    </SiteShell>
  );
}

function SignInCta({ slug }: { slug: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-foreground/10 bg-white/60 p-6">
      <p className="font-display text-lg font-semibold">Sign in to complete this poll.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Free to join. We pay instantly to M-Pesa.
      </p>
      <div className="mt-4 flex gap-3">
        <Button asChild className="bg-arena-coral hover:bg-arena-coral/90">
          <Link to="/signup">Create account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}

function Questionnaire({
  poll,
  onSubmit,
  submitting,
}: {
  poll: { questions: PollQuestion[] };
  onSubmit: (answers: PollAnswerInput[]) => void;
  submitting: boolean;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const total = poll.questions.length;
  const q = poll.questions[step];
  const progress = useMemo(() => Math.round(((step + 1) / Math.max(total, 1)) * 100), [step, total]);

  if (!q) {
    return (
      <div className="mt-8 rounded-2xl border border-foreground/10 bg-white/60 p-6">
        This poll has no questions yet.
      </div>
    );
  }

  const a = answers[q.id];
  const isLast = step === total - 1;
  const canNext = (() => {
    if (!q.required) return true;
    if (q.kind === "single") return !!a?.optionId;
    if (q.kind === "multi") return !!a?.optionIds?.length;
    if (q.kind === "scale") return typeof a?.value === "number";
    if (q.kind === "text") return !!a?.text?.trim();
    return true;
  })();

  function updateAnswer(patch: Partial<PollAnswerInput>) {
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { ...(prev[q.id] ?? { questionId: q.id }), ...patch, questionId: q.id },
    }));
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-foreground/10 bg-white">
      <div className="border-b border-foreground/10 bg-foreground/5 px-6 py-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Question {step + 1} of {total}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full bg-arena-coral transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-display text-xl font-semibold">{q.prompt}</h3>
        {q.required ? null : (
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Optional</p>
        )}

        <div className="mt-6">
          {q.kind === "single" && (
            <div className="grid gap-2">
              {q.options.map((o) => {
                const active = a?.optionId === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => updateAnswer({ optionId: o.id })}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      active
                        ? "border-arena-coral bg-arena-coral/5 text-foreground"
                        : "border-foreground/15 hover:border-foreground/40"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}

          {q.kind === "multi" && (
            <div className="grid gap-2">
              {q.options.map((o) => {
                const selected = a?.optionIds?.includes(o.id) ?? false;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      const cur = a?.optionIds ?? [];
                      const next = selected ? cur.filter((x) => x !== o.id) : [...cur, o.id];
                      updateAnswer({ optionIds: next });
                    }}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      selected
                        ? "border-arena-coral bg-arena-coral/5 text-foreground"
                        : "border-foreground/15 hover:border-foreground/40"
                    }`}
                  >
                    <span className="mr-3 inline-block h-4 w-4 rounded border align-middle"
                      style={{
                        background: selected ? "var(--color-arena-coral, #ff5a4d)" : "transparent",
                        borderColor: selected ? "transparent" : "rgba(0,0,0,0.25)",
                      }}
                    />
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}

          {q.kind === "scale" && (
            <ScaleField
              min={q.scale_min ?? 1}
              max={q.scale_max ?? 10}
              value={typeof a?.value === "number" ? a.value : (q.scale_min ?? 1)}
              onChange={(v) => updateAnswer({ value: v })}
            />
          )}

          {q.kind === "text" && (
            <div>
              <Label htmlFor="answer-text" className="sr-only">
                Your answer
              </Label>
              <Textarea
                id="answer-text"
                value={a?.text ?? ""}
                onChange={(e) => updateAnswer({ text: e.target.value })}
                placeholder="Type your view…"
                rows={5}
                maxLength={2000}
              />
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={step === 0 || submitting}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            ← Back
          </Button>
          {isLast ? (
            <Button
              disabled={!canNext || submitting}
              onClick={() =>
                onSubmit(
                  poll.questions
                    .map((qq) => answers[qq.id])
                    .filter((x): x is PollAnswerInput => !!x),
                )
              }
              className="bg-arena-coral hover:bg-arena-coral/90"
            >
              {submitting ? "Submitting…" : "Submit & earn"}
            </Button>
          ) : (
            <Button
              disabled={!canNext}
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
              className="bg-arena-coral hover:bg-arena-coral/90"
            >
              Next →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScaleField({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{min}</span>
        <span className="font-mono text-3xl text-arena-coral">{value}</span>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{max}</span>
      </div>
      <Slider
        className="mt-4"
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? min)}
      />
    </div>
  );
}
