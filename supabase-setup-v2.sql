-- ALOKIT integration migration v2
-- Run once in Supabase SQL Editor after the original ALOKIT schema.
-- Adds the contact email to the private designer profile table.
ALTER TABLE public.designer_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- The function is called by the authenticated founder dashboard.
-- It returns only a boolean and checks the current authenticated user.
GRANT EXECUTE ON FUNCTION public.is_alokit_admin() TO authenticated;

-- Keep RLS enabled. Existing policies limit profile/design/submission reads
-- to the owner or an account registered in public.admin_users.
