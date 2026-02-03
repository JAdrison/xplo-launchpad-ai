-- Add simplified fields to icps table
ALTER TABLE public.icps 
ADD COLUMN IF NOT EXISTS profession text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS age text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gender text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reason_needs_solution text DEFAULT NULL;

-- Add secondary pain and desires to icp_pains table
ALTER TABLE public.icp_pains 
ADD COLUMN IF NOT EXISTS secondary_pain text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desire_1 text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS desire_2 text DEFAULT NULL;