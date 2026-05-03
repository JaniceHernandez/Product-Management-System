-- ============================================================
-- 01_extensions_and_schema.sql
-- Extensions and schema preparation.
-- Run this first on a clean Supabase project.
-- ============================================================

-- uuid generation is provided by Supabase by default; no action needed.
-- Confirm public schema exists (it always does on Supabase).
set search_path to public;