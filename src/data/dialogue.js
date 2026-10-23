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
 * "Zizi". The fruit seller is the child's grandmother. In Chapter 1 she
 * goes along the row to ask about the child's mother, so the child minds
 * the stall and serves the customers alone. A line with no known speaker
 * (`narrator`) has no name above it.
 *
 * A line may carry its own `voice` (lib/speech.js), for a way of saying
 * it: "blob-small" is Blob in a small voice.
 */
export const SPEAKERS = {
  zizi: { label: "{name}", voice: "zizi" },
  blob: { label: "Blob", voice: "blob", portrait: "/characters/purple.webp" },
  seller: { label: "Grandma", voice: "seller", portrait: "/stall/seller-portrait.webp" },
  customer: { label: "Customer", voice: "customer" },
};

/**
 * Scene 1, the dim market (docs/story.md). Blob is lost too: not a guide,
 * a friend in the same trouble, who knows one useful thing. He never
 * knows the answer to anything; when he wonders, he wonders out loud.
 */
export const SCENE_1 = [
  { speaker: "zizi", text: "Mommy…" },
  { speaker: "blob", text: "…I'm lost too.", voice: "blob-small" },
  { speaker: "zizi", text: "Who are you?" },
  { speaker: "blob", text: "I'm Blob." },
  { speaker: "blob", text: "But I have friends in this market. They will help us look." },
  { speaker: "zizi", text: "Where is my mommy?" },
  { speaker: "blob", text: "I don't know. The traders see everyone, but they can't leave their stalls." },
  { speaker: "blob", text: "Hmm. What if we mind a stall, so a trader can go and ask?" },
  { speaker: "zizi", text: "Okay. I will try." },
  { speaker: "blob", text: "There's a fruit stall over there. Let's ask!" },
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
  howManyMore: { speaker: "blob", text: "Hmm. How many MORE to fill the basket?" },
  // A wrong answer: never "wrong", and no judgement. Whoever asked (Blob,
  // or the customer, whose order it is) counts again themselves.
  countAgain: "Hmm, let me count these again.",
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
    { show: "Oh. Not every pile makes a ten.", say: "Oh. Not every pile makes a ten." },
  ],

  next: "Next",

  // As the child leaves the map at the end of Chapter 1: Blob's errand
  // (ERRANDS, below), and `endLine` under it when the cards before didn't
  // just say it.
  endForNow: {
    errandLabel: "Something to try at home",
    endLine: "That's the end of the tutorial. More of the market is coming.",
    button: "Who's playing?",
  },
};

/**
 * Chapter 1, the Fruit Stall proper, for a child who has finished the
 * tutorial. Stage A: adding past ten, with full crates on the table.
 * Stage B: customers' orders, taking away, and cracking a crate open when
 * there aren't enough loose oranges.
 */
