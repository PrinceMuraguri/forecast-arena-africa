import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubmitPredictionInput = {
  marketId: string;
  outcomeId: string;
  confidence: number;
};

export type MyPrediction = {
  id: string;
  market_id: string;
  outcome_id: string;
  confidence: number;
  created_at: string;
  updated_at: string;
};

export const submitPrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SubmitPredictionInput) => {
    if (!input?.marketId || !input?.outcomeId) {
      throw new Error("marketId and outcomeId are required");
    }
    const confidence = Math.round(Number(input.confidence));
    if (!Number.isFinite(confidence) || confidence < 1 || confidence > 100) {
      throw new Error("Confidence must be between 1 and 100");
    }
    return { marketId: input.marketId, outcomeId: input.outcomeId, confidence };
  })
  .handler(async ({ data, context }): Promise<MyPrediction> => {
    const { supabase, userId } = context;

    // Validate the market is open and the outcome belongs to it.
    const { data: market, error: mErr } = await supabase
      .from("markets")
      .select("id,status")
      .eq("id", data.marketId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!market) throw new Error("Market not found");
    if (market.status !== "open") throw new Error("This market is not open for predictions");

    const { data: outcome, error: oErr } = await supabase
      .from("market_outcomes")
      .select("id,market_id")
      .eq("id", data.outcomeId)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!outcome || outcome.market_id !== data.marketId) {
      throw new Error("Outcome does not belong to this market");
    }

    const { data: row, error } = await supabase
      .from("predictions")
      .upsert(
        {
          user_id: userId,
          market_id: data.marketId,
          outcome_id: data.outcomeId,
          confidence: data.confidence,
        },
        { onConflict: "user_id,market_id" },
      )
      .select("id,market_id,outcome_id,confidence,created_at,updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row as MyPrediction;
  });

export const getMyPredictionForMarket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { marketId: string }) => {
    if (!input?.marketId) throw new Error("marketId is required");
    return { marketId: input.marketId };
  })
  .handler(async ({ data, context }): Promise<MyPrediction | null> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("predictions")
      .select("id,market_id,outcome_id,confidence,created_at,updated_at")
      .eq("market_id", data.marketId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row ?? null) as MyPrediction | null;
  });
