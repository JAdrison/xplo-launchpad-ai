-- Adicionar novos campos na tabela client_profile para o onboarding de 7 etapas
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS benefits text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotions text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS demand_channels text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS monthly_investment text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sales_team_size text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS revenue_goal text DEFAULT NULL;