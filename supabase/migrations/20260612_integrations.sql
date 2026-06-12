ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_subscription JSONB,
  ADD COLUMN IF NOT EXISTS google_calendar_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS user_secrets (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, name)
);

ALTER TABLE user_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_secrets_select_own" ON user_secrets;
CREATE POLICY "user_secrets_select_own" ON user_secrets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_secrets_insert_own" ON user_secrets;
CREATE POLICY "user_secrets_insert_own" ON user_secrets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_secrets_update_own" ON user_secrets;
CREATE POLICY "user_secrets_update_own" ON user_secrets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_secrets_delete_own" ON user_secrets;
CREATE POLICY "user_secrets_delete_own" ON user_secrets
  FOR DELETE USING (auth.uid() = user_id);
