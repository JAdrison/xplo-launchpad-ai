-- Adicionar colunas na tabela offers_hormozi para suportar ICP específico e geração de demanda
ALTER TABLE offers_hormozi ADD COLUMN IF NOT EXISTS icp_id uuid REFERENCES icps(id);
ALTER TABLE offers_hormozi ADD COLUMN IF NOT EXISTS demand_generation_channels text[];
ALTER TABLE offers_hormozi ADD COLUMN IF NOT EXISTS demand_generation_strategies jsonb;