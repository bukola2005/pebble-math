import { supabase } from "./supabase";

/*
  Every query on the `players` table lives here.

  None of them filters by account. They don't need to: Row Level Security in
  supabase/schema.sql only ever lets a signed-in account see, add, change or
  delete its own players, whatever the query says. These functions all return
  Supabase's `{ data, error }` and never throw.

  A player holds only what the schema allows: a display name, a coarse age
  band, an optional class level, a character id (null until the child picks
  one on their first play) and whether that first play is done. There is
  nothing here for a child's email, password, date of birth or any contact
  detail, and there never should be.
*/

const COLUMNS = "id, display_name, age_band, class_level, character";

// The list (dashboard and "Who's playing?") deliberately leaves out
// first_play_done, so it keeps working on a database that hasn't had that
// column added yet. Only the play session asks for it.
export const listPlayers = () =>
  supabase.from("players").select(COLUMNS).order("created_at");

export const getPlayer = (id) =>
  supabase
    .from("players")
    .select(`${COLUMNS}, first_play_done`)
    .eq("id", id)
    .maybeSingle();

// profile_id has no default in the schema, so the account's id is sent
// explicitly. The insert policy rejects any id that isn't the caller's own.
// No character: the child picks their own on their first play.
export const addPlayer = ({ profileId, displayName, ageBand, classLevel }) =>
  supabase
    .from("players")
    .insert({
      profile_id: profileId,
      display_name: displayName,
      age_band: ageBand,
      class_level: classLevel || null,
    })
    .select(COLUMNS)
    .single();

/*
  Under Row Level Security an UPDATE or DELETE that matches nothing it is
  allowed to touch succeeds with zero rows and no error, which looks exactly
  like success. Asking for the affected rows back (`.select`) lets us tell
  the two apart, so the screen never claims a change the database didn't make.
*/
async function changeOne(query, failureCode) {
  const { data, error } = await query.select("id");
  if (error) return { error };
  if (data.length === 0) return { error: { code: failureCode } };
  return { error: null };
}

export const deletePlayer = (id) =>
  changeOne(supabase.from("players").delete().eq("id", id), "not_deleted");

export const chooseCharacter = (id, character) =>
  changeOne(supabase.from("players").update({ character }).eq("id", id), "not_saved");

export const finishFirstPlay = (id) =>
  changeOne(
    supabase.from("players").update({ first_play_done: true }).eq("id", id),
    "not_saved"
  );

/** A sentence a parent can act on, for whatever went wrong. */
export function playerErrorMessage(error) {
  switch (error?.code) {
    case "23503":
      // players.profile_id points at profiles.id. If the sign-up trigger
      // never wrote this account's profile row, that reference has no target.
      return "This account’s profile record is missing, so a player can’t be added yet.";
    case "42501":
      return "This account isn’t allowed to do that.";
    case "not_deleted":
      return "That player wasn’t deleted. It may already be gone: refresh the page and check.";
    case "not_saved":
      return "That wasn’t saved. Please try again.";
    default:
      return "Something went wrong. Please check your connection and try again.";
  }
}
