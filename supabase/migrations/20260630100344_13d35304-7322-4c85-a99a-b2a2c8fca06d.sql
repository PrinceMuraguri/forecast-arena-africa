
-- 1) Profiles: only self can read
DROP POLICY IF EXISTS "Profiles are viewable by everyone authenticated" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2) Poll questions/options: only when parent poll is open or closed
DROP POLICY IF EXISTS "Anyone reads poll questions" ON public.poll_questions;
CREATE POLICY "Read poll questions for published polls"
  ON public.poll_questions FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_questions.poll_id
      AND p.status IN ('open','closed')
  ));

DROP POLICY IF EXISTS "Anyone reads poll options" ON public.poll_question_options;
CREATE POLICY "Read poll options for published polls"
  ON public.poll_question_options FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.poll_questions q
    JOIN public.polls p ON p.id = q.poll_id
    WHERE q.id = poll_question_options.question_id
      AND p.status IN ('open','closed')
  ));

-- 3) Lock SECURITY DEFINER admin RPCs to service_role only
REVOKE EXECUTE ON FUNCTION public.resolve_market(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_payout_status(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION app_private.resolve_market(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION app_private.set_payout_status(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_market(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_payout_status(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION app_private.resolve_market(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION app_private.set_payout_status(uuid, text, text) TO service_role;
