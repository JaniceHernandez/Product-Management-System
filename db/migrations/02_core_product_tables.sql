-- ============================================================
-- 02_core_product_tables.sql
-- Core product domain tables: product, pricehist, salesdetail
-- ============================================================

create table if not exists public.product (
  prodcode      varchar(6)    primary key,
  description   varchar(30)   not null,
  unit          varchar(3)    check (unit in ('pc', 'ea', 'mtr', 'pkg', 'ltr')),
  record_status varchar(10)   not null default 'ACTIVE'
                              check (record_status in ('ACTIVE', 'INACTIVE')),
  stamp         varchar(120)
);

create table if not exists public.pricehist (
  effdate       date           not null,
  prodcode      varchar(6)     not null references public.product(prodcode),
  unitprice     decimal(10,2)  check (unitprice > 0),
  stamp         varchar(120),
  primary key (effdate, prodcode)
);

create table if not exists public.salesdetail (
  salesid       serial         primary key,
  prodcode      varchar(6)     not null references public.product(prodcode),
  quantity      decimal(10,2)  not null check (quantity > 0),
  saledate      date           not null
);