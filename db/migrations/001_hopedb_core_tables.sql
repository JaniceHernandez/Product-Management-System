-- ============================================================
-- 001_hopedb_core_tables.sql
-- HopeDB Core Tables: product, priceHist, salesDetail
-- Hope, Inc. Product Management System
-- ============================================================
-- Product table

CREATE TABLE IF NOT EXISTS public.product (

prodCode    VARCHAR(6)   PRIMARY KEY,

description VARCHAR(30)  NOT NULL,

unit        VARCHAR(3)   CHECK (unit IN ('pc', 'ea', 'mtr', 'pkg', 'ltr'))

);


-- Price history table

CREATE TABLE IF NOT EXISTS public.priceHist (

effDate     DATE          NOT NULL,

prodCode    VARCHAR(6)    NOT NULL REFERENCES public.product(prodCode),

unitPrice   DECIMAL(10,2) CHECK (unitPrice > 0),

PRIMARY KEY (effDate, prodCode)

);


-- Sales detail table (used by REP_002 top-selling report)

CREATE TABLE IF NOT EXISTS public.salesDetail (

salesId     SERIAL        PRIMARY KEY,

prodCode    VARCHAR(6)    NOT NULL REFERENCES public.product(prodCode),

quantity    DECIMAL(10,2) NOT NULL CHECK (quantity > 0),

saleDate    DATE          NOT NULL

);
