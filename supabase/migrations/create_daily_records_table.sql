-- Daily heartbeat: one row per calendar day (UTC)
CREATE TABLE IF NOT EXISTS daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date DATE NOT NULL UNIQUE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_records_record_date ON daily_records(record_date);
CREATE INDEX IF NOT EXISTS idx_daily_records_recorded_at ON daily_records(recorded_at);

ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to daily_records" ON daily_records
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on daily_records" ON daily_records
  FOR SELECT
  TO anon
  USING (true);
