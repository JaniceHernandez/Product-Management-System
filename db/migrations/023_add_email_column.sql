-- ============================================================
-- 023_add_email_column.sql
-- Adds email column to public.user.
-- Populated by provision_new_user() trigger on auth.users INSERT.
-- Read-only after provisioning — no UPDATE policy needed..
-- ============================================================

-- 1. Add the column (safe if already exists)
ALTER TABLE public.user
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill email for existing users from auth.users
-- (Runs once — matches by userid = auth.users.id::TEXT)
UPDATE public.user u
SET email = au.email
FROM auth.users au
WHERE u.userid = au.id::TEXT
  AND u.email IS NULL;

-- 3. Verify the backfill
SELECT userid, username, email FROM public.user LIMIT 10;
-- Expected: all existing rows now have email populated

DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS provision_new_user();

CREATE OR REPLACE FUNCTION provision_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_username TEXT;
BEGIN
  v_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );

  IF NOT EXISTS (SELECT 1 FROM public.user WHERE userid = NEW.id::TEXT) THEN

    INSERT INTO public.user (
      userid, username, lastName, firstName,
      user_type, record_status, email, stamp
    ) VALUES (
      NEW.id::TEXT,
      v_username,
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'),  ''), ''),
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), v_username),
      'USER',
      'INACTIVE',
      NEW.email,
      'REGISTERED ' || NEW.id::TEXT || ' ' || NOW()::TEXT
    );

    INSERT INTO public.user_module (userid, Module_ID, rights_value, record_status, stamp)
    VALUES
      (NEW.id::TEXT, 'Prod_Mod',   1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'Report_Mod', 1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'Adm_Mod',    0, 'ACTIVE', 'AUTO');

    INSERT INTO public."UserModule_Rights" (userid, Right_ID, Right_value, Record_status, Stamp)
    VALUES
      (NEW.id::TEXT, 'PRD_ADD',  1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'PRD_EDIT', 1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'PRD_DEL',  0, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'REP_001',  1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'REP_002',  0, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'ADM_USER', 0, 'ACTIVE', 'AUTO');

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION provision_new_user();