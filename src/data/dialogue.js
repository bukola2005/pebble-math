/**
 * Every line the game says, in one place. Edit the words freely; no code
 * needs to change.
 *
 * A line is `{ speaker, text }`:
 *   speaker  "zizi", "blob" or "seller" (see SPEAKERS below)
 *   text     one or two short sentences. Keep them short: the box is
 *            sized for two lines a child can read at arm's length.
 *
 * In any text, `{name}` becomes the child's game name and `{n}` the number
 * of oranges the seller asks for.
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

/** Round one at the Fruit Stall. */
export const FRUIT_STALL = {
  ask: { speaker: "seller", text: "Ah, {name}! My oranges got all mixed up. Can you put {n} in the basket?" },
  // Stays on screen while the child works, so they needn't remember it.
  goal: "Put {n} in the basket",
  won: { speaker: "blob", text: "You did it! Look, the first lock is open!" },
  again: "Play again",
};

/** Fills in `{name}` and `{n}`; anything it has no value for stays as it is. */
export const fillLine = (text, values) =>
  text.replace(/\{(\w+)\}/g, (match, key) => (values[key] == null ? match : String(values[key])));
