import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <section className="border-b border-border bg-card/60">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </section>
  );
}

export function PlaceholderBlock({ note }: { note: string }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {note}
      </div>
    </section>
  );
}
