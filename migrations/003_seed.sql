-- 003_seed.sql — data awal (idempoten)

INSERT INTO report_categories (name, description)
SELECT name, description
FROM (VALUES
  ('Jalan rusak', 'Kerusakan jalan, lubang, atau fasilitas jalan'),
  ('Sampah', 'Tumpukan sampah atau pengangkutan sampah tidak berjalan'),
  ('Drainase', 'Saluran air tersumbat, genangan, atau banjir kecil'),
  ('Lampu jalan', 'Lampu jalan mati atau tidak menyala'),
  ('Fasilitas umum', 'Kerusakan fasilitas umum di sekitar'),
  ('Lainnya', 'Masalah lain yang tidak termasuk kategori di atas')
) AS v(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM report_categories rc WHERE LOWER(TRIM(rc.name)) = LOWER(TRIM(v.name))
);
