import { supabase } from "./supabase";

/*
  lanterns: one row per lantern a child has earned, where and why
  (data/lanterns.js has the rules). Row Level Security
  (supabase/schema.sql) lets an account read and add rows only for its own
  players; there is no update or delete. The teaching and test lanterns
  come once per place (a unique index); a replay one every time.
*/

/** How many lanterns this player has earned. */
export async function countLanterns(playerId) {
  const { data, error } = await supabase.from("lanterns").select("reason").eq("player_id", playerId);
  if (error) return { data: null, error };
  return { data: data.length, error: null };
}

/**
 * Records a lantern earned at `stallId`, for `reason`: "teaching", "test"
 * or "replay". `earned` says whether a lantern was added: the teaching
 * one comes only once, and a test one already earned makes this a replay.
 */
export async function earnLantern(playerId, stallId, reason) {
  const add = (why) => supabase.from("lanterns").insert({ player_id: playerId, stall_id: stallId, reason: why });
  let { error } = await add(reason);
  if (error?.code === "23505" && reason === "test") ({ error } = await add("replay"));
  if (error?.code === "23505") return { earned: false, error: null };
  return { earned: !error, error };
}
