
-- A1: extend categories into themes
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'theme';

INSERT INTO public.categories (slug, name, color, icon, kind, sort_order) VALUES
  ('economy',     'Economy',              'signal-blue',  'TrendingUp', 'theme', 10),
  ('money',       'Money & Fintech',      'forecast-gold','Wallet',     'theme', 20),
  ('markets',     'Markets & Investing',  'arena-coral',  'LineChart',  'theme', 30),
  ('brands',      'Brands & Consumer',    'live-cyan',    'ShoppingBag','theme', 40),
  ('work',        'Work & Talent',        'signal-blue',  'Briefcase',  'theme', 50),
  ('society',     'Society',              'forecast-gold','Users',      'theme', 60),
  ('politics',    'Politics & Policy',    'arena-coral',  'Landmark',   'theme', 70),
  ('technology',  'Technology',           'live-cyan',    'Cpu',        'theme', 80),
  ('agriculture', 'Agriculture',          'signal-blue',  'Sprout',     'theme', 90),
  ('health',      'Health',               'arena-coral',  'HeartPulse', 'theme', 100),
  ('sports',      'Sports',               'forecast-gold','Trophy',     'theme', 110)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      color = EXCLUDED.color,
      icon = EXCLUDED.icon,
      kind = EXCLUDED.kind,
      sort_order = EXCLUDED.sort_order;

-- A2: countries
CREATE TABLE IF NOT EXISTS public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  flag_emoji text,
  is_live boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "countries public read" ON public.countries FOR SELECT USING (true);
CREATE POLICY "countries admin write" ON public.countries FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.countries (code, name, flag_emoji, is_live, sort_order) VALUES
  ('KE','Kenya','🇰🇪',true,1),
  ('NG','Nigeria','🇳🇬',false,2),
  ('GH','Ghana','🇬🇭',false,3),
  ('ZA','South Africa','🇿🇦',false,4),
  ('UG','Uganda','🇺🇬',false,5),
  ('TZ','Tanzania','🇹🇿',false,6)
ON CONFLICT (code) DO NOTHING;

-- A3: enrich polls
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS what_it_measures text,
  ADD COLUMN IF NOT EXISTS methodology_note text,
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'KE',
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'survey',
  ADD COLUMN IF NOT EXISTS preview_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS est_minutes int,
  ADD COLUMN IF NOT EXISTS completion_reward_kes int,
  ADD COLUMN IF NOT EXISTS respondent_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cross_country jsonb,
  ADD COLUMN IF NOT EXISTS index_slug text;

-- A4: articles
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  dek text,
  hero_image_url text,
  body jsonb NOT NULL DEFAULT '[]'::jsonb,
  author text,
  byline text NOT NULL DEFAULT 'Econsult Africa',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  country_code text DEFAULT 'KE',
  article_type text NOT NULL DEFAULT 'insight',
  status text NOT NULL DEFAULT 'published',
  linked_poll_slug text,
  linked_index_slug text,
  linked_report_slug text,
  sponsor_name text,
  read_minutes int,
  published_at timestamptz NOT NULL DEFAULT now(),
  is_featured boolean NOT NULL DEFAULT false,
  is_sample boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles public read published" ON public.articles FOR SELECT USING (status='published');
CREATE POLICY "articles admin write" ON public.articles FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_articles_updated BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- A5: indexes + index_points
CREATE TABLE IF NOT EXISTS public.indexes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  methodology_note text,
  source_standard text,
  unit text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  country_code text DEFAULT 'KE',
  latest_value numeric,
  change_value numeric,
  is_sample boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.indexes TO anon, authenticated;
GRANT ALL ON public.indexes TO service_role;
ALTER TABLE public.indexes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indexes public read" ON public.indexes FOR SELECT USING (is_published);
CREATE POLICY "indexes admin write" ON public.indexes FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_indexes_updated BEFORE UPDATE ON public.indexes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.index_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  index_id uuid NOT NULL REFERENCES public.indexes(id) ON DELETE CASCADE,
  period date NOT NULL,
  value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (index_id, period)
);
GRANT SELECT ON public.index_points TO anon, authenticated;
GRANT ALL ON public.index_points TO service_role;
ALTER TABLE public.index_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "index_points public read" ON public.index_points FOR SELECT USING (true);
CREATE POLICY "index_points admin write" ON public.index_points FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'::app_role));

-- A6: rankings + ranking_entries
CREATE TABLE IF NOT EXISTS public.rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  methodology_note text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  country_code text DEFAULT 'KE',
  sample_size int,
  is_sample boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rankings TO anon, authenticated;
GRANT ALL ON public.rankings TO service_role;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rankings public read" ON public.rankings FOR SELECT USING (is_published);
CREATE POLICY "rankings admin write" ON public.rankings FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_rankings_updated BEFORE UPDATE ON public.rankings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.ranking_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id uuid NOT NULL REFERENCES public.rankings(id) ON DELETE CASCADE,
  label text NOT NULL,
  logo_url text,
  score numeric,
  rank int NOT NULL,
  change int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ranking_entries TO anon, authenticated;
GRANT ALL ON public.ranking_entries TO service_role;
ALTER TABLE public.ranking_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranking_entries public read" ON public.ranking_entries FOR SELECT USING (true);
CREATE POLICY "ranking_entries admin write" ON public.ranking_entries FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'::app_role));

-- A7: reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  contents jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_url text,
  sample_url text,
  file_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  country_code text DEFAULT 'KE',
  price_kes int NOT NULL DEFAULT 0,
  access text NOT NULL DEFAULT 'free',
  is_sample boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reports TO anon, authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports public read" ON public.reports FOR SELECT USING (is_published);
CREATE POLICY "reports admin write" ON public.reports FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- A8: podcast_episodes
CREATE TABLE IF NOT EXISTS public.podcast_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  guest_name text,
  guest_title text,
  guest_org text,
  audio_url text,
  video_url text,
  duration_label text,
  linked_market_slug text,
  published_at timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.podcast_episodes TO anon, authenticated;
GRANT ALL ON public.podcast_episodes TO service_role;
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "podcast public read" ON public.podcast_episodes FOR SELECT USING (is_published);
CREATE POLICY "podcast admin write" ON public.podcast_episodes FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_podcast_updated BEFORE UPDATE ON public.podcast_episodes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- A9: daily_questions
CREATE TABLE IF NOT EXISTS public.daily_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  country_code text DEFAULT 'KE',
  active_date date NOT NULL DEFAULT current_date,
  is_sample boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_questions TO anon, authenticated;
GRANT ALL ON public.daily_questions TO service_role;
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_q public read" ON public.daily_questions FOR SELECT USING (true);
CREATE POLICY "daily_q admin write" ON public.daily_questions FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(),'admin'::app_role));
