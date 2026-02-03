-- Add Meta Ads credentials fields to client_profile
ALTER TABLE public.client_profile 
ADD COLUMN IF NOT EXISTS instagram_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instagram_login text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instagram_password text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS facebook_login text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS facebook_password text DEFAULT NULL;