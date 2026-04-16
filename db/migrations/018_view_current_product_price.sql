-- ============================================================
-- 018_view_current_product_price.sql
-- View: current_product_price
--
-- Returns the latest unit price for each ACTIVE product.
-- One row per product. Products with no pricehist row excluded.
--
-- Used by:
--   - getAllCurrentPrices() and getCurrentPrice() in priceHistService.js
--   - ProductsPage Current Price column (S2-T04)
--   - REP_001 Product Report (S3-T01, Sprint 3)
-- ============================================================

DROP VIEW IF EXISTS public.current_product_price;

CREATE VIEW public.current_product_price AS
SELECT
  p.prodcode,
  p.description,
  p.unit,
  p.record_status,
  ph.unitprice,
  ph.effdate
FROM public.product p
INNER JOIN public.pricehist ph
  ON ph.prodcode = p.prodcode
WHERE p.record_status = 'ACTIVE'
  AND ph.effdate = (
    SELECT MAX(ph2.effdate)
    FROM public.pricehist ph2
    WHERE ph2.prodcode = p.prodcode
  )
ORDER BY p.prodcode;

-- Grant SELECT to the authenticated role (Supabase JS client)
-- and anon role (needed for Supabase's internal query routing)
GRANT SELECT ON public.current_product_price TO authenticated;
GRANT SELECT ON public.current_product_price TO anon;
