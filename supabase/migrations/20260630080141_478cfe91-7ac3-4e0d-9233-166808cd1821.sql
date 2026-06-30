
-- Move helper out of the public API surface
DROP FUNCTION IF EXISTS public.recompute_market_probabilities(uuid);

CREATE OR REPLACE FUNCTION app_private.recompute_market_probabilities(_market_id uuid)
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

  UPDATE public.market_outcomes mo
     SET implied_probability = 0
   WHERE mo.market_id = _market_id
     AND NOT EXISTS (
       SELECT 1 FROM public.predictions p
       WHERE p.market_id = _market_id AND p.outcome_id = mo.id
     );
END;
$$;

REVOKE ALL ON FUNCTION app_private.recompute_market_probabilities(uuid) FROM PUBLIC;

-- Trigger function that recomputes after each prediction change
CREATE OR REPLACE FUNCTION app_private.tg_predictions_recompute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM app_private.recompute_market_probabilities(OLD.market_id);
    RETURN OLD;
  ELSE
    PERFORM app_private.recompute_market_probabilities(NEW.market_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS predictions_recompute ON public.predictions;
CREATE TRIGGER predictions_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.predictions
FOR EACH ROW EXECUTE FUNCTION app_private.tg_predictions_recompute();
