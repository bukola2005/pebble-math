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
