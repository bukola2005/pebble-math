import { supabase } from "./supabase";

/*
  Every query on the `players` table lives here.

  None of them filters by account. They don't need to: Row Level Security in
  supabase/schema.sql only ever lets a signed-in account see, add, change or
  delete its own players, whatever the query says. These functions all return
  Supabase's `{ data, error }` and never throw.

  A player holds only what the schema allows:
    display_name     the nickname the grown-up gave them
    age_band         a coarse band, never a date of birth
    class_level      optional
    monster          picked by the grown-up so they can tell children apart
    character        the Zizi look the child picked (null until they have)
    game_name        the in-game name the child built from two word lists
    first_play_done  whether they have seen the opening film
    scene1_done      whether they have played Scene 1, and only that
    tutorial_round   where they are in the tutorial, so they come back to
                     it: 0, its opening (the basket, and Blob's beats);
                     then the round they are on, 1 to 5
    tutorial_done    whether they have finished the tutorial: the one
                     thing that says so
    round_reached    the round they are on in Chapter 1, the first time
                     through, so they come back to it (0: its start)
    group_drag_known whether they know several can be carried at once:
                     Blob has found it out in front of them, or they
                     have done it (lib/carryTogether.js)
  There is nothing here for a child's email, password, date of birth or any
  contact detail, and there never should be.
*/

// What the dashboard and "Who's playing?" need.
const COLUMNS = "id, display_name, age_band, class_level, monster, character";

export const listPlayers = () =>
  supabase.from("players").select(COLUMNS).order("created_at");

// The play session also needs to know how far the child has got.
export const getPlayer = (id) =>
  supabase
    .from("players")
    .select(`${COLUMNS}, game_name, first_play_done, scene1_done`)
    .eq("id", id)
    .maybeSingle();

// profile_id has no default in the schema, so the account's id is sent
// explicitly. The insert policy rejects any id that isn't the caller's own.
// No Zizi look and no game name: the child chooses those when they play.
export const addPlayer = ({ profileId, displayName, ageBand, classLevel, monster }) =>
  supabase
    .from("players")
    .insert({
      profile_id: profileId,
      display_name: displayName,
      age_band: ageBand,
      class_level: classLevel || null,
      monster,
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

// The column is called `character`; it holds a Zizi look id (data/zizi.js).
export const chooseCharacter = (id, character) =>
  changeOne(supabase.from("players").update({ character }).eq("id", id), "not_saved");

export const chooseGameName = (id, gameName) =>
  changeOne(
    supabase.from("players").update({ game_name: gameName }).eq("id", id),
    "not_saved"
  );

export const finishScene1 = (id) =>
  changeOne(supabase.from("players").update({ scene1_done: true }).eq("id", id), "not_saved");

// Read on their own, so that if they can't be (the columns not added
// yet), the game still starts (routes/PlaySessionShell.jsx says how).
export const getTutorialProgress = (id) =>
  supabase.from("players").select("tutorial_round, tutorial_done").eq("id", id).maybeSingle();

export const saveTutorialRound = (id, round) =>
  changeOne(supabase.from("players").update({ tutorial_round: round }).eq("id", id), "not_saved");

export const finishTutorial = (id) =>
  changeOne(supabase.from("players").update({ tutorial_done: true }).eq("id", id), "not_saved");

// Read on its own, so that if it can't be (the column not added yet), the
// game still starts: at the beginning of the chapter.
export const getRoundReached = (id) =>
  supabase.from("players").select("round_reached").eq("id", id).maybeSingle();

export const saveRoundReached = (id, round) =>
  changeOne(supabase.from("players").update({ round_reached: round }).eq("id", id), "not_saved");

// Read on its own too: if it can't be (the column not added yet), the
// game still starts, and Blob never shows carrying several at once.
export const getGroupDragKnown = (id) =>
  supabase.from("players").select("group_drag_known").eq("id", id).maybeSingle();

export const saveGroupDragKnown = (id) =>
  changeOne(supabase.from("players").update({ group_drag_known: true }).eq("id", id), "not_saved");

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
