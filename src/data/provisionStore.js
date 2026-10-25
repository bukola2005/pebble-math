import { shuffled } from "./fruitStall";

/**
 * The Provision Store: Chapter 2, Baba's shop (docs/market-plan.md). It
 * has Chapter 1's shape exactly: Baba asks the child to mind the shop and
 * goes along the row to ask, the same three stages, the same meter, the
 * same lanterns, and it ends on the map.
 *
 * What it teaches is difference, the other half of subtraction: not "give
 * me 15", but "this shelf holds 30, it has 18 on it, how many more fit?".
 * Every shelf in the shop is a row of tens: each shelf of a shelf unit
 * holds ten tins, five at the back and five in front, so a carton of ten
 * fills a shelf exactly.
 *
 * Its rows in stall_progress:
 *   "provision-store"            the child has been here (stepped in from
 *                                the map). From then on round_reached is
 *                                this chapter's, and a visit starts here.
 *   "provision-store-chapter-2"  Chapter 2 finished.
 */

export const SHOP_ID = "provision-store";
export const CHAPTER_TWO_ID = "provision-store-chapter-2";

/** A carton holds ten tins, and so does each shelf. */
export const TINS_PER_CARTON = 10;

/** The shop, the one new background layer (in place of the fruit stall), and what a child handles there. */
export const SHOP_ART = { id: "provision", src: "/art/stall-provision.webp", w: 423, h: 468 };
export const TIN = { src: "/art/prop-tin.webp", w: 157, h: 240 };
export const CARTON = { src: "/art/prop-tin-carton.webp", w: 440, h: 374 };
export const SHELF = { src: "/art/prop-shelf.webp", w: 687, h: 871 };
export const SHOPKEEPER_PORTRAIT = { src: "/art/portrait-shopkeeper.webp", w: 320, h: 320 };

/**
 * Chapter 2's rounds, in order.
 *   kind     "shelf": fill a shelf unit that `holds` tins and has `had`
 *            on it already; "order": a customer wants `want` tins
 *   stock    the delivery on the ground: full cartons, and loose tins
 * Stage A: difference inside ten (one shelf). Stage B: bigger shelves,
 * and cracking a carton comes back (round 3, met with oranges in
 * Chapter 1, never taught again). Stage C: three test rounds.
 */
export const CHAPTER_TWO_ROUNDS = [
  { stage: "A", kind: "shelf", holds: 10, had: 6, stock: { cartons: 0, loose: 6 } }, // 4 more
  { stage: "A", kind: "shelf", holds: 10, had: 3, stock: { cartons: 0, loose: 9 } }, // 7 more
  { stage: "A", kind: "shelf", holds: 10, had: 8, stock: { cartons: 0, loose: 5 } }, // 2 more
  { stage: "B", kind: "shelf", holds: 30, had: 20, stock: { cartons: 2, loose: 4 } }, // 10: whole tens
  { stage: "B", kind: "shelf", holds: 30, had: 24, stock: { cartons: 1, loose: 8 } }, // 6: inside one ten
  { stage: "B", kind: "order", want: 15, stock: { cartons: 3, loose: 2 } }, // not enough loose: crack one
  { stage: "B", kind: "shelf", holds: 40, had: 23, stock: { cartons: 2, loose: 7 } }, // 17: crosses a ten
  { stage: "C", kind: "shelf", holds: 30, had: 18, stock: { cartons: 2, loose: 5 } }, // 12
  { stage: "C", kind: "order", want: 24, stock: { cartons: 3, loose: 1 } }, // crack one
  { stage: "C", kind: "shelf", holds: 40, had: 35, stock: { cartons: 1, loose: 7 } }, // 5
];

/** The first Stage C round. */
export const FIRST_SHOP_TEST = CHAPTER_TWO_ROUNDS.findIndex((round) => round.stage === "C");

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/**
 * A Chapter 2 round, ready to play: `index` 0 is the first.
 *   want     what the child is after: the order, or how many more the
 *            shelf needs (holds - had)
 *   levels   how many shelves the unit has (holds / 10)
 */
export function setUpShopRound(index) {
  const seed = randomInt(1, 2 ** 30);
  const ids = (kind, count) => Array.from({ length: count }, (_, i) => `${kind}-${seed}-${i}`);
  const round = CHAPTER_TWO_ROUNDS[index];
  const shelf = round.kind === "shelf";
  return {
    index,
    number: index + 1,
    stage: round.stage,
    kind: round.kind,
    holds: shelf ? round.holds : null,
    had: shelf ? round.had : 0,
    levels: shelf ? round.holds / TINS_PER_CARTON : 0,
    want: shelf ? round.holds - round.had : round.want,
    cartonIds: ids("carton", round.stock.cartons),
    tinIds: ids("tin", round.stock.loose),
    seed,
  };
}

/**
 * Blob's "How many more did it need?" once a shelf is full: three numbers
 * to tap, the right one and two picked to tell a teacher something.
 * Past ten, as for "How many is that?" (data/fruitStall.js):
 *   reversed        the digits swapped (12 gives 21): a place-value slip
 *   added           the digits added (12 gives 3): a carton not seen as ten
 * Inside ten, where those say nothing, the two ways "how many more" goes
 * wrong:
 *   counted tins    the tins on the part-full shelf, not its gaps (24 on a
 *                   shelf of 30 gives 4)
 *   what was there  how many it had, not how many more (24)
 * and, to make three, the whole shelf (30). Shuffled with the round's
 * seed, so they stay put.
 */
export function moreChoices(holds, had, seed) {
  const right = holds - had;
  const tens = Math.floor(right / 10);
  const ones = right % 10;
  const picked = [right];
  const add = (value) => {
    if (picked.length < 3 && value > 0 && !picked.includes(value)) picked.push(value);
  };
  if (right >= 10) {
    add(ones * 10 + tens);
    add(tens + ones);
  } else add(had % 10);
  add(had);
  add(holds);
  return { right, choices: shuffled(picked, seed) };
}
