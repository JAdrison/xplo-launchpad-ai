-- Plano XPLO + Bônus por cliente
CREATE TYPE public.xplo_plan AS ENUM ('basic','pro');
CREATE TYPE public.xplo_bonus AS ENUM ('google_my_business','instagram_showcase');

ALTER TABLE public.clients
  ADD COLUMN xplo_plan public.xplo_plan NOT NULL DEFAULT 'basic',
  ADD COLUMN xplo_bonuses public.xplo_bonus[] NOT NULL DEFAULT ARRAY[]::public.xplo_bonus[];

-- Activities: campos de checkpoint e idempotência
ALTER TABLE public.activities
  ADD COLUMN checkpoint_code text,
  ADD COLUMN checkpoint_label text,
  ADD COLUMN required_plan public.xplo_plan,
  ADD COLUMN required_bonus public.xplo_bonus,
  ADD COLUMN template_key text;

CREATE UNIQUE INDEX activities_deal_template_unique
  ON public.activities(deal_id, template_key)
  WHERE template_key IS NOT NULL;