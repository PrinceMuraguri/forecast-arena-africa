import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ProbabilityOrbProps {
  /** 0–100, the Yes / Up probability */
  probability: number;
  label?: string;
  size?: number;
  className?: string;
}

/**
 * Animated SVG "probability orb" — shifts colour and fill as the crowd's
 * forecast moves between signal-blue (Yes/Up) and arena-coral (No/Down).
 * Phase 0: animated SVG (no three.js dependency yet).
 */
export function ProbabilityOrb({
  probability,
  label,
  size = 160,
  className,
}: ProbabilityOrbProps) {
  const p = Math.max(0, Math.min(100, probability));
  const fillHeight = (p / 100) * size;

  return (
    <div
      className={cn("relative inline-flex flex-col items-center gap-2", className)}
      style={{ width: size }}
    >
      <div
        className="relative overflow-hidden rounded-full border border-white/20 shadow-[0_0_60px_-10px_rgba(39,194,212,0.45)]"
        style={{ width: size, height: size }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-arena-night" />

        {/* Liquid fill */}
        <motion.div
          className="absolute inset-x-0 bottom-0"
          animate={{ height: fillHeight }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          style={{
            background:
              "linear-gradient(180deg, var(--signal-blue) 0%, oklch(0.55 0.18 285) 100%)",
          }}
        >
          <Wave color="rgba(255,255,255,0.18)" duration={6} />
          <Wave color="rgba(255,255,255,0.10)" duration={9} delay={-2} />
        </motion.div>

        {/* Coral glow when probability low */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: (100 - p) / 200 }}
          style={{
            background:
              "radial-gradient(circle at 50% 50%, var(--arena-coral) 0%, transparent 60%)",
          }}
        />

        {/* Center value */}
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="text-center text-white">
            <div
              className="font-mono-data text-3xl font-semibold tabular-nums"
              style={{ fontSize: size * 0.22 }}
            >
              {Math.round(p)}%
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/70">
              Yes
            </div>
          </div>
        </div>
      </div>

      {label && (
        <p className="max-w-[14rem] text-center text-xs text-muted-foreground">{label}</p>
      )}
    </div>
  );
}

function Wave({
  color,
  duration,
  delay = 0,
}: {
  color: string;
  duration: number;
  delay?: number;
}) {
  return (
    <motion.svg
      className="absolute left-0 top-[-12px] w-[200%]"
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      style={{ height: 24 }}
      animate={{ x: ["0%", "-50%"] }}
      transition={{
        duration,
        delay,
        ease: "linear",
        repeat: Infinity,
      }}
    >
      <path
        d="M0,20 Q150,0 300,20 T600,20 T900,20 T1200,20 V40 H0 Z"
        fill={color}
      />
    </motion.svg>
  );
}
