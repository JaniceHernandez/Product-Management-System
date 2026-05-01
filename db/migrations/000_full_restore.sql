-- ============================================================
-- 000_full_restore.sql
-- Hope, Inc. Product Management System — Full Database Restore
-- New Era University | BS Computer Science | AY 2025–2026
--
-- This script recreates the complete database structure and
-- security configuration from scratch on a clean Supabase project.
--
-- PREREQUISITES:
--   1. A new Supabase project exists and is accessible.
--   2. The Seeded Superadmin (jcesperanza@neu.edu.ph) has been
--      invited or created via the Supabase Dashboard → Authentication
--      BEFORE running section 08 (seed reference data).
--   3. Google OAuth is configured in the Supabase Dashboard
--      (Authentication → Providers → Google).
--
-- EXECUTION ORDER (all SQL runs in one transaction):
--   01 — Extensions and schema setup
--   02 — Core product tables
--   03 — Rights management tables
--   04 — Activity log table
--   05 — Enable RLS
--   06 — Functions and triggers
--   07 — Views
--   08 — Seed reference data (modules, rights, seeded superadmin)
--   09 — RLS policies
--   10 — Repair missing rights rows
--   11 — Sample product data (OPTIONAL — remove for production)
--
-- HOW TO USE:
--   Option A (recommended): Run each numbered section file
--     individually in Supabase SQL Editor, in order 01 → 11.
--   Option B: Paste this entire file into Supabase SQL Editor
--     and run it as a single query.
-- ============================================================

-- [PASTE CONTENT OF 01_extensions_and_schema.sql HERE]

-- [PASTE CONTENT OF 02_core_product_tables.sql HERE]

-- [PASTE CONTENT OF 03_rights_management_tables.sql HERE]

-- [PASTE CONTENT OF 04_activity_log_table.sql HERE]

-- [PASTE CONTENT OF 05_enable_rls.sql HERE]

-- [PASTE CONTENT OF 06_functions_and_triggers.sql HERE]

-- [PASTE CONTENT OF 07_views.sql HERE]

-- [PASTE CONTENT OF 08_seed_reference_data.sql HERE]

-- [PASTE CONTENT OF 09_rls_policies.sql HERE]

-- [PASTE CONTENT OF 10_repair_missing_rights.sql HERE]

-- [PASTE CONTENT OF 11_seed_product_data.sql HERE — OPTIONAL]