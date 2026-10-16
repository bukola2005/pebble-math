/**
 * The Fruit Stall's numbers, as agreed with the owner.
 *
 * The site says ages 7 to 10; the bands below are the ones a grown-up can
 * pick on the dashboard (data/players.js).
 */

/** How many oranges the seller asks for, smallest and largest, by age band. */
export const ORDER_RANGE = {
  "under-7": [2, 5],
  "7-8": [3, 10],
  "9-10": [5, 10],
  "11-plus": [5, 10],
};

/** The basket holds ten, so no order is ever bigger. */
export const BASKET_HOLDS = 10;

/**
 * Oranges on the ground beyond the order, so the child has to stop at the
 * right number rather than just moving them all.
 */
export const EXTRA_ORANGES = 3;

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/** A fresh round: what the seller asks for, and the oranges on the ground. */
export function makeRound(ageBand) {
  const [min, max] = ORDER_RANGE[ageBand] ?? ORDER_RANGE["7-8"];
  const target = randomInt(min, Math.min(max, BASKET_HOLDS));
  const seed = randomInt(1, 2 ** 30);
  const oranges = Array.from({ length: target + EXTRA_ORANGES }, (_, i) => `orange-${seed}-${i}`);
  return { target, oranges, seed };
}
