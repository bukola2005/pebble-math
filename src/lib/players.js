import { supabase } from "./supabase";

/*
  Every query on the `players` table lives here.

  None of them filters by account. They don't need to: Row Level Security in
  supabase/schema.sql only ever lets a signed-in account see, add, change or
  delete its own players, whatever the query says. These functions all return
  Supabase's `{ data, error }` and never throw.

  A player holds only what the schema allows: a display name, a coarse age
  band, an optional class level and a character id. There is nothing here
  for a child's email, password, date of birth or any contact detail, and
  there never should be.
*/

const COLUMNS = "id, display_name, age_band, class_level, character";

export const listPlayers = () =>
  supabase.from("players").select(COLUMNS).order("created_at");

// profile_id has no default in the schema, so the account's id is sent
// explicitly. The insert policy rejects any id that isn't the caller's own.
export const addPlayer = ({ profileId, displayName, ageBand, classLevel, character }) =>
  supabase
    .from("players")
    .insert({
      profile_id: profileId,
      display_name: displayName,
      age_band: ageBand,
      class_level: classLevel || null,
      character,
    })
    .select(COLUMNS)
    .single();

/**
 * Deletes one player and says so only if a row really went.
 *
 * Under Row Level Security a DELETE that matches nothing it is allowed to
 * touch succeeds with zero rows and no error, which looks exactly like a
 * successful delete. Asking for the deleted rows back (`.select`) lets us
 * tell the two apart, so the screen never shows a child as removed when the
 * record is still in the database.
 */
export async function deletePlayer(id) {
  const { data, error } = await supabase
    .from("players")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { error };
  if (data.length === 0) return { error: { code: "not_deleted" } };
  return { error: null };
}

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
    default:
      return "Something went wrong. Please check your connection and try again.";
  }
}
