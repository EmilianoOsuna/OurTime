-- Support cover positioning coordinates in the plans table
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS cover_position_x SMALLINT NOT NULL DEFAULT 50
    CHECK (cover_position_x BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS cover_position_y SMALLINT NOT NULL DEFAULT 50
    CHECK (cover_position_y BETWEEN 0 AND 100);

-- Ensure permission_level column exists on story_members table
ALTER TABLE story_members
  ADD COLUMN IF NOT EXISTS permission_level TEXT NOT NULL DEFAULT 'member'
    CHECK (permission_level IN ('admin', 'member'));

-- Create helper function to check if user is admin of a story (using security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_story_admin(p_story_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM story_members
    WHERE story_id = p_story_id AND user_id = auth.uid() AND permission_level = 'admin'
  );
$$;

-- Drop existing delete policy on story_members if it exists
DROP POLICY IF EXISTS "story_members_delete" ON story_members;

-- Re-create delete policy on story_members to allow self-delete or admin kick
CREATE POLICY "story_members_delete" ON story_members
  FOR DELETE USING (
    user_id = auth.uid() OR is_story_admin(story_id)
  );

-- Create update policy on story_members to allow self-role update or admin promotion/demotion
DROP POLICY IF EXISTS "story_members_update" ON story_members;
CREATE POLICY "story_members_update" ON story_members
  FOR UPDATE USING (
    user_id = auth.uid() OR is_story_admin(story_id)
  );
