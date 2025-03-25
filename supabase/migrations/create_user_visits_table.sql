-- Создание таблицы для хранения информации о посещениях
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

-- Создание индексов для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_user_visits_tg_id ON user_visits(tg_id);
CREATE INDEX IF NOT EXISTS idx_user_visits_timestamp ON user_visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_visits_utm_source ON user_visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_user_visits_utm_medium ON user_visits(utm_medium);
CREATE INDEX IF NOT EXISTS idx_user_visits_utm_campaign ON user_visits(utm_campaign);

-- Настройка политик безопасности Row Level Security
ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;

-- Создание политики для разрешения анонимной вставки данных (для веб-клиентов)
CREATE POLICY "Allow anonymous inserts to user_visits" ON user_visits
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Политика для чтения данных только администраторами
CREATE POLICY "Only admins can select user_visits" ON user_visits
  FOR SELECT
  USING (auth.role() = 'authenticated'); 