import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProbabilityOrb } from "@/components/probability-orb";

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [
      { title: "The Arena — Forecast Arena" },
      {
        name: "description",
        content:
          "Step into the Arena. Real questions. Real rewards. Real outcomes — updating live.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-live-cyan">
          The Arena
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">
          Step into the Arena.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Real questions. Real rewards. Real outcomes — updating live.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[62, 71, 41, 54, 49, 36].map((p, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-card p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Sponsored · Resolves against CBK
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold">
                    Will CBK move the rate this cycle?
                  </h3>
                </div>
                <ProbabilityOrb probability={p} size={88} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-muted-foreground">Prize</div>
                  <div className="font-mono-data text-forecast-gold">
                    KES {(120000 + i * 23000).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-muted-foreground">Closes</div>
                  <div className="font-mono-data text-live-cyan">
                    {2 + i}d {(i * 3) % 24}h
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Live market data wires up in Phase 4 (The Arena & Prediction Markets).
        </p>
      </section>
    </AppShell>
  ),
});
