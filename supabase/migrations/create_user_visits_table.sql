-- Stores Telegram visit analytics.
CREATE TABLE IF NOT EXISTS user_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tg_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  visit_count INTEGER NOT NULL,
  user_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_visits_tg_id ON user_visits(tg_id);
CREATE INDEX IF NOT EXISTS idx_user_visits_timestamp ON user_visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_visits_utm_source ON user_visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_user_visits_utm_medium ON user_visits(utm_medium);
CREATE INDEX IF NOT EXISTS idx_user_visits_utm_campaign ON user_visits(utm_campaign);

ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;

-- Keep the migration repeatable and analytics reads private.
DROP POLICY IF EXISTS "Allow anonymous inserts to user_visits" ON user_visits;
DROP POLICY IF EXISTS "Only admins can select user_visits" ON user_visits;

-- Browser clients may only insert bounded analytics payloads. No SELECT policy
-- is intentional: service_role and direct database connections bypass RLS.
CREATE POLICY "Allow anonymous inserts to user_visits" ON user_visits
  FOR INSERT
  TO anon
  WITH CHECK (
    char_length(tg_id) BETWEEN 1 AND 128
    AND visit_count BETWEEN 1 AND 1000000
    AND octet_length(user_data::text) <= 16384
    AND char_length(COALESCE(utm_source, '')) <= 512
    AND char_length(COALESCE(utm_medium, '')) <= 512
    AND char_length(COALESCE(utm_campaign, '')) <= 512
    AND char_length(COALESCE(utm_content, '')) <= 512
    AND char_length(COALESCE(utm_term, '')) <= 512
  );
