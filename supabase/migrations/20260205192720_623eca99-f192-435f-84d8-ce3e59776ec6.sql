-- Adicionar novas colunas na tabela ads para suportar estrutura de 15 anúncios

-- Colunas para anúncios estáticos
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS subheadline text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS eliminators text[];
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS angle text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS focus text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS visual_suggestion text;

-- Colunas para roteiros de vídeo (estrutura de 6 seções)
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_type text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_hook text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_problem text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_why_bad text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_solution text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_proof text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_cta text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_duration text;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_visual_notes text;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.ads.angle IS 'Ângulo do anúncio: pain ou desire';
COMMENT ON COLUMN public.ads.focus IS 'Foco específico: main_pain, secondary_pain, desire_1, etc';
COMMENT ON COLUMN public.ads.eliminators IS 'Array de bullets SEM X (objeções eliminadas)';
COMMENT ON COLUMN public.ads.video_type IS 'Tipo de vídeo: pattern_break, question_box, daily_scene, location_based, social_proof';
COMMENT ON COLUMN public.ads.video_hook IS 'Chamada inicial que prende atenção';
COMMENT ON COLUMN public.ads.video_problem IS 'Descrição do problema que a pessoa enfrenta';
COMMENT ON COLUMN public.ads.video_why_bad IS 'Consequência de não resolver o problema';
COMMENT ON COLUMN public.ads.video_solution IS 'Apresentação da solução';
COMMENT ON COLUMN public.ads.video_proof IS 'Prova/evidência (opcional)';
COMMENT ON COLUMN public.ads.video_cta IS 'Call to action final';
COMMENT ON COLUMN public.ads.video_duration IS 'Duração estimada do vídeo (20-80s)';