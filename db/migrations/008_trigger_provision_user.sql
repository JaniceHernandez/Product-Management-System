-- ============================================================
-- 008_trigger_provision_user.sql
-- Auto-provisioning trigger: fires on every auth.users INSERT
-- Creates public.user row as USER/INACTIVE with default
-- module access and rights rows.
-- Project Guide Section 4.4
-- ============================================================

-- Drop existing function and trigger if re-deploying
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

  IF NOT EXISTS (SELECT 1 FROM public.user WHERE userId = NEW.id::TEXT) THEN
    INSERT INTO public.user (userId, username, lastName, firstName, user_type, record_status, stamp)
    VALUES (
      NEW.id::TEXT, v_username,
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''), ''),
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), v_username),
      'USER', 'INACTIVE',
      'REGISTERED ' || NEW.id::TEXT || ' ' || NOW()::TEXT
    );

    INSERT INTO public.user_module (userid, Module_ID, rights_value, record_status, stamp) VALUES
      (NEW.id::TEXT, 'Prod_Mod',   1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'Report_Mod', 1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'Adm_Mod',    0, 'ACTIVE', 'AUTO');

    INSERT INTO public."UserModule_Rights" (userid, "Right_ID", "Right_value", "Record_status", "Stamp") VALUES
      (NEW.id::TEXT, 'PRD_ADD',  1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'PRD_EDIT', 1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'PRD_DEL',  0, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'REP_001',  1, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'REP_002',  0, 'ACTIVE', 'AUTO'),
      (NEW.id::TEXT, 'ADM_USER', 0, 'ACTIVE', 'AUTO');
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION provision_new_user();


SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';