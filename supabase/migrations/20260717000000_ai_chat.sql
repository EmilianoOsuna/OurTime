-- AI Chat: reemplaza el chat en tiempo real por un asistente IA.
-- La IA no es un usuario de auth.users, así que sender_id pasa a ser opcional
-- y cada mensaje lleva un rol ('user' | 'ai').

ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'ai'));

-- Los mensajes de la IA se insertan desde la Edge Function con la Service Role Key
-- (bypasa RLS). Los clientes autenticados solo pueden insertar mensajes propios
-- con role = 'user' — nunca suplantar a la IA.
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND role = 'user'
    AND story_id IN (SELECT get_user_story_ids())
  );
