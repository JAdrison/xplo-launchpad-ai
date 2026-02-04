-- Adicionar campos de concorrentes na tabela client_profile
ALTER TABLE client_profile
ADD COLUMN IF NOT EXISTS local_competitor_1 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS local_competitor_2 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inspiration_company_1 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS inspiration_company_2 JSONB DEFAULT NULL;

-- Comentário: Estrutura esperada do JSONB:
-- { "name": "Nome da Empresa", "reason": "Motivo" }