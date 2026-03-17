-- P2 Migration: Add multimodal support columns
-- Adds source tracking and spatial metadata to reviews table
-- Adds source_url to products table

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source_modality TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source_file_name TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS spatial_metadata JSONB;

ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Backfill existing reviews with 'csv' as default modality
UPDATE reviews SET source_modality = 'csv' WHERE source_modality IS NULL;
