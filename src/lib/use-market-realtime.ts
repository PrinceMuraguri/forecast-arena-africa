import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to live updates for a single market: outcome probability changes
 * and market status transitions (e.g. open → resolved).
 */
export function useMarketRealtime(marketId: string | undefined, marketSlug: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!marketId || !marketSlug) return;
    const channel = supabase
      .channel(`market:${marketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_outcomes", filter: `market_id=eq.${marketId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["arena", "market", marketSlug] });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "markets", filter: `id=eq.${marketId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["arena", "market", marketSlug] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId, marketSlug, qc]);
}
