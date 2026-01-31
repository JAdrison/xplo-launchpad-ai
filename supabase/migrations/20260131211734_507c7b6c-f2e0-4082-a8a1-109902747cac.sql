-- Add new fields to clients table for complete registration
ALTER TABLE public.clients
ADD COLUMN cnpj TEXT,
ADD COLUMN responsible_name TEXT,
ADD COLUMN responsible_cpf TEXT,
ADD COLUMN email TEXT,
ADD COLUMN phone TEXT,
ADD COLUMN product_description TEXT;