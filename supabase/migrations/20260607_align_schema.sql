-- Align schema to match the Claude Design handoff data model
-- Run this in your Supabase SQL editor.

-- 1. transactions: add user_id (who paid)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 2. couples: add invite_code + created_by
ALTER TABLE couples ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code);

-- 3. notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_couple_created
  ON notifications(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_couple_read
  ON notifications(couple_id, read);

-- 4. Enable Realtime for tables used by the app
alter publication supabase_realtime add table plans;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table memories;

-- 5. Auto-create profile on signup (if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', ''),
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;
