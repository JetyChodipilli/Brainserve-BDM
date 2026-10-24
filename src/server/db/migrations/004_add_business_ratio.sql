-- 004_add_business_ratio.sql
-- Add business_ratio column for manual entry based on offline negotiation

ALTER TABLE deals ADD COLUMN IF NOT EXISTS business_ratio VARCHAR(100);
