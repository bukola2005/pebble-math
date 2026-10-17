/**
 * The Fruit Stall's rounds, as agreed with the owner.
 *
 * Round 1 is practice: the seller asks for some oranges and the child
 * drags them into an empty basket. How many depends on the age band (the
 * site says ages 7 to 10; the bands are the ones in data/players.js).
 *
 * Rounds 2 to 5 teach making ten. The basket holds exactly ten; when it
 * fills, it closes into a crate of ten and the rest stay on the stall.
 * Round 5 plants a pattern and breaks it: six and three is nine, so the
 * basket never fills ("plant a pattern, then break it" in
 * docs/learning-rules.md).
 */

/** How many oranges the seller asks for in round 1, smallest and largest, by age band. */
export const ORDER_RANGE = {
  "under-7": [2, 5],
  "7-8": [3, 10],
  "9-10": [5, 10],
  "11-plus": [5, 10],
};

/** The basket holds exactly ten. */
export const BASKET_HOLDS = 10;

/**
 * In round 1, oranges on the stall beyond the order, so the child has to
 * stop at the right number rather than just moving them all.
 */
export const EXTRA_ORANGES = 3;

/**
 * Rounds 2 to 5, in order.
 *   inBasket  oranges already in the basket when the round starts
 *   onStall   oranges on the stall's table
 *   ask       Blob asks "How many MORE to fill the basket?" first, and
 *             the child taps one of `choices` (shuffled each time)
 *   outlines  the basket's empty spaces are outlined from the start
 */
export const FILL_ROUNDS = [
  { inBasket: 8, onStall: 5, ask: true, choices: [2, 3, 5], outlines: true },
  { inBasket: 7, onStall: 6, ask: true, choices: [3, 4, 6] },
  { inBasket: 9, onStall: 7 },
  { inBasket: 6, onStall: 3 },
];

/** Round 1 plus the fill rounds. */
export const ROUND_COUNT = 1 + FILL_ROUNDS.length;

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const shuffle = (list) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Everything a round needs, ready to play: `index` 0 is round 1.
 *   target     what ends it: the order in round 1, ten after that
 *   prefilled  ids of the oranges already in the basket
 *   oranges    ids of the oranges on the stall
 *   answer     the right answer to "how many more?", if it's asked
 */
export function setUpRound(index, ageBand) {
  const seed = randomInt(1, 2 ** 30);
  const ids = (kind, count) => Array.from({ length: count }, (_, i) => `${kind}-${seed}-${i}`);

  if (index === 0) {
    const [min, max] = ORDER_RANGE[ageBand] ?? ORDER_RANGE["7-8"];
    const target = randomInt(min, Math.min(max, BASKET_HOLDS));
    return {
      index,
      number: 1,
      practice: true,
      target,
      prefilled: [],
      oranges: ids("orange", target + EXTRA_ORANGES),
      seed,
    };
  }

  const round = FILL_ROUNDS[index - 1];
  return {
    index,
    number: index + 1,
    practice: false,
    target: BASKET_HOLDS,
    prefilled: ids("basket", round.inBasket),
    oranges: ids("orange", round.onStall),
    ask: Boolean(round.ask),
    choices: round.ask ? shuffle(round.choices) : [],
    answer: BASKET_HOLDS - round.inBasket,
    outlines: Boolean(round.outlines),
    seed,
  };
}
