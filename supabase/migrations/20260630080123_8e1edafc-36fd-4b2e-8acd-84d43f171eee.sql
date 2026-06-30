
CREATE OR REPLACE FUNCTION public.recompute_market_probabilities(_market_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(confidence), 0) INTO total
  FROM public.predictions
  WHERE market_id = _market_id;

  IF total = 0 THEN
    -- reset to uniform across outcomes
    UPDATE public.market_outcomes mo
       SET implied_probability = 1.0 / NULLIF((SELECT COUNT(*) FROM public.market_outcomes WHERE market_id = _market_id), 0)
     WHERE mo.market_id = _market_id;
    RETURN;
  END IF;

  UPDATE public.market_outcomes mo
     SET implied_probability = COALESCE(sub.sum_conf, 0) / total
    FROM (
      SELECT outcome_id, SUM(confidence)::numeric AS sum_conf
      FROM public.predictions
      WHERE market_id = _market_id
      GROUP BY outcome_id
    ) sub
   WHERE mo.id = sub.outcome_id
     AND mo.market_id = _market_id;

  -- ensure outcomes with no predictions get 0
  UPDATE public.market_outcomes mo
     SET implied_probability = 0
   WHERE mo.market_id = _market_id
     AND NOT EXISTS (
       SELECT 1 FROM public.predictions p
       WHERE p.market_id = _market_id AND p.outcome_id = mo.id
     );
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_market_probabilities(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recompute_market_probabilities(uuid) TO authenticated, service_role;
