-- ============================================================
-- 07_views.sql
-- Application SQL views used by the React service layer.
-- ============================================================


-- ── current_product_price ───────────────────────────────────
-- Returns the latest unit price per ACTIVE product.
-- One row per product. INNER JOIN excludes products with
-- no price history entries.
drop view if exists public.current_product_price;

create view public.current_product_price as
select
  p.prodcode,
  p.description,
  p.unit,
  p.record_status,
  ph.unitprice,
  ph.effdate
from public.product p
inner join public.pricehist ph
  on ph.prodcode = p.prodcode
where p.record_status = 'ACTIVE'
  and ph.effdate = (
    select max(ph2.effdate)
    from public.pricehist ph2
    where ph2.prodcode = p.prodcode
  )
order by p.prodcode;

grant select on public.current_product_price to authenticated;
grant select on public.current_product_price to anon;


-- ── top_selling_products ─────────────────────────────────────
-- Returns top 10 ACTIVE products ranked by total quantity sold.
-- Requires salesdetail data. INNER JOIN excludes products with
-- no sales records.
DROP VIEW IF EXISTS public.top_selling_products CASCADE;

-- Create the view with totalvalue (sales value)
CREATE VIEW public.top_selling_products AS
SELECT
  p.prodcode,
  p.description,
  p.unit,
  COALESCE(SUM(sd.quantity), 0) AS totalqty,
  COALESCE(SUM(sd.quantity * ph.unitprice), 0) AS totalvalue
FROM public.product p
LEFT JOIN public.salesdetail sd ON sd.prodcode = p.prodcode
LEFT JOIN public.sales s ON s.transno = sd.transno
LEFT JOIN public.pricehist ph ON ph.prodcode = p.prodcode
  AND ph.effdate = (
    SELECT MAX(ph2.effdate)
    FROM public.pricehist ph2
    WHERE ph2.prodcode = p.prodcode
      AND ph2.effdate <= s.salesdate
  )
WHERE p.record_status = 'ACTIVE'
GROUP BY p.prodcode, p.description, p.unit
ORDER BY totalvalue DESC
LIMIT 10;

-- Grant permissions
GRANT SELECT ON public.top_selling_products TO authenticated;
GRANT SELECT ON public.top_selling_products TO anon;

SELECT prodcode, description, unit, totalqty, totalvalue 
FROM top_selling_products;