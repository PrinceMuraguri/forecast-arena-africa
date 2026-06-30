import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface TickerItem {
  id: string;
  title: string;
  probability: number;
  prizePoolKes: number;
  closesIn: string;
}

interface LiveTickerProps {
  items: TickerItem[];
  className?: string;
}

export function LiveTicker({ items, className }: LiveTickerProps) {
  const loop = [...items, ...items];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-white/10 bg-arena-night/60 py-3",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-arena-night to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-arena-night to-transparent" />

      <div className="flex items-center gap-3 px-4 text-[11px] font-medium uppercase tracking-widest text-live-cyan">
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-live-cyan shadow-[0_0_8px_var(--live-cyan)]" />
        Live markets
      </div>

      <motion.div
        className="mt-2 flex w-max gap-8 whitespace-nowrap pl-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        {loop.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="flex items-center gap-3 text-sm text-white/90"
          >
            <span className="font-display">{item.title}</span>
            <span className="font-mono-data text-signal-blue">
              {Math.round(item.probability)}% Yes
            </span>
            <span className="font-mono-data text-forecast-gold">
              KES {item.prizePoolKes.toLocaleString()}
            </span>
            <span className="font-mono-data text-white/60">closes {item.closesIn}</span>
            <span className="text-white/30">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
