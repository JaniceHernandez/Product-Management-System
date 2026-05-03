-- ============================================================
-- 05_enable_rls.sql
-- Enable Row Level Security on all application tables.
-- Actual policies are defined in section 09.
-- ============================================================

alter table public.product          enable row level security;
alter table public.pricehist        enable row level security;
alter table public.salesdetail      enable row level security;
alter table public.user             enable row level security;
alter table public.module           enable row level security;
alter table public.rights           enable row level security;
alter table public.user_module      enable row level security;
alter table public.usermodule_rights enable row level security;
alter table public.activity_log     enable row level security;