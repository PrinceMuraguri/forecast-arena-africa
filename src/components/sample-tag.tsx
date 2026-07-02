export function SampleTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-foreground/15 bg-foreground/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground ${className}`}
      title="Shown to preview the experience. Real figures populate as survey waves run."
    >
      Illustrative · sample data
    </span>
  );
}
