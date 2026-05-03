-- ============================================================
-- 11_seed_product_data.sql
-- Sample product and price history seed data.
-- SKIP this section if restoring a production database that
-- already contains live product records.
-- ============================================================

-- Sample products (subset of HopeDB catalogue)
insert into public.product (prodcode, description, unit, record_status, stamp) values
  ('AK0001', 'HP Pavilion DV6000',      'pc',  'ACTIVE', 'SEEDED'),
  ('AK0002', 'Micro Innovations Kb',     'pc',  'ACTIVE', 'SEEDED'),
  ('AM0001', 'MS Wireless Mouse',        'pc',  'ACTIVE', 'SEEDED'),
  ('MD0001', 'ASUS VS228H-P 22-In',      'ea',  'ACTIVE', 'SEEDED'),
  ('NB0001', 'Dell Inspiron Laptop',     'ea',  'ACTIVE', 'SEEDED'),
  ('NB0005', 'Apple Mac Pro Laptop',     'ea',  'ACTIVE', 'SEEDED'),
  ('PA0001', 'MS Ofc Business 2013',     'ea',  'ACTIVE', 'SEEDED'),
  ('PC0002', 'Dell 745 Opti Desk',       'ea',  'ACTIVE', 'SEEDED')
on conflict (prodcode) do nothing;

-- Sample price history for seeded products
insert into public.pricehist (effdate, prodcode, unitprice, stamp) values
  ('2010-05-15', 'AK0001', 12.00,   'SEEDED'),
  ('2010-05-15', 'AK0002', 8.37,    'SEEDED'),
  ('2010-05-15', 'AM0001', 36.45,   'SEEDED'),
  ('2010-05-15', 'MD0001', 119.68,  'SEEDED'),
  ('2010-08-01', 'MD0001', 131.65,  'SEEDED'),
  ('2010-05-15', 'NB0001', 300.00,  'SEEDED'),
  ('2011-02-01', 'NB0005', 1184.72, 'SEEDED'),
  ('2010-05-15', 'PA0001', 219.00,  'SEEDED'),
  ('2010-05-15', 'PC0002', 179.99,  'SEEDED'),
  ('2010-07-12', 'PC0002', 197.99,  'SEEDED')
on conflict (effdate, prodcode) do nothing;