-- ============================================================
-- 020_view_top_selling_products.sql
-- View: top_selling_products
--
-- Returns top 10 ACTIVE products ranked by total quantity sold
-- across all salesDetail transactions.
--
-- Used by:
--   - REP_002 reports API function (S3-T01)
--   - TopSellingPage ranked list / bar chart (S3-T03)
--
-- Columns: prodcode, description, unit, totalqty
-- Only ACTIVE products included (soft-deleted excluded).
-- Products with no salesDetail rows are excluded (INNER JOIN).
-- ============================================================

DROP VIEW IF EXISTS public.top_selling_products;

CREATE VIEW public.top_selling_products AS
SELECT
  p.prodcode,
  p.description,
  p.unit,
  SUM(sd.quantity) AS totalqty
FROM public.product p
INNER JOIN public.salesdetail sd
  ON sd.prodcode = p.prodcode
WHERE p.record_status = 'ACTIVE'
GROUP BY
  p.prodcode,
  p.description,
  p.unit
ORDER BY totalqty DESC
LIMIT 10;

-- Grant SELECT to authenticated and anon roles
GRANT SELECT ON public.top_selling_products TO authenticated;
GRANT SELECT ON public.top_selling_products TO anon;