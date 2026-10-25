import { supabase } from "./supabase";

/*
  attempts: every answer a child gives after the tutorial, right or wrong,
  and if wrong, which step broke: "crates", "loose" or "total"; and
  whether they had asked for the hint first. "Solved it, asked for help"
  is what a teacher can use; nothing shows it yet. Row Level Security
  (supabase/schema.sql) lets an account add and read rows only for its
  own players.

  `stage`, in Chapter 1:
    "A-ask"  Blob's "How many is that?" in Stage A
    "B"      Done on a Stage B order
    "B-ask"  Blob's "How many is that?" in Stage B
    "C"      a test round
  The same in Chapter 2 (the Provision Store), where "A-ask" and a shelf
  round's "B-ask" are Blob's "How many more did it need?", and `holds`
  says how big the shelf was: `asked` is how many more it needed, so it
  had `holds - asked`.
*/

/**
 * Records one answer. Returns Supabase's `{ error }`; the game carries on
 * whatever happens.
 *   asked       the number the order was for (33)
 *   crates      crates handed over
 *   loose       loose oranges handed over
 *   total       the number the child gave (tapped, put in, or handed
 *               over on a Stage B cloth), or null
 *   failedStep  "crates", "loose" or "total"; null when it was right
 *   usedHint    whether they tapped the hint in this round before answering
 *   holds       the Provision Store: the shelf's size, in a shelf round.
 *               Sent only when there is one.
 */
export async function recordAttempt({
  playerId,
  stallId,
  stage,
  round,
  asked,
  crates,
  loose,
  total = null,
  failedStep = null,
  usedHint = false,
  holds = null,
}) {
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
    used_hint: usedHint,
    ...(holds != null ? { holds } : {}),
  });
  return { error };
}
