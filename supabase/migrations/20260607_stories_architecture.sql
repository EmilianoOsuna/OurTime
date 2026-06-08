-- Migration: stories_architecture
-- Replaces the couples model with a multi-group "stories" system.
-- couples → stories, couple_id → story_id everywhere.
-- Adds: story_members, albums, messages, parent_plan_id, place, budget_amount.

-- ===== 1. DROP OLD RLS POLICIES =====

DROP POLICY IF EXISTS "Allow anon read couples"            ON couples;
DROP POLICY IF EXISTS "couple_create"                     ON couples;
DROP POLICY IF EXISTS "couple_member_select"              ON couples;
DROP POLICY IF EXISTS "couple_update"                     ON couples;

DROP POLICY IF EXISTS "Pareja puede borrar sus memorias"  ON memories;
DROP POLICY IF EXISTS "Pareja puede crear memorias"       ON memories;
DROP POLICY IF EXISTS "Pareja puede ver sus memorias"     ON memories;

DROP POLICY IF EXISTS "notif_insert"                      ON notifications;
DROP POLICY IF EXISTS "notif_select"                      ON notifications;
DROP POLICY IF EXISTS "notif_update"                      ON notifications;

DROP POLICY IF EXISTS "Pareja puede borrar sus planes"    ON plans;
DROP POLICY IF EXISTS "Pareja puede crear planes"         ON plans;
DROP POLICY IF EXISTS "Pareja puede editar sus planes"    ON plans;
DROP POLICY IF EXISTS "Pareja puede ver sus planes"       ON plans;

DROP POLICY IF EXISTS "Pareja puede borrar sus transacciones"  ON transactions;
DROP POLICY IF EXISTS "Pareja puede crear transacciones"       ON transactions;
DROP POLICY IF EXISTS "Pareja puede editar sus transacciones"  ON transactions;
DROP POLICY IF EXISTS "Pareja puede ver sus transacciones"     ON transactions;

-- ===== 2. DROP OLD FK CONSTRAINTS =====

ALTER TABLE profiles      DROP CONSTRAINT IF EXISTS profiles_couple_id_fkey;
ALTER TABLE memories      DROP CONSTRAINT IF EXISTS memories_couple_id_fkey;
ALTER TABLE transactions  DROP CONSTRAINT IF EXISTS transactions_couple_id_fkey;
ALTER TABLE plans         DROP CONSTRAINT IF EXISTS plans_couple_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_couple_id_fkey;

-- ===== 3. CREATE NEW TABLES =====

-- stories: replaces couples
CREATE TABLE IF NOT EXISTS stories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  category    TEXT        CHECK (category IN ('pareja','amigos','familia','otro')) DEFAULT 'pareja',
  cover_url   TEXT,
  invite_code TEXT        UNIQUE NOT NULL,
  created_by  UUID        REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_invite_code ON stories(invite_code);
CREATE INDEX IF NOT EXISTS idx_stories_created_by  ON stories(created_by);

-- story_members: N-to-N membership
CREATE TABLE IF NOT EXISTS story_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id  UUID        REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id   UUID        REFERENCES auth.users(id) NOT NULL,
  role      TEXT        DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_members_user_id  ON story_members(user_id);
CREATE INDEX IF NOT EXISTS idx_story_members_story_id ON story_members(story_id);

