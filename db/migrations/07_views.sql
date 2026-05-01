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
drop view if exists public.top_selling_products;

create view public.top_selling_products as
select
  p.prodcode,
  p.description,
  p.unit,
  sum(sd.quantity) as totalqty
from public.product p
inner join public.salesdetail sd
  on sd.prodcode = p.prodcode
where p.record_status = 'ACTIVE'
group by p.prodcode, p.description, p.unit
order by totalqty desc
limit 10;

grant select on public.top_selling_products to authenticated;
grant select on public.top_selling_products to anon;