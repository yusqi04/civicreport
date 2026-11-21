-- 004_fix_categories_and_evidence.sql — fix uploads on Vercel, duplicate categories, and custom category

-- 1. Tambah custom_category pada reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS custom_category TEXT;

-- 2. Tambah file_data dan mime_type pada report_evidence untuk mendukung serverless storage
ALTER TABLE report_evidence ADD COLUMN IF NOT EXISTS file_data BYTEA;
ALTER TABLE report_evidence ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- 3. Bersihkan duplikat kategori
WITH duplicates AS (
  SELECT id,
         FIRST_VALUE(id) OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at ASC) AS keep_id
  FROM report_categories
)
UPDATE reports
SET category_id = duplicates.keep_id
FROM duplicates
WHERE reports.category_id = duplicates.id AND duplicates.id != duplicates.keep_id;

WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at ASC) as rn
  FROM report_categories
)
DELETE FROM report_categories
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS uq_report_categories_name_lower
ON report_categories (LOWER(TRIM(name)));