-- albums: memory collections
CREATE TABLE IF NOT EXISTS albums (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id         UUID        REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  name             TEXT        NOT NULL,
  cover_memory_id  UUID,  -- FK to memories added later (forward ref)
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_albums_story_id ON albums(story_id);

-- messages: per-story chat
CREATE TABLE IF NOT EXISTS messages (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id  UUID        REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID        REFERENCES auth.users(id) NOT NULL,
  text      TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_story_created ON messages(story_id, created_at DESC);

-- ===== 4. MODIFY EXISTING TABLES =====

-- plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS story_id       UUID REFERENCES stories(id) ON DELETE CASCADE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS parent_plan_id UUID REFERENCES plans(id)   ON DELETE CASCADE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS place          TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS budget_amount  NUMERIC;
ALTER TABLE plans DROP COLUMN IF EXISTS couple_id;

-- memories
ALTER TABLE memories ADD COLUMN IF NOT EXISTS story_id  UUID REFERENCES stories(id)  ON DELETE CASCADE;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS album_id  UUID REFERENCES albums(id)   ON DELETE SET NULL;
ALTER TABLE memories DROP COLUMN IF EXISTS couple_id;

-- add deferred FK from albums.cover_memory_id → memories
ALTER TABLE albums ADD CONSTRAINT albums_cover_memory_id_fkey
  FOREIGN KEY (cover_memory_id) REFERENCES memories(id) ON DELETE SET NULL
  NOT VALID;

-- transactions
TRUNCATE transactions;  -- only test data, no production value
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES stories(id) ON DELETE CASCADE;
ALTER TABLE transactions DROP COLUMN IF EXISTS couple_id;

-- notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES stories(id) ON DELETE CASCADE;
ALTER TABLE notifications DROP COLUMN IF EXISTS couple_id;

-- profiles: membership is now via story_members
ALTER TABLE profiles DROP COLUMN IF EXISTS couple_id;

-- ===== 5. DROP OLD couples TABLE =====

DROP TABLE IF EXISTS couples CASCADE;

-- ===== 6. SECURITY DEFINER HELPER (avoids RLS recursion) =====

CREATE OR REPLACE FUNCTION public.get_user_story_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT story_id FROM story_members WHERE user_id = auth.uid();
$$;

-- RPC to join a story by invite code (called from frontend)
CREATE OR REPLACE FUNCTION public.join_story_by_invite_code(p_invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_story_id UUID;
BEGIN
  SELECT id INTO v_story_id FROM stories WHERE invite_code = p_invite_code;
  IF v_story_id IS NULL THEN
    RAISE EXCEPTION 'Código de invitación no válido';
  END IF;
  INSERT INTO story_members (story_id, user_id)
  VALUES (v_story_id, auth.uid())
  ON CONFLICT (story_id, user_id) DO NOTHING;
  RETURN v_story_id;
END;
$$;

-- ===== 7. RLS POLICIES =====

-- stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_select" ON stories
  FOR SELECT USING (
    id IN (SELECT get_user_story_ids()) OR created_by = auth.uid()
  );

CREATE POLICY "story_insert" ON stories
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "story_update" ON stories
  FOR UPDATE USING (
    id IN (SELECT get_user_story_ids())
  );

CREATE POLICY "story_delete" ON stories
  FOR DELETE USING (created_by = auth.uid());

-- story_members
ALTER TABLE story_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_members_select" ON story_members
  FOR SELECT USING (
    story_id IN (SELECT get_user_story_ids())
  );

CREATE POLICY "story_members_insert" ON story_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "story_members_delete" ON story_members
  FOR DELETE USING (user_id = auth.uid());

-- albums
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "albums_select" ON albums
  FOR SELECT USING (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "albums_insert" ON albums
  FOR INSERT WITH CHECK (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "albums_update" ON albums
  FOR UPDATE USING (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "albums_delete" ON albums
  FOR DELETE USING (story_id IN (SELECT get_user_story_ids()));

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND story_id IN (SELECT get_user_story_ids())
  );

-- plans (updated policies)
CREATE POLICY "plans_select" ON plans
  FOR SELECT USING (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "plans_insert" ON plans
  FOR INSERT WITH CHECK (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "plans_update" ON plans
  FOR UPDATE USING (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "plans_delete" ON plans
  FOR DELETE USING (story_id IN (SELECT get_user_story_ids()));

-- memories (updated policies)
CREATE POLICY "memories_select" ON memories
  FOR SELECT USING (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "memories_insert" ON memories
  FOR INSERT WITH CHECK (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "memories_delete" ON memories
  FOR DELETE USING (story_id IN (SELECT get_user_story_ids()));

-- transactions (updated policies)
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE USING (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE USING (story_id IN (SELECT get_user_story_ids()));

-- notifications (updated policies)
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (story_id IN (SELECT get_user_story_ids()));

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (story_id IN (SELECT get_user_story_ids()));

-- ===== 8. REALTIME FOR NEW TABLES =====

ALTER PUBLICATION supabase_realtime ADD TABLE stories;
ALTER PUBLICATION supabase_realtime ADD TABLE story_members;
ALTER PUBLICATION supabase_realtime ADD TABLE albums;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
