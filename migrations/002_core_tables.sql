-- 002_core_tables.sql — tabel inti laporan + riwayat status

CREATE TABLE IF NOT EXISTS report_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES report_categories (id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'verified', 'in_progress', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES profiles (id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at otomatis
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reports_set_updated_at ON reports;
CREATE TRIGGER reports_set_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Riwayat tidak boleh diedit/dihapus (immutable)
CREATE OR REPLACE FUNCTION forbid_history_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'report_status_history bersifat immutable (tidak bisa diubah/dihapus)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS report_status_history_immutable ON report_status_history;
CREATE TRIGGER report_status_history_immutable
  BEFORE UPDATE OR DELETE ON report_status_history
  FOR EACH ROW EXECUTE FUNCTION forbid_history_mutation();

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_category_id ON reports (category_id);
CREATE INDEX IF NOT EXISTS idx_evidence_report_id ON report_evidence (report_id);
CREATE INDEX IF NOT EXISTS idx_history_report_id ON report_status_history (report_id);
