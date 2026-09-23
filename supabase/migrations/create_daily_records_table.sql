-- Daily heartbeat: one row per calendar day (UTC).
CREATE TABLE IF NOT EXISTS daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date DATE NOT NULL UNIQUE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_records_record_date ON daily_records(record_date);
CREATE INDEX IF NOT EXISTS idx_daily_records_recorded_at ON daily_records(recorded_at);

ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts to daily_records" ON daily_records;
DROP POLICY IF EXISTS "Allow anonymous select on daily_records" ON daily_records;

CREATE POLICY "Allow anonymous inserts to daily_records" ON daily_records
  FOR INSERT
  TO anon
  WITH CHECK (record_date = (NOW() AT TIME ZONE 'UTC')::DATE);

-- The table contains only heartbeat dates and must be readable so clients can
-- avoid racing to insert the same unique date.
CREATE POLICY "Allow anonymous select on daily_records" ON daily_records
  FOR SELECT
  TO anon
  USING (true);
