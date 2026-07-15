-- Security hardening: Storage bucket, story_members join, message editing.
-- See security audit 2026-07-08.

-- ============================================================
-- 1. STORAGE: lock down the `Fotos` bucket
-- ============================================================
-- Previously: SELECT+DELETE open to role `public` (incl. anonymous) and
-- INSERT/UPDATE open to any authenticated user, all scoped only by
-- bucket_id = 'Fotos'. Anyone with the (public) anon key could list,
-- download, overwrite and DELETE every file of every user.
--
-- New model: authenticated-only, scoped to the caller's stories. Upload
-- paths in the client take four shapes, all mapped here:
--   <story_id>/<ts>.webp        memories / plan photos
--   covers/<story_id>/<ts>.webp story covers
--   plans/<plan_id>.webp        plan cover  (mapped to its story)
--   avatars/<user_id>.webp      user avatar (owner only)

create or replace function public.can_access_fotos(object_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  seg text;
begin
  if object_name is null then
    return false;
  end if;

  -- avatars/<user_id>.webp  → only the owning user may write it
  if object_name like 'avatars/%' then
    return split_part(object_name, '/', 2) = auth.uid()::text || '.webp';
  end if;

  -- plans/<plan_id>.webp  → members of the plan's story
  if object_name like 'plans/%' then
    seg := replace(split_part(object_name, '/', 2), '.webp', '');
    if seg !~ '^[0-9a-fA-F-]{36}$' then
      return false;
    end if;
    return exists (
      select 1 from plans p
      where p.id = seg::uuid
        and p.story_id in (select get_user_story_ids())
    );
  end if;

  -- covers/<story_id>/...  → members of the story
  if object_name like 'covers/%' then
    seg := split_part(object_name, '/', 2);
  else
    -- <story_id>/...  → members of the story
    seg := split_part(object_name, '/', 1);
  end if;

  if seg !~ '^[0-9a-fA-F-]{36}$' then
    return false;
  end if;
  return seg::uuid in (select get_user_story_ids());
end;
$$;

revoke execute on function public.can_access_fotos(text) from public, anon;
grant  execute on function public.can_access_fotos(text) to authenticated;

drop policy if exists "Permitir lectura"                    on storage.objects;
drop policy if exists "Permitir subidas"                    on storage.objects;
drop policy if exists "Permitir actualizar archivos"        on storage.objects;
drop policy if exists "Permitir borrar archivos de storage" on storage.objects;

-- Read/list: scoped to the caller's own stories (prevents enumerating other
-- users' filenames). The bucket is still public, so display via public object
-- URLs keeps working regardless; this policy only governs the authenticated
-- object API and `list`.
create policy "fotos_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'Fotos' and public.can_access_fotos(name));

create policy "fotos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'Fotos' and public.can_access_fotos(name));

create policy "fotos_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'Fotos' and public.can_access_fotos(name))
  with check (bucket_id = 'Fotos' and public.can_access_fotos(name));

create policy "fotos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'Fotos' and public.can_access_fotos(name));

-- ============================================================
-- 2. story_members: joining a story must go through the invite RPC
-- ============================================================
-- Previously INSERT only checked user_id = auth.uid(), so anyone who learned
-- a story UUID could add themselves as a member without the invite code.
-- Now a user may only insert themselves into a story THEY created (the
-- create-story flow); joining someone else's story goes exclusively through
-- join_story_by_invite_code() (SECURITY DEFINER, bypasses RLS).

create or replace function public.is_story_creator(p_story_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from stories
    where id = p_story_id and created_by = auth.uid()
  );
$$;

revoke execute on function public.is_story_creator(uuid) from public, anon;
grant  execute on function public.is_story_creator(uuid) to authenticated;

drop policy if exists "story_members_insert" on story_members;
create policy "story_members_insert" on story_members
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_story_creator(story_id));

-- ============================================================
-- 3. messages: a member may only edit their OWN messages
-- ============================================================
-- Previously UPDATE was scoped to the story but not the sender, letting any
-- member overwrite another member's messages.

drop policy if exists "messages_update" on messages;
create policy "messages_update" on messages
  for update to authenticated
  using (sender_id = auth.uid() and story_id in (select get_user_story_ids()))
  with check (sender_id = auth.uid() and story_id in (select get_user_story_ids()));

-- ============================================================
-- 4. Lock down SECURITY DEFINER functions exposed as RPC
-- ============================================================
-- handle_new_user is a trigger function and must never be RPC-callable.
-- Triggers run it regardless of EXECUTE grants, so revoking is safe.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Joining a story is only meaningful for signed-in users.
revoke execute on function public.join_story_by_invite_code(text) from public, anon;
grant  execute on function public.join_story_by_invite_code(text) to authenticated;

-- NOTE: get_user_story_ids(), is_story_admin(), is_story_creator() and
-- can_access_fotos() stay executable by `authenticated` on purpose — they are
-- invoked inside RLS policies, so revoking EXECUTE would break row-level
-- security. Called directly they only return the caller's own booleans.
