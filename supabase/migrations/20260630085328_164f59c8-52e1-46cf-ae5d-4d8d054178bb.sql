ALTER PUBLICATION supabase_realtime ADD TABLE public.market_outcomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.markets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;
ALTER TABLE public.market_outcomes REPLICA IDENTITY FULL;
ALTER TABLE public.markets REPLICA IDENTITY FULL;
ALTER TABLE public.predictions REPLICA IDENTITY FULL;