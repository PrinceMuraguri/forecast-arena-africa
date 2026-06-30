
-- Add reward field to polls
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS reward_kes numeric(10,2) NOT NULL DEFAULT 50;

-- Question kinds
DO $$ BEGIN
  CREATE TYPE public.poll_question_kind AS ENUM ('single','multi','scale','text');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- poll_questions
CREATE TABLE public.poll_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  kind public.poll_question_kind NOT NULL DEFAULT 'single',
  required boolean NOT NULL DEFAULT true,
  scale_min int,
  scale_max int,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX poll_questions_poll_idx ON public.poll_questions(poll_id, sort_order);

GRANT SELECT ON public.poll_questions TO anon, authenticated;
GRANT ALL ON public.poll_questions TO service_role;
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads poll questions" ON public.poll_questions FOR SELECT USING (true);
CREATE POLICY "Admins manage poll questions" ON public.poll_questions FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));
CREATE TRIGGER poll_questions_updated BEFORE UPDATE ON public.poll_questions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- poll_question_options
CREATE TABLE public.poll_question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX poll_q_options_q_idx ON public.poll_question_options(question_id, sort_order);

GRANT SELECT ON public.poll_question_options TO anon, authenticated;
GRANT ALL ON public.poll_question_options TO service_role;
ALTER TABLE public.poll_question_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads poll options" ON public.poll_question_options FOR SELECT USING (true);
CREATE POLICY "Admins manage poll options" ON public.poll_question_options FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));

-- poll_responses (one per user per poll)
CREATE TABLE public.poll_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_kes numeric(10,2) NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
CREATE INDEX poll_responses_user_idx ON public.poll_responses(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.poll_responses TO authenticated;
GRANT ALL ON public.poll_responses TO service_role;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own responses" ON public.poll_responses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users create own responses" ON public.poll_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage responses" ON public.poll_responses FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));

-- poll_answers
CREATE TABLE public.poll_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.poll_responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.poll_questions(id) ON DELETE CASCADE,
  option_id uuid REFERENCES public.poll_question_options(id) ON DELETE SET NULL,
  value_text text,
  value_numeric numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX poll_answers_response_idx ON public.poll_answers(response_id);
CREATE INDEX poll_answers_question_idx ON public.poll_answers(question_id);

GRANT SELECT, INSERT ON public.poll_answers TO authenticated;
GRANT ALL ON public.poll_answers TO service_role;
ALTER TABLE public.poll_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own answers" ON public.poll_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.poll_responses r WHERE r.id = response_id AND r.user_id = auth.uid()));
CREATE POLICY "Users insert own answers" ON public.poll_answers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.poll_responses r WHERE r.id = response_id AND r.user_id = auth.uid()));
CREATE POLICY "Admins manage answers" ON public.poll_answers FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'));

-- Seed sample questions for existing polls
DO $$
DECLARE p RECORD; q1 uuid; q2 uuid;
BEGIN
  FOR p IN SELECT id FROM public.polls LOOP
    -- Skip if already has questions
    IF EXISTS (SELECT 1 FROM public.poll_questions WHERE poll_id = p.id) THEN CONTINUE; END IF;

    INSERT INTO public.poll_questions (poll_id, prompt, kind, sort_order)
      VALUES (p.id, 'How confident are you in your overall view on this question?', 'scale', 0)
      RETURNING id INTO q1;
    UPDATE public.poll_questions SET scale_min = 1, scale_max = 10 WHERE id = q1;

    INSERT INTO public.poll_questions (poll_id, prompt, kind, sort_order)
      VALUES (p.id, 'Which factor will matter most over the next 6 months?', 'single', 1)
      RETURNING id INTO q2;
    INSERT INTO public.poll_question_options (question_id, label, sort_order) VALUES
      (q2, 'Policy & regulation', 0),
      (q2, 'Consumer demand', 1),
      (q2, 'Foreign capital flows', 2),
      (q2, 'Local competition', 3);

    INSERT INTO public.poll_questions (poll_id, prompt, kind, required, sort_order)
      VALUES (p.id, 'Anything else we should know? (optional)', 'text', false, 2);
  END LOOP;
END $$;
