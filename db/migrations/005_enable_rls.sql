-- ============================================================
-- 005_enable_rls.sql
-- Enable Row Level Security on all application tables
-- Actual policies are added in Sprint 2 (S2-T08, S2-T09, S3-T07)
-- ============================================================
ALTER TABLE public.product          ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.priceHist        ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.salesDetail      ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user             ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.Module           ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rights           ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_module      ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.UserModule_Rights ENABLE ROW LEVEL SECURITY;
