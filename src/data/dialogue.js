/**
 * Every line the game says, in one place. Edit the words freely; no code
 * needs to change.
 *
 * A line is `{ speaker, text }`:
 *   speaker  "zizi", "blob" or "seller" (see SPEAKERS below)
 *   text     one or two short sentences. Keep them short: the box is
 *            sized for two lines a child can read at arm's length.
 *
 * In any text, `{name}` becomes the child's game name, `{n}` the number of
 * oranges the seller asks for, and `{left}` / `{total}` the number words
 * at the end of a round (see NUMBER_WORDS).
 *
 * Every line is also read aloud (lib/speech.js), a placeholder until real
 * recordings exist.
 */

/**
 * Who can speak. The child's Zizi is labelled with their game name, never
 * "Zizi". The fruit seller has no picture yet, so an orange stands in.
 */
export const SPEAKERS = {
  zizi: { label: "{name}", voice: "zizi" },
  blob: { label: "Blob", voice: "blob", portrait: "/characters/purple.webp" },
  seller: { label: "Fruit seller", voice: "seller", portrait: "/stall/orange.webp", portraitFit: "contain" },
};

/** Scene 1, the dim market, as written in the handoff. Blob is the friend. */
export const SCENE_1 = [
  { speaker: "zizi", text: "Mommy..." },
  { speaker: "blob", text: "Psst! Over here. You are not alone." },
  { speaker: "zizi", text: "Who are you?" },
  { speaker: "blob", text: "I'm your friend! I saw what happened." },
  { speaker: "blob", text: "The haze mixed up the whole market and took your mom to the tower." },
  { speaker: "zizi", text: "Can we get her back?" },
  { speaker: "blob", text: "Yes! Count and fix things right, and the haze goes away." },
  { speaker: "blob", text: "Every fix opens a lock on her chain. Open them all, and she is free!" },
  { speaker: "zizi", text: "Okay. I will try." },
  { speaker: "blob", text: "I'll help you. Let's start at the fruit stall!" },
];

/** The button on Scene 1's last line. */
export const SCENE_1_DONE = "Let's go";

/** The one card before the tutorial: the first thing the child is given. */
export const BASKET_AWARD = {
  title: "You got a basket!",
  button: "Thank you!",
};

/** The tutorial, one beat per thing on screen. Blob says each one. */
export const TUTORIAL = {
  stall: "This is the fruit stall.",
  orange: "These are oranges. Tap one to count it.",
  basket: "This is your basket. It holds ten.",
  drag: "Drag an orange into the basket. Try it.",
};

/** The Fruit Stall. */
export const FRUIT_STALL = {
  // The small label on screen through the tutorial and round 1.
  practice: "Practice",

  // Round 1, practice.
  ask: { speaker: "seller", text: "Ah, {name}! My oranges got all mixed up. Can you put {n} in the basket?" },
  // Stays on screen while the child works, so they needn't remember it.
  // Only round 1 shows the oranges as pictures beside it.
  goal: "Put {n} in the basket",
  practiceWon: { speaker: "blob", text: "You did it!" },

  // Rounds 2 to 5: fill the basket to ten.
  fillGoal: "Fill the basket",
  howManyMore: { speaker: "blob", text: "How many MORE to fill the basket?" },
  // A wrong number. Never "wrong".
  countAgain: "Count again…",
  // A full basket, as a crate of ten, and what is left on the stall.
  tenAnd: { speaker: "blob", text: "Ten and {left}. {total}." },
  // Round 5: the basket never fills. Blob doesn't explain.
  whatHappened: { speaker: "blob", text: "Hmm. What happened there?" },

  next: "Next",
  again: "Play again",

  // For when a whole stall is cleared and its lock opens (not built yet).
  lockOpen: { speaker: "blob", text: "You did it! Look, the first lock is open!" },
};

/**
 * Blob's hint button: each tap gives the next step, never the answer.
 *   1  a question that points at the thinking
 *   2  a stronger nudge, while the basket's empty spaces are outlined
 *   3  the move, shown slowly, once (and again on later taps)
 */
export const HINTS = [
  "How many does the basket still need?",
  "Look at the empty spaces.",
  "Watch.",
];

/** Number words for the end of a round: "Ten and three. Thirteen." */
export const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty",
];

/** "thirteen" → "Thirteen", for the start of a sentence. */
export const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/** Fills in `{name}` and `{n}`; anything it has no value for stays as it is. */
export const fillLine = (text, values) =>
  text.replace(/\{(\w+)\}/g, (match, key) => (values[key] == null ? match : String(values[key])));
