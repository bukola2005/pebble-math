-- ======================================================================
-- Pebble Math — accounts, profiles, players and their progress
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
--   monster       picked by the grown-up on the dashboard so they can tell
--                 their children apart. Not the in-game character. Any
--                 monster but purple, which is Blob, the guide
--                 (src/data/monsters.js)
--   character     the Zizi look the child picked, or null until they have
--                 (ids live in src/data/zizi.js)
--   game_name     the in-game name the child built by tapping two words
--                 (src/data/gameNames.js). Never typed, so two words
--                 only, letters and hyphens
--   first_play_done  false until the child has watched (or skipped) the
--                 opening film
--   scene1_done   false until the child has played the market's first scene
-- Band and class values are mirrored in src/data/players.js.
-- ----------------------------------------------------------------------
create table if not exists public.players (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 24),
  age_band     text not null check (age_band in ('under-7', '7-8', '9-10', '11-plus')),
  class_level  text check (class_level in (
                 'kindergarten', 'primary-1', 'primary-2', 'primary-3',
                 'primary-4', 'primary-5', 'primary-6')),
  monster      text check (monster in (
                 'green', 'blue', 'orange', 'pink', 'yellow', 'teal', 'lavender')),
  character    text check (char_length(character) between 1 and 32),
  game_name    text check (char_length(game_name) between 3 and 40
                           and game_name ~ '^[A-Za-z-]+ [A-Za-z-]+$'),
  first_play_done boolean not null default false,
  scene1_done  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- A players table made by an earlier version of this file is missing some
-- of these columns, and may have a required character that defaulted to
-- purple. These bring it up to date; on a fresh table they change nothing.
alter table public.players
  add column if not exists first_play_done boolean not null default false;
alter table public.players
  add column if not exists scene1_done boolean not null default false;
alter table public.players
  add column if not exists monster text check (monster in (
    'green', 'blue', 'orange', 'pink', 'yellow', 'teal', 'lavender'));
alter table public.players
  add column if not exists game_name text check (char_length(game_name) between 3 and 40
                                                 and game_name ~ '^[A-Za-z-]+ [A-Za-z-]+$');
-- Kindergarten joined the class levels. Primary 4 to 6 stay allowed for
-- children added before the form stopped offering them.
alter table public.players drop constraint if exists players_class_level_check, add constraint players_class_level_check check (class_level in ('kindergarten', 'primary-1', 'primary-2', 'primary-3', 'primary-4', 'primary-5', 'primary-6'));
alter table public.players alter column character drop not null;
alter table public.players alter column character drop default;

-- `character` used to hold a monster; it now holds a Zizi look. Move an old
-- monster across to `monster`, where it still tells the grown-up which
-- child is which (purple, Blob, isn't anyone's), then clear `character`
-- so that child chooses a look on their next play.
update public.players
   set monster = character
 where monster is null
   and character in ('green', 'blue', 'orange', 'pink', 'yellow', 'teal', 'lavender');

update public.players
   set character = null
 where character is not null
   and character not in ('zizi-headband', 'zizi-cornrows', 'zizi-afro',
                         'zizi-puffs', 'zizi-twists', 'zizi-braids');

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
-- stall_progress: one row per market stall a child has cleared. The
-- number of rows is how many locks on the map are open. Adding a stall
-- is one more id in the check.
--
-- It has no profile_id of its own, so its policies check that the player
-- the row is for belongs to the caller. There is no update or delete:
-- a cleared stall stays cleared, and deleting the player removes its rows.
-- ----------------------------------------------------------------------
create table if not exists public.stall_progress (
  player_id  uuid not null references public.players (id) on delete cascade,
  stall_id   text not null check (stall_id in ('fruit-stall', 'fruit-stall-chapter-1')),
  cleared_at timestamptz not null default now(),
  primary key (player_id, stall_id)
);

-- For a database made before Chapter 1: the Fruit Stall's tutorial is
-- 'fruit-stall', its Chapter 1 'fruit-stall-chapter-1'.
alter table public.stall_progress drop constraint if exists stall_progress_stall_id_check, add constraint stall_progress_stall_id_check check (stall_id in ('fruit-stall', 'fruit-stall-chapter-1'));

alter table public.stall_progress enable row level security;
revoke all on public.stall_progress from anon;
grant select, insert on public.stall_progress to authenticated;

drop policy if exists "stall_progress_select_own" on public.stall_progress;
create policy "stall_progress_select_own" on public.stall_progress
  for select to authenticated
  using (exists (select 1 from public.players p
                 where p.id = player_id and p.profile_id = (select auth.uid())));

drop policy if exists "stall_progress_insert_own" on public.stall_progress;
create policy "stall_progress_insert_own" on public.stall_progress
  for insert to authenticated
  with check (exists (select 1 from public.players p
                      where p.id = player_id and p.profile_id = (select auth.uid())));


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


-- ----------------------------------------------------------------------
-- "Delete my account" on the dashboard. Deletes the caller's own sign-in;
-- their profile, players and stall_progress rows go with it (each table
-- references the one above it on delete cascade). It can only ever delete
-- the account that calls it: there is no argument to point it elsewhere.
--
-- `security definer` lets it delete from auth.users, which a signed-in
-- account can't touch directly; `set search_path = ''` keeps a look-alike
-- object in another schema from being picked up.
-- ----------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
