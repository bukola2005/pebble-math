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
--   round_reached the round the child is on in the chapter they are
--                 playing the first time (from 0), so they come back to
--                 it: Chapter 1's, or, once they have stepped into the
--                 Provision Store, Chapter 2's. Back to 0 once they have
--                 seen the map at a chapter's end
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
  round_reached smallint not null default 0 check (round_reached between 0 and 20),
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
alter table public.players
  add column if not exists round_reached smallint not null default 0 check (round_reached between 0 and 20);
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
-- stall_progress: one row per market stall, or stall chapter, a child has
-- cleared or reached: 'fruit-stall' for the Fruit Stall's tutorial,
-- 'fruit-stall-chapter-1' for its Chapter 1, 'provision-store' once a
-- child has stepped into the Provision Store, 'provision-store-chapter-2'
-- for its Chapter 2. The id is checked for its shape only (lower case,
-- words joined by hyphens), never against a list: every new place brings
-- new ids, and a list would need altering each time.
--
-- It has no profile_id of its own, so its policies check that the player
-- the row is for belongs to the caller. There is no update or delete:
-- a cleared stall stays cleared, and deleting the player removes its rows.
-- ----------------------------------------------------------------------
create table if not exists public.stall_progress (
  player_id  uuid not null references public.players (id) on delete cascade,
  stall_id   text not null check (stall_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(stall_id) <= 64),
  cleared_at timestamptz not null default now(),
  primary key (player_id, stall_id)
);

-- For a database made when the check was a list of ids.
alter table public.stall_progress drop constraint if exists stall_progress_stall_id_check, add constraint stall_progress_stall_id_check check (stall_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(stall_id) <= 64);

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
-- attempts: every answer a child gives after the tutorial, right or wrong,
-- if wrong which step broke, and whether they had asked for the hint
-- first (`used_hint`). In Chapter 1: each tap on Blob's "How many is
-- that?" (stages 'A-ask' and 'B-ask': `asked` is the total, `crates` and
-- `loose` what was on the table, `total` the number tapped, which says
-- what went wrong: its digits swapped, its digits added, or, for a number
-- like 22, the tens and ones side by side, 202); each Done on a Stage B
-- order (stage 'B': `asked` the number ordered, `total` what was on the
-- cloth); and each answer in the test rounds (stage 'C'). Chapter 2, the
-- Provision Store, uses the same stages; `crates` there is cartons of ten
-- tins, and in a shelf round `holds` is the shelf's size and `asked` how
-- many more it needed (Blob's "How many more did it need?" is 'A-ask' or
-- 'B-ask'). Collected now so the data is there when the teacher dashboard
-- is built; nothing shows it yet.
-- Like stall_progress, its policies check that the player belongs to the
-- caller, and it has no update or delete; deleting the player removes it.
-- stall_id and stage are not checked against a list: every new chapter
-- brings new ones, and a list would need altering each time.
-- ----------------------------------------------------------------------
create table if not exists public.attempts (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.players (id) on delete cascade,
  stall_id    text not null,
  stage       text not null,
  round       smallint not null check (round between 1 and 20),
  asked       smallint not null check (asked between 0 and 99),
  crates      smallint not null check (crates between 0 and 20),
  loose       smallint not null check (loose between 0 and 99),
  total       smallint check (total between 0 and 999),
  failed_step text check (failed_step in ('crates', 'loose', 'total')),
  used_hint   boolean not null default false,
  holds       smallint check (holds between 1 and 99),
  created_at  timestamptz not null default now()
);

create index if not exists attempts_player_idx on public.attempts (player_id, created_at);

-- For a database made with those two checks, and with room only for
-- two-digit totals.
alter table public.attempts drop constraint if exists attempts_stall_id_check, drop constraint if exists attempts_stage_check;
alter table public.attempts drop constraint if exists attempts_total_check, add constraint attempts_total_check check (total between 0 and 999);
-- And without the hint column: help is always there, and whether it was
-- used is recorded.
alter table public.attempts add column if not exists used_hint boolean not null default false;
-- And without the Provision Store's shelf size.
alter table public.attempts add column if not exists holds smallint check (holds between 1 and 99);

alter table public.attempts enable row level security;
revoke all on public.attempts from anon;
grant select, insert on public.attempts to authenticated;

drop policy if exists "attempts_select_own" on public.attempts;
create policy "attempts_select_own" on public.attempts
  for select to authenticated
  using (exists (select 1 from public.players p
                 where p.id = player_id and p.profile_id = (select auth.uid())));

drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own" on public.attempts
  for insert to authenticated
  with check (exists (select 1 from public.players p
                      where p.id = player_id and p.profile_id = (select auth.uid())));


-- ----------------------------------------------------------------------
-- lanterns: one row per lantern a child has earned (docs/story.md and
-- src/data/lanterns.js), where and why:
--   'teaching'  finishing a place's teaching chapter, once per place
--   'test'      finishing its test rounds, once per place
--   'replay'    coming back and doing the test rounds again, each time
-- Never for speed or for being right first time. Like stall_progress,
-- its policies check that the player belongs to the caller, and it has
-- no update or delete; deleting the player removes it.
-- ----------------------------------------------------------------------
create table if not exists public.lanterns (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.players (id) on delete cascade,
  stall_id   text not null,
  reason     text not null check (reason in ('teaching', 'test', 'replay')),
  earned_at  timestamptz not null default now()
);

-- The teaching and test lanterns come once per place; replays every time.
create unique index if not exists lanterns_once
  on public.lanterns (player_id, stall_id, reason) where reason in ('teaching', 'test');
create index if not exists lanterns_player_idx on public.lanterns (player_id);

alter table public.lanterns enable row level security;
revoke all on public.lanterns from anon;
grant select, insert on public.lanterns to authenticated;

drop policy if exists "lanterns_select_own" on public.lanterns;
create policy "lanterns_select_own" on public.lanterns
  for select to authenticated
  using (exists (select 1 from public.players p
                 where p.id = player_id and p.profile_id = (select auth.uid())));

drop policy if exists "lanterns_insert_own" on public.lanterns;
create policy "lanterns_insert_own" on public.lanterns
  for insert to authenticated
  with check (exists (select 1 from public.players p
                      where p.id = player_id and p.profile_id = (select auth.uid())));

-- Children who finished Chapter 1 before there were lanterns: the two it
-- earns. (Running this again adds nothing.)
insert into public.lanterns (player_id, stall_id, reason)
select progress.player_id, progress.stall_id, earned.reason
from public.stall_progress progress
cross join (values ('teaching'), ('test')) as earned (reason)
where progress.stall_id = 'fruit-stall-chapter-1'
on conflict do nothing;


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
-- their profile, players, stall_progress, attempts and lanterns rows go with it (each table
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
