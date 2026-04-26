-- ============================================================
-- 025_simplify_stamps.sql
-- Old stamp format: ACTION userid YYYY-MM-DD HH:MM
-- New stamp format: ACTION YYYY-MM-DD HH:MM
--
-- 1. Updates provision_new_user() trigger to use new format.
-- 2. Backfills all existing stamp columns in all tables.
-- ============================================================

-- ── 1. Update provision_new_user() trigger ───────────────────
CREATE OR REPLACE FUNCTION public.provision_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username TEXT;
  v_stamp    TEXT;
BEGIN
  v_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );
  v_stamp := 'PROVISIONED ' || to_char(NOW(), 'YYYY-MM-DD HH24:MI');

  IF NOT EXISTS (SELECT 1 FROM public.user WHERE userid = NEW.id::TEXT) THEN
    INSERT INTO public.user (userid, username, email, user_type, record_status, stamp)
    VALUES (NEW.id::TEXT, v_username, NEW.email, 'USER', 'INACTIVE', v_stamp)
    ON CONFLICT (userid) DO NOTHING;

    INSERT INTO public.user_module (userid, Module_ID, rights_value, record_status, stamp)
    VALUES
      (NEW.id::TEXT, 'Prod_Mod',   1, 'ACTIVE', v_stamp),
      (NEW.id::TEXT, 'Report_Mod', 1, 'ACTIVE', v_stamp),
      (NEW.id::TEXT, 'Adm_Mod',   0, 'ACTIVE', v_stamp)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.UserModule_Rights (userid, Right_ID, Right_value, Record_status, Stamp)
    VALUES
      (NEW.id::TEXT, 'PRD_ADD',  1, 'ACTIVE', v_stamp),
      (NEW.id::TEXT, 'PRD_EDIT', 1, 'ACTIVE', v_stamp),
      (NEW.id::TEXT, 'PRD_DEL',  0, 'ACTIVE', v_stamp),
      (NEW.id::TEXT, 'REP_001',  1, 'ACTIVE', v_stamp),
      (NEW.id::TEXT, 'REP_002',  0, 'ACTIVE', v_stamp),
      (NEW.id::TEXT, 'ADM_USER', 0, 'ACTIVE', v_stamp)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 2. Backfill existing stamps in all tables ─────────────────
-- Regex matches: ACTION <any-non-space-token> YYYY-MM-DD HH:MM
-- Replaces with: ACTION YYYY-MM-DD HH:MM

UPDATE public.product
SET stamp = regexp_replace(
  stamp,
  '^(\w+)\s+\S+\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2})',
  '\1 \2'
)
WHERE stamp ~ '^\w+\s+\S+\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}';

UPDATE public.pricehist
SET stamp = regexp_replace(
  stamp,
  '^(\w+)\s+\S+\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2})',
  '\1 \2'
)
WHERE stamp ~ '^\w+\s+\S+\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}';

UPDATE public.user
SET stamp = regexp_replace(
  stamp,
  '^(\w+)\s+\S+\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2})',
  '\1 \2'
)
WHERE stamp ~ '^\w+\s+\S+\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}';

UPDATE public.UserModule_Rights
SET Stamp = regexp_replace(
  Stamp,
  '^(\w+)\s+\S+\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2})',
  '\1 \2'
)
WHERE Stamp ~ '^\w+\s+\S+\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}';

UPDATE public.user_module
SET stamp = regexp_replace(
  stamp,
  '^(\w+)\s+\S+\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2})',
  '\1 \2'
)
WHERE stamp ~ '^\w+\s+\S+\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}';

-- ── 3. Verify a sample ────────────────────────────────────────
SELECT prodcode, stamp FROM public.user LIMIT 5;
-- Expected: 'ADDED 2025-10-20 14:30' — no UUID in middle