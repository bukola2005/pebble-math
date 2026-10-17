/*
  How each round at a stall went, kept in memory for this visit only.
  Nothing here is saved yet.

  Each entry is shaped like the row a future table would hold, so saving
  it later is one insert per entry (with RLS through the player, like
  stall_progress):

    player_id      the player (uuid)
    stall_id       "fruit-stall"
    round          1 to 5
    hints_used     taps on Blob's hint button that round
    wrong_answers  wrong taps on "how many more?" (null if not asked)
    played_at      when the round ended (ISO time)

  It never records anything that would identify a child.
*/

const entries = [];

/** Notes one finished round. */
export function recordRound({ playerId, stallId, round, hintsUsed, wrongAnswers = null }) {
  entries.push({
    player_id: playerId,
    stall_id: stallId,
    round,
    hints_used: hintsUsed,
    wrong_answers: wrongAnswers,
    played_at: new Date().toISOString(),
  });
}

/** Everything recorded so far this visit, oldest first. */
export const recordedRounds = () => entries.map((entry) => ({ ...entry }));

// While developing, the record can be read from the console.
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.pmRecordedRounds = recordedRounds;
}
