import { supabase } from "./supabase";

/*
  attempts: every answer a child gives in a test round (Stage C), right or
  wrong, and if wrong, which step broke: "crates", "loose" or "total".
  "Gets the crates right, gets the loose ones wrong" is what a teacher can
  use; nothing shows it yet. Row Level Security (supabase/schema.sql) lets
  an account add and read rows only for its own players.
*/

/**
 * Records one answer. Returns Supabase's `{ error }`; the game carries on
 * whatever happens.
 *   asked       the number the order was for (33)
 *   crates      crates handed over
 *   loose       loose oranges handed over
 *   total       the number put in, in the reading round (else null)
 *   failedStep  "crates", "loose" or "total"; null when it was right
 */
export async function recordAttempt({ playerId, stallId, stage, round, asked, crates, loose, total = null, failedStep = null }) {
  const { error } = await supabase.from("attempts").insert({
    player_id: playerId,
    stall_id: stallId,
    stage,
    round,
    asked,
    crates,
    loose,
    total,
    failed_step: failedStep,
  });
  return { error };
}
