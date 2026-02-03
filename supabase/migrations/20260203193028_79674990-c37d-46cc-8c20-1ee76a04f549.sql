-- 1. Alterar region para array (múltiplas regiões)
ALTER TABLE public.client_profile 
ALTER COLUMN region TYPE text[] USING CASE 
  WHEN region IS NULL THEN NULL 
  ELSE ARRAY[region] 
END;

-- 2. Dores/Desejos no profile (não mais vinculado a ICP)
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS main_pain text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS secondary_pain text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS daily_impacts text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desire_1 text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desire_2 text DEFAULT NULL;

-- 3. Novos campos de Mercado
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS current_revenue text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS initial_traffic_investment text DEFAULT NULL;