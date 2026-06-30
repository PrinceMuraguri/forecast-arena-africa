import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Forecast Arena" },
      { name: "description", content: "Your panel, your earnings, your forecasts." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold md:text-4xl">
          Welcome to the Arena.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your panel, your earnings, your open forecasts — all in one place.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat label="Wallet" value="KES 1,240" tone="gold" />
          <Stat label="Open forecasts" value="3" tone="cyan" />
          <Stat label="Accuracy score" value="68%" tone="blue" />
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Next up for you</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a poll from the Arena. Finish it, earn instantly, then call
            what's next.
          </p>
          <Button asChild className="mt-4 bg-arena-coral hover:bg-arena-coral/90">
            <Link to="/arena">Enter the Arena</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gold" | "cyan" | "blue";
}) {
  const color =
    tone === "gold"
      ? "text-forecast-gold"
      : tone === "cyan"
        ? "text-live-cyan"
        : "text-signal-blue";
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 font-mono-data text-3xl ${color}`}>{value}</p>
    </div>
  );
}
