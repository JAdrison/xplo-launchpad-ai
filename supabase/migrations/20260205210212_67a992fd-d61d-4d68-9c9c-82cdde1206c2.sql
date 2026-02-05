-- Add new columns for the redesigned customer profile structure
ALTER TABLE icps 
  ADD COLUMN IF NOT EXISTS who_is TEXT,
  ADD COLUMN IF NOT EXISTS when_seeks TEXT,
  ADD COLUMN IF NOT EXISTS is_ideal TEXT CHECK (is_ideal IN ('ideal', 'good_not_ideal', 'no_more'));

-- Migrate existing reason_needs_solution data to why_buys concept (same column, different UI label)
-- The reason_needs_solution column will be repurposed as "why_buys" in the UI