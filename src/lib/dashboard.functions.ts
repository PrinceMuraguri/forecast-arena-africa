import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DashboardStats = {
  balanceKes: number;
  openForecasts: number;
  resolvedForecasts: number;
  correct: number;
  accuracyPct: number | null;
  brierScore: number | null;
  totalEarnedKes: number;
};

export type DashboardPredictionRow = {
  id: string;
  confidence: number;
  is_resolved: boolean;
  created_at: string;
  market: {
    id: string;
    slug: string;
    title: string;
    status: string;
    closes_at: string | null;
  } | null;
  outcome: { id: string; label: string; is_winning: boolean | null } | null;
};

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: preds }, { data: bal }] = await Promise.all([
      supabase
        .from("predictions")
        .select(
          "id,confidence,is_resolved,created_at,market:markets(id,slug,title,status,closes_at),outcome:market_outcomes(id,label,is_winning)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("wallet_balances")
        .select("available_kes,lifetime_rewards_kes,lifetime_winnings_kes")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const balance = Number(bal?.available_kes ?? 0);
    const earned = Number(bal?.lifetime_rewards_kes ?? 0) + Number(bal?.lifetime_winnings_kes ?? 0);

    const rows = (preds ?? []) as unknown as DashboardPredictionRow[];
    const resolved = rows.filter((r) => r.is_resolved && r.outcome);
    const correct = resolved.filter((r) => r.outcome?.is_winning === true).length;
    const accuracy = resolved.length ? (correct / resolved.length) * 100 : null;
    const brier = resolved.length
      ? resolved.reduce((acc, r) => {
          const p = (r.confidence ?? 50) / 100;
          const y = r.outcome?.is_winning ? 1 : 0;
          return acc + (p - y) ** 2;
        }, 0) / resolved.length
      : null;

    const open = rows.filter(
      (r) => !r.is_resolved && r.market?.status === "open",
    ).length;

    const stats: DashboardStats = {
      balanceKes: Math.round(balance * 100) / 100,
      openForecasts: open,
      resolvedForecasts: resolved.length,
      correct,
      accuracyPct: accuracy === null ? null : Math.round(accuracy),
      brierScore: brier === null ? null : Math.round(brier * 1000) / 1000,
      totalEarnedKes: Math.round(earned * 100) / 100,
    };

    return { stats, recent: rows };
  });

