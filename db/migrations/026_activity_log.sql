-- ============================================================
-- 026_activity_log.sql
-- Creates public.activity_log table with RLS policies.
-- Entries are inserted from React service functions via logActivity().
-- No DB trigger is used — the React layer is responsible for calling it.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  log_id       BIGSERIAL    PRIMARY KEY,
  actor_id     TEXT         NOT NULL,
  actor_email  TEXT,
  actor_role   TEXT,
  action       TEXT         NOT NULL,
  target_table TEXT,
  target_id    TEXT,
  detail       TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- SELECT: SUPERADMIN sees all; ADMIN sees own entries only
DROP POLICY IF EXISTS activity_log_select ON public.activity_log;
CREATE POLICY activity_log_select
  ON public.activity_log
  FOR SELECT
  TO authenticated
  USING (
    get_my_user_type() = 'SUPERADMIN'
    OR (get_my_user_type() = 'ADMIN' AND actor_id = auth.uid()::TEXT)
  );

-- INSERT: any authenticated user can insert their own entry
DROP POLICY IF EXISTS activity_log_insert ON public.activity_log;
CREATE POLICY activity_log_insert
  ON public.activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid()::TEXT);

-- No UPDATE or DELETE — logs are immutable
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT USAGE ON SEQUENCE public.activity_log_log_id_seq TO authenticated;

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_activity_log_actor_id   ON public.activity_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log (created_at DESC);

-- Verify table was created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'activity_log';
-- Expected: 1 rowclea