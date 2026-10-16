-- ======================================================================
-- Pebble Math — accounts, profiles and players
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- It is safe to run again: every statement is idempotent.
--
-- WHO OWNS WHAT
--   A parent or teacher owns the account (auth.users + profiles).
--   Children are rows in `players`, underneath that profile. A child never
--   has an email, a password or a login of their own, so none of these
--   tables has a column for one. Keep it that way.
-- ======================================================================


-- ----------------------------------------------------------------------
-- profiles: one row per adult account, created by the trigger below
-- ----------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('parent', 'teacher')),
  full_name  text not null default '' check (char_length(full_name) <= 80),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------
-- players: a child's profile under an adult. Nothing identifying.
--   display_name  what the child chose to be called (not a legal name)
--   age_band      a coarse band, never a date of birth
--   class_level   optional
--   character     the character the child picked on their first play, or
--                 null until they have (ids live in src/data/characters.js)
--   first_play_done  false until the child has watched the first-play
--                 introduction and reached the market
-- Band and class values are mirrored in src/data/players.js.
-- ----------------------------------------------------------------------
create table if not exists public.players (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 24),
  age_band     text not null check (age_band in ('under-7', '7-8', '9-10', '11-plus')),
  class_level  text check (class_level in (
                 'primary-1', 'primary-2', 'primary-3',
                 'primary-4', 'primary-5', 'primary-6')),
  character    text check (char_length(character) between 1 and 32),
  first_play_done boolean not null default false,
  created_at   timestamptz not null default now()
);

-- A players table made by an earlier version of this file has a required
-- character that defaulted to purple, and no first_play_done. These bring
-- it up to date; on a fresh table they change nothing.
alter table public.players
  add column if not exists first_play_done boolean not null default false;
alter table public.players alter column character drop not null;
alter table public.players alter column character drop default;

create index if not exists players_profile_id_idx on public.players (profile_id);


-- ----------------------------------------------------------------------
-- Row Level Security: a signed-in account can only ever see and change
-- its own profile and its own players. Signed-out visitors get nothing.
-- ----------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.players  enable row level security;

-- Be explicit about who may touch the tables at all; RLS then narrows it
-- to the caller's own rows. `anon` (signed out) gets no access.
revoke all on public.profiles, public.players from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.players to authenticated;

-- (select auth.uid()) rather than auth.uid() lets Postgres evaluate it once
-- per query instead of once per row.

-- profiles: read and edit your own row. There is no insert policy because
-- the trigger creates the row, and no delete policy because deleting the
-- auth user removes it.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- players: full control, but only over players that belong to you. The
-- `with check` clauses stop you creating or moving a player onto somebody
-- else's profile.
drop policy if exists "players_select_own" on public.players;
create policy "players_select_own" on public.players
  for select to authenticated
  using (profile_id = (select auth.uid()));

drop policy if exists "players_insert_own" on public.players;
create policy "players_insert_own" on public.players
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

drop policy if exists "players_update_own" on public.players;
create policy "players_update_own" on public.players
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

drop policy if exists "players_delete_own" on public.players;
create policy "players_delete_own" on public.players
  for delete to authenticated
  using (profile_id = (select auth.uid()));


-- ----------------------------------------------------------------------
-- Create the profile row automatically when someone signs up.
--
-- The sign-up form sends role and full_name as user metadata; that
-- metadata is chosen by the visitor, so it is checked here rather than
-- trusted. `security definer` lets the function write to profiles even
-- though the new user has no insert policy, and `set search_path = ''`
-- stops a look-alike object in another schema from being picked up, so
-- every name below is schema-qualified.
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' in ('parent', 'teacher')
        then new.raw_user_meta_data ->> 'role'
      else 'parent'
    end,
    left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80)
  );
  return new;
end;
$$;

-- Only the trigger should ever run this, never an API caller.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
