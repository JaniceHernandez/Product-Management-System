-- ============================================================
-- 04_activity_log_table.sql
-- Immutable activity audit log.
-- No UPDATE or DELETE policies — log entries are permanent.
-- ============================================================

create table if not exists public.activity_log (
  log_id        bigserial     primary key,
  actor_id      text          not null,
  actor_email   text,
  actor_role    text,
  action        text          not null,
  target_table  text,
  target_id     text,
  detail        text,
  created_at    timestamptz   not null default now()
);

create index if not exists idx_activity_log_actor_id
  on public.activity_log (actor_id);

create index if not exists idx_activity_log_created_at
  on public.activity_log (created_at desc);

create index if not exists idx_activity_log_action
  on public.activity_log (action);