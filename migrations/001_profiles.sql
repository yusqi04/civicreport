-- 001_profiles.sql — tabel profil/pengguna (lokal)
-- Catatan: pada versi Supabase nanti, email+password dipindah ke auth.users,
-- tabel profiles tinggal menyimpan id/full_name/role.

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
