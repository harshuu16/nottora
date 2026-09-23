-- ==============================================================================
-- NOTTORA SUPABASE SECURITY HARDENING MIGRATION (SAFE & NON-DESTRUCTIVE)
-- ==============================================================================
-- Resolves Supabase Security Advisor warnings:
-- 1. Function Search Path Mutable — public.search_academic_materials
-- 2. Function Search Path Mutable — public.set_materials_updated_at
-- 3. Function Search Path Mutable — public.is_admin
-- 4. Public Can Execute SECURITY DEFINER Function — public.is_admin()
-- 5. Signed-In Users Can Execute SECURITY DEFINER Function — public.is_admin()
--
-- Safety Guarantees:
-- - Zero table/column drops
-- - Zero policy drops or security weakening
-- - Fully preserves Nottora Admin Portal authentication & permissions
-- - Preserves student anonymous search and PDF viewing
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: PIN SEARCH PATH FOR TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
-- Resolves: "Function Search Path Mutable — public.set_materials_updated_at"
CREATE OR REPLACE FUNCTION public.set_materials_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now());
    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- STEP 2: ENSURE PINNED SEARCH PATH FOR SEARCH RPC (IDEMPOTENT REINFORCEMENT)
-- ------------------------------------------------------------------------------
-- Resolves: "Function Search Path Mutable — public.search_academic_materials"
-- Note: You already ran ALTER FUNCTION for this; this ensures your migration remains in sync.
ALTER FUNCTION public.search_academic_materials(text, text, uuid)
SET search_path = '';

-- ------------------------------------------------------------------------------
-- STEP 3: HARDEN is_admin() AS SECURITY INVOKER WITH PINNED SEARCH PATH
-- ------------------------------------------------------------------------------
-- Resolves:
-- - "Function Search Path Mutable — public.is_admin"
-- - "Public Can Execute SECURITY DEFINER Function — public.is_admin()"
-- - "Signed-In Users Can Execute SECURITY DEFINER Function — public.is_admin()"
--
-- Why SECURITY INVOKER is safe & correct:
-- - is_admin() only inspects claims within auth.jwt() (an in-memory session helper).
-- - It accesses NO private tables, NO passwords, and NO elevated schemas.
-- - Converting from DEFINER to INVOKER removes the privilege escalation vector,
--   directly resolving both advisor warnings without breaking RLS evaluations
--   (such as storage.objects reading permissions for anonymous students).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT pg_catalog.coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- Explicitly ensure public execution privileges on the invoker function
-- (Required for anonymous and authenticated RLS evaluation on storage and tables)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- STEP 4: VERIFICATION AUDIT QUERY
-- ------------------------------------------------------------------------------
-- Run this query after applying the migration to verify all warnings are resolved.
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_type,
    p.proconfig AS configuration_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('is_admin', 'set_materials_updated_at', 'search_academic_materials');
