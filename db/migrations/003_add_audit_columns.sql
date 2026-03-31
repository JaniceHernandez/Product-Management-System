-- Add to product
ALTER TABLE product
  ADD COLUMN IF NOT EXISTS record_status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS stamp VARCHAR(60);

ALTER TABLE product
  ADD CONSTRAINT chk_product_status
  CHECK (record_status IN ('ACTIVE', 'INACTIVE'));

-- Add to priceHist
ALTER TABLE "priceHist"
  ADD COLUMN IF NOT EXISTS stamp VARCHAR(60);