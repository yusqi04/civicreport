import { Pool } from "pg";

const globalForPool = globalThis as unknown as { __pgPool?: Pool };

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:password@127.0.0.1:5433/civicreport";

export const pool =
  globalForPool.__pgPool ??
  new Pool({
    connectionString,
    max: 10,
    ssl:
      connectionString.includes("neon.tech") ||
      connectionString.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.__pgPool = pool;
}

let schemaEnsured = false;
let schemaPromise: Promise<void> | null = null;

export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaEnsured) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    try {
      // 1. Pastikan kolom custom_category di reports
      await pool.query(`
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS custom_category TEXT;
      `);

      // 2. Pastikan kolom file_data dan mime_type di report_evidence
      await pool.query(`
        ALTER TABLE report_evidence ADD COLUMN IF NOT EXISTS file_data BYTEA;
        ALTER TABLE report_evidence ADD COLUMN IF NOT EXISTS mime_type TEXT;
      `);

      // 3. Bersihkan duplikat kategori di report_categories
      await pool.query(`
        DO $$
        BEGIN
          -- Perbarui referensi reports jika mengarah ke kategori duplikat
          WITH duplicates AS (
            SELECT id,
                   FIRST_VALUE(id) OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at ASC) AS keep_id
            FROM report_categories
          )
          UPDATE reports
          SET category_id = duplicates.keep_id
          FROM duplicates
          WHERE reports.category_id = duplicates.id AND duplicates.id != duplicates.keep_id;

          -- Hapus kategori duplikat
          WITH duplicates AS (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at ASC) as rn
            FROM report_categories
          )
          DELETE FROM report_categories
          WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

          -- Tambah index unik agar tidak duplikat lagi
          IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'uq_report_categories_name_lower'
          ) THEN
            CREATE UNIQUE INDEX uq_report_categories_name_lower
            ON report_categories (LOWER(TRIM(name)));
          END IF;
        END $$;
      `);

      schemaEnsured = true;
    } catch (err) {
      console.error("[ensureDatabaseSchema]", err);
    } finally {
      schemaPromise = null;
    }
  })();

  return schemaPromise;
}