export const CHAPTER_ONE = {
  // The first thing said, once, as the chapter starts: Grandma asks the
  // child to mind the stall, and goes along the row to ask about their
  // mother. From here the child serves the customers alone.
  intro: [
    { speaker: "seller", text: "{name}, more oranges came in. Can you pack them and mind my stall?" },
    { speaker: "seller", text: "I'll go along the row and ask everyone about your mother." },
  ],
  // After a full basket goes up onto the table as a crate, and after each
  // order: one step at a time, the crates lighting first, then the loose
  // oranges, then both, and Blob asks. He never says the total: the child
  // taps it (three numbers, data/fruitStall.js totalChoices), and only
  // then does he say it after them (`cratesSaid`). `{crates}` is "Three
  // crates", `{loose}` "four", `{sum}` "Thirty-four".
  cratesAsk: [
    { show: "{crates}…", say: "{crates}…" },
    { show: "{crates} and {loose} loose.", say: "and {loose} loose." },
    { show: "{crates} and {loose} loose. How many is that?", say: "How many is that?" },
  ],
  cratesSaid: { speaker: "blob", text: "{sum}!" },
  // Stage B. A customer asks for a number, in digits ("15 oranges,
  // please."), never as crates and loose: what that is in crates and
  // loose is the child's to decide. The order goes on a cloth beside the
  // basket, with nothing drawn on it, and stays up all round as a strip:
  // `orderStrip`. The number is the order.
  order: { speaker: "customer", text: "{want} oranges, please." },
  orderStrip: "{want} oranges",
  // Only once the child has run out of loose oranges and reached for more.
  // Then (and in round 1 of Stage B, only then) a tapped crate opens.
  wall: { speaker: "blob", text: "Hmm. Not enough loose ones. What's inside a crate?" },
  // Said under Blob's errand at the end, when Chapter 1 is being replayed.
  endLine: "That's all at the fruit stall for now. More of the market is coming.",
  // Stage C, three test rounds: a customer's order and an empty counter,
  // and nothing else. No hint, no Blob, no counting aloud. `{want}` is the
  // number ("33"); `{readOrder}` is "One crate and five oranges".
  test: {
    build: { speaker: "customer", text: "{want} oranges, please." },
    read: { speaker: "customer", text: "{readOrder}." },
    // After the right oranges are handed over in the reading round.
    total: { speaker: "customer", text: "How many oranges is that?" },
    done: "Done",
  },
  // The end of Chapter 1: Grandma comes back from asking along the row,
  // with no news yet. She lends the child her lantern, so they can see
  // further into the haze, and the first time one more, for serving the
  // customers alone (data/lanterns.js); after that, one for coming back.
  // Then she points at the next part of the market. Each line in `first`
  // or `again` brings one lantern.
  back: {
    title: "Grandma is back!",
    first: [
      "No news yet. But take my lantern, so you can see further into the haze.",
      "And this one is for serving the customers all by yourself.",
    ],
    again: ["No news yet. Thank you for coming back to help. Take another lantern."],
    point: "Look, over there. More of the market!",
    button: "Next",
  },
  // The first time Chapter 1 is finished, after Grandma is back: what she
  // gives, and the map is next.
  opening: {
    title: "The market is opening up!",
    gift: "Grandma gives you a straw hat and a tally stick.",
    text: "Soon you can visit the rest of the market.",
    button: "Next",
  },
};

/**
 * The market map (components/MarketMap.jsx), at the end of Chapter 1.
 * A place's card says its name and what it teaches (data/places.js), or
 * one of these.
 */
export const MAP_WORDS = {
  label: "The market",
  shutLabel: "A place still in the haze",
  opening: "The haze is lifting off the {place}.",
  shut: {
    title: "The haze is still thick here",
    text: "Blob's friends haven't reached this part of the market yet.",
  },
  notYet: "The haze has lifted here. Nobody is ready for you yet: soon!",
  carryOn: "Carry on here",
  notNow: "Not now",
  allRight: "All right",
};

/** "One crate and five oranges", for Stage C's reading round. */
export function readOrderWords({ crates, loose }) {
  const parts = [];
  if (crates) parts.push(`${NUMBER_WORDS[crates]} ${crates === 1 ? "crate" : "crates"}`);
  if (loose) parts.push(`${NUMBER_WORDS[loose]} ${loose === 1 ? "orange" : "oranges"}`);
  return capitalise(parts.join(" and "));
}

/**
 * Blob's errand at the end of a session: something he is going to try
 * himself, away from the screen, and asks the child to try too, so the
 * idea goes home with them. His own idea, not homework. Plain words,
 * nothing to check. One list per stall; one line is picked at random.
 */
export const ERRANDS = {
  "fruit-stall": [
    "Next time someone buys something, I'm going to see if I can fill a ten. You try it too?",
    "I'm going to count out ten of anything at home, and see what's left over. You try it too?",
    "I'm going to make a pile of seven stones, and see how many more make ten. You try it too?",
    "Next time fruit goes into a bag, I'm going to count to ten and see how many are left. You try it too?",
  ],
};

/**
 * Blob's hint button: each tap gives the next step, never the answer.
 * Blob doesn't know it either: he thinks out loud, and then tries.
 *   1  a question that points at the thinking
 *   2  a stronger nudge, while the basket's empty spaces are outlined
 *   3  the move, Blob trying it slowly, once (and again on later taps)
 */
export const HINTS = [
  "How many does the basket still need?",
  "Hmm. What about those empty spaces?",
  "Let me try one…",
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
