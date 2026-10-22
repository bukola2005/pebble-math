/**
 * The Fruit Stall's rounds, as agreed with the owner.
 *
 * Round 1 is practice: the seller asks for some oranges and the child
 * drags them into an empty basket. How many depends on the age band (the
 * game covers kindergarten to Primary 3; the bands are the ones in
 * data/players.js, and only Under 7 and 7–8 are offered now).
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

/**
 * Chapter 1, in order.
 *
 * Stage A: adding past ten. Each round is a sum like 28 + 6: full crates
 * already on the table (the tens), loose oranges in the basket with its
 * empty spaces outlined, so a child can see how many more it needs
 * without counting, and more loose oranges on the stall. A full basket
 * shuts into one more crate; what is left stays loose.
 *
 * Stage B: taking away, like 32 - 15. Crates and a few loose oranges on
 * the table, an empty basket, and Grandma's order. Each needs more loose
 * oranges than there are, so one crate has to be cracked open (its ten go
 * into the basket); each round has a different shape of order.
 *
 * Stage C: three test rounds, and nothing to help: Grandma's order, the
 * stock on the stall, and an empty counter. Build 33; hand over one crate
 * and five, then say how many that is (15); build 20, which needs no loose
 * oranges at all. More stock than any answer needs, so the child chooses.
 *   want      the number the customer wants
 *   read      the reading round: Grandma says the crates and oranges, and
 *             after handing them over the child puts in the number
 *
 *   crates    full crates on the table when the round starts
 *   inBasket  loose oranges already in the basket
 *   onStall   loose oranges on the stall's table
 *   order     what the customer wants (Stage B)
 */
export const CHAPTER_ONE_ROUNDS = [
  { stage: "A", crates: 2, inBasket: 8, onStall: 6 }, // 28 + 6 = 34
  { stage: "A", crates: 1, inBasket: 7, onStall: 5 }, // 17 + 5 = 22
  { stage: "A", crates: 3, inBasket: 9, onStall: 4 }, // 39 + 4 = 43
  { stage: "B", crates: 3, onStall: 2, order: { crates: 1, loose: 5 } }, // 32 - 15 = 17
  { stage: "B", crates: 4, onStall: 1, order: { crates: 2, loose: 3 } }, // 41 - 23 = 18
  { stage: "B", crates: 2, onStall: 3, order: { crates: 0, loose: 8 } }, // 23 - 8 = 15
  { stage: "C", crates: 4, onStall: 6, want: 33 }, // build 33
  { stage: "C", crates: 3, onStall: 7, want: 15, read: true }, // hand over 1 crate and 5, then 15
  { stage: "C", crates: 3, onStall: 4, want: 20 }, // build 20: no loose ones
];

/** The first Stage B round, where a crate opens only after the child needs one. */
export const FIRST_ORDER_ROUND = CHAPTER_ONE_ROUNDS.findIndex((round) => round.stage === "B");

/** The first Stage C round. */
export const FIRST_TEST_ROUND = CHAPTER_ONE_ROUNDS.findIndex((round) => round.stage === "C");

/** Chapter 1's row in stall_progress, once it is cleared. */
export const CHAPTER_ONE_ID = "fruit-stall-chapter-1";

/** A Chapter 1 round, ready to play: `index` 0 is the first. */
export function setUpChapterRound(index) {
  const seed = randomInt(1, 2 ** 30);
  const ids = (kind, count) => Array.from({ length: count }, (_, i) => `${kind}-${seed}-${i}`);
  const round = CHAPTER_ONE_ROUNDS[index];
  return {
    index,
    number: index + 1,
    chapter: 1,
    stage: round.stage,
    practice: false,
    crateIds: ids("crate", round.crates),
    target: BASKET_HOLDS,
    prefilled: ids("basket", round.inBasket ?? 0),
    oranges: ids("orange", round.onStall),
    order: round.order ?? null,
    want: round.want ?? null,
    read: Boolean(round.read),
    ask: false,
    choices: [],
    outlines: round.stage === "A",
    seed,
  };
}
