-- ===== Autor de recuerdos =====
-- `memories` no guardaba quién subió cada foto, así que la UI solo podía
-- enseñar el avatar de la sesión activa (bug). `created_by` es nullable:
-- las fotos antiguas quedan sin autor y la UI muestra solo la fecha.
--
-- La FK apunta a profiles (no a auth.users) para que PostgREST resuelva el
-- join embebido `profiles(full_name, avatar_url, accessory)` — mismo patrón
-- que story_members.user_id.

ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_memories_created_by ON memories(created_by);

-- RLS: un insert solo puede atribuirse al propio usuario (o quedar sin autor).
DROP POLICY IF EXISTS "memories_insert" ON memories;
CREATE POLICY "memories_insert" ON memories
  FOR INSERT WITH CHECK (
    story_id IN (SELECT get_user_story_ids())
    AND (created_by IS NULL OR created_by = auth.uid())
  );
