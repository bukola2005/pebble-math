import { supabase } from "./supabase";

/*
  stall_progress: one row per market stall a child has cleared. Row Level
  Security (supabase/schema.sql) lets an account read and add rows only
  for its own players; there is no update or delete, because a cleared
  stall stays cleared.
*/

/** The ids of the stalls this player has cleared, e.g. ["fruit-stall"]. */
export async function listClearedStalls(playerId) {
  const { data, error } = await supabase.from("stall_progress").select("stall_id").eq("player_id", playerId);
  if (error) return { data: [], error };
  return { data: data.map((row) => row.stall_id), error: null };
}

/**
 * Records that this player has cleared a stall. Clearing it again is
 * fine: the row is already there, which is all that's wanted.
 */
export async function clearStall(playerId, stallId) {
  const { error } = await supabase.from("stall_progress").insert({ player_id: playerId, stall_id: stallId });
  if (error?.code === "23505") return { error: null };
  return { error };
}

/**
 * Every player's cleared stalls at once, as { playerId: ["fruit-stall", …] },
 * for the cards that show what each child has earned. Row Level Security
 * returns only this account's players.
 */
export async function listClearedByPlayer() {
  const { data, error } = await supabase.from("stall_progress").select("player_id,stall_id");
  if (error) return { data: {}, error };
  const byPlayer = {};
  for (const row of data) (byPlayer[row.player_id] ??= []).push(row.stall_id);
  return { data: byPlayer, error: null };
}
