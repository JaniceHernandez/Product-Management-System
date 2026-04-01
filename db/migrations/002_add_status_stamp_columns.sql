-- ============================================================
-- 002_add_status_stamp_columns.sql
-- Add record_status and stamp columns to product and priceHist
-- ============================================================
-- Add to product

ALTER TABLE public.product

ADD COLUMN IF NOT EXISTS record_status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'

CHECK (record_status IN ('ACTIVE', 'INACTIVE')),

ADD COLUMN IF NOT EXISTS stamp VARCHAR(60);


-- Add to priceHist

ALTER TABLE public.priceHist

ADD COLUMN IF NOT EXISTS stamp VARCHAR(60);