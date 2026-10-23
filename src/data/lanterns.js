/*
  Lanterns (docs/story.md): earned by helping, spent to see further into
  the haze and open the next place.

    earned  1 for finishing a place's teaching chapter (at the Fruit
              Stall: Chapter 1, Stages A and B)
            1 for finishing its test rounds (Stage C)
            1 more every time the child comes back and does the test
              rounds again. Only for coming back: never for being fast,
              or right first time.
    spent   2 open the next place on the main path; extras will open
              optional places off the main road. Neither is built yet,
              so for now none are spent.

  A child is never blocked: finishing a chapter once earns the two needed
  to go on. Each one earned is a row in `lanterns` (lib/lanterns.js).
*/

/** How many lanterns open the next place on the main path. */
export const LANTERNS_TO_OPEN = 2;

/** One lamp, lit and unlit: the same picture, so they line up. */
export const LANTERN = {
  lit: { src: "/ui/lantern-lit.webp", w: 121, h: 240 },
  unlit: { src: "/ui/lantern-unlit.webp", w: 121, h: 240 },
};

/** For the profile: the lanterns a child has (lit), and the ones still needed for the next place (dark). */
export const lanternsShown = (have) => ({ lit: have, dark: Math.max(0, LANTERNS_TO_OPEN - have) });
