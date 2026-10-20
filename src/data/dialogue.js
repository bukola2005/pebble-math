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
 * oranges the seller asks for, and `{left}` / `{total}` / `{count}` /
 * `{short}` the number words at the end of a round (see NUMBER_WORDS).
 *
 * Every line is also read aloud (lib/speech.js), a placeholder until real
 * recordings exist.
 */

/**
 * Who can speak. The child's Zizi is labelled with their game name, never
 * "Zizi".
 */
export const SPEAKERS = {
  zizi: { label: "{name}", voice: "zizi" },
  blob: { label: "Blob", voice: "blob", portrait: "/characters/purple.webp" },
  seller: { label: "Fruit seller", voice: "seller", portrait: "/stall/seller-portrait.webp" },
};

/** Scene 1, the dim market, as written in the handoff. Blob is the friend. */
export const SCENE_1 = [
  { speaker: "zizi", text: "Mommy..." },
  { speaker: "blob", text: "Psst! Over here. You are not alone." },
  { speaker: "zizi", text: "Who are you?" },
  { speaker: "blob", text: "I'm Blob! I'm here to help you." },
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
  // A full basket, as a crate of ten, and what is left over, on a cloth
  // beside it. Said one step at a time, and each step lights up what it
  // names: the crate, then the leftovers, then both. `show` is what the
  // box says by then; `say` is what is read aloud at that step.
  tenAnd: [
    { show: "Ten…", say: "Ten…" },
    { show: "Ten… and {left}.", say: "and {left}." },
    { show: "Ten and {left}. {total}.", say: "{total}." },
  ],
  // Round 5: the basket never fills. Once every orange is in, Blob says
  // what happened, one line at a time (the second lights the empty space),
  // so the child leaves with a sentence, not a shrug.
  shortOfTen: [
    { show: "Hmm. The basket didn't fill this time.", say: "Hmm. The basket didn't fill this time." },
    { show: "{count}. {short} short of ten.", say: "{count}. {short} short of ten." },
    { show: "Not every pile makes a ten. That's fine.", say: "Not every pile makes a ten. That's fine." },
  ],

  next: "Next",

  // The stall is cleared (after round 5, the first time): a lock on Mum's
  // chain opens.
  lockOpen: { speaker: "blob", text: "You did it! Look, the first lock is open!" },

  // The card after it, and the one a returning child sees first: how many
  // of Mum's locks are open, and how many are still closed. Right after the
  // lock opens it also says the tutorial is finished.
  locks: {
    open: ["No locks are open yet.", "One lock is open!", "{n} locks are open!"],
    closed: ["Every lock is open!", "One more to open.", "{n} more to open."],
    finished: "You've finished the tutorial. More of the market is coming.",
    button: "Next",
  },

  // The end of a session, after round 5. Blob's errand (ERRANDS, below)
  // comes first. `endLine` is said under it when the locks card didn't
  // just say it (a child replaying the tutorial).
  endForNow: {
    errandLabel: "Something to try at home",
    endLine: "That's the end of the tutorial. More of the market is coming.",
    button: "Who's playing?",
  },
};

/**
 * Chapter 1, the Fruit Stall proper, for a child who has finished the
 * tutorial. Stage A: adding past ten, with full crates on the table.
 */
export const CHAPTER_ONE = {
  // The first thing said, once, as the chapter starts.
  intro: { speaker: "seller", text: "{name}! More oranges came in. Can you pack them for me?" },
  // After a full basket goes up onto the table as a crate. Like "Ten and
  // three": one step at a time, the crates lighting first, then the loose
  // oranges, then both, and only then the number. `{crates}` is "Three
  // crates", `{loose}` "four", `{sum}` "Thirty-four".
  cratesAnd: [
    { show: "{crates}…", say: "{crates}…" },
    { show: "{crates} and {loose} loose.", say: "and {loose} loose." },
    { show: "{crates} and {loose} loose. {sum}.", say: "{sum}." },
  ],
  // Said under Blob's errand at the end.
  endLine: "That's all at the fruit stall for now. More of the market is coming.",
};

/**
 * Blob's errand at the end of a session: one small thing to try away from
 * the screen, so the idea goes home with the child. Plain words, nothing
 * to check. One list per stall; one line is picked at random.
 */
export const ERRANDS = {
  "fruit-stall": [
    "Next time someone buys something, see if you can fill a ten.",
    "Count out ten of anything at home. What's left over?",
    "Make a pile of ten stones or bottle tops. How many more does a pile of seven need?",
    "Next time fruit goes into a bag, count to ten. How many are left?",
  ],
};

/** "One lock is open!" / "Four more to open." for any number of locks. */
export function lockWords(open, total) {
  const pick = (list, count) => list[Math.min(count, 2)].replace("{n}", capitalise(NUMBER_WORDS[count] ?? String(count)));
  return { open: pick(FRUIT_STALL.locks.open, open), closed: pick(FRUIT_STALL.locks.closed, total - open) };
}

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

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/**
 * Any number up to 99 in words: 34 → "thirty-four". The hyphen is a
 * non-breaking one, so a line never ends on "thirty-"; lib/speech.js reads
 * it as an ordinary hyphen.
 */
export function numberName(n) {
  if (n <= 20) return NUMBER_WORDS[n];
  const ones = n % 10;
  return ones ? `${TENS[Math.floor(n / 10)]}\u2011${NUMBER_WORDS[ones]}` : TENS[n / 10];
}

/** "thirteen" → "Thirteen", for the start of a sentence. */
export const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/** Fills in `{name}` and `{n}`; anything it has no value for stays as it is. */
export const fillLine = (text, values) =>
  text.replace(/\{(\w+)\}/g, (match, key) => (values[key] == null ? match : String(values[key])));
