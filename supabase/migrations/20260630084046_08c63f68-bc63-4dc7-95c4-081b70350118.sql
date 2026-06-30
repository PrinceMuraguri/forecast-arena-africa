
-- Link markets to sponsor organizations
ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS sponsor_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS markets_sponsor_org_id_idx ON public.markets(sponsor_org_id);

-- Seed a demo sponsor organization
INSERT INTO public.organizations (name, slug, kind, website)
VALUES ('Econsult Africa', 'econsult-africa', 'sponsor', 'https://econsultafrica.com')
ON CONFLICT (slug) DO NOTHING;

-- Attribute any unattributed markets to the demo sponsor
UPDATE public.markets
SET sponsor_org_id = (SELECT id FROM public.organizations WHERE slug = 'econsult-africa')
WHERE sponsor_org_id IS NULL;
