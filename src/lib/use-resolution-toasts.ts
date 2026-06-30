import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-stub";

/**
 * Listen for predictions belonging to the current user transitioning to
 * resolved and surface a toast + invalidate dashboard/wallet queries.
 */
export function useResolutionToasts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`predictions:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "predictions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; is_resolved: boolean; reward_kes?: number | null };
          if (!row?.is_resolved || seen.current.has(row.id)) return;
          seen.current.add(row.id);
          const reward = Number(row.reward_kes ?? 0);
          if (reward > 0) {
            toast.success(`You were right! +KES ${reward.toLocaleString("en-KE")}`);
          } else {
            toast(`A market you forecasted just resolved.`);
          }
          qc.invalidateQueries({ queryKey: ["dashboard"] });
          qc.invalidateQueries({ queryKey: ["wallet"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);
}
