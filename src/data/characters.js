/**
 * The Pebble monsters. They are NOT player characters: in the game every
 * child plays as Zizi (data/zizi.js), in the look they choose.
 *
 *   - purple is Blob, lost in the market like the child (docs/story.md).
 *     Never pickable, by anyone.
 *   - the others are what a grown-up picks on the dashboard so they can
 *     tell their children apart (players.monster). In the game, six of
 *     them are Blob's friends, who join the search one place at a time
 *     (data/friends.js); lavender is not one of them.
 *
 * Labels are colours; Blob is the only one with a name so far. Who may
 * pick what is in data/monsters.js, kept apart from this file so the
 * landing page, which uses this one, doesn't carry it.
 *
 * `crop` is how much of the drawing exists: "full" characters stand on
 * their feet, "bust" ones are cut at the waist in the source art and
 * fade out at the bottom instead of ending in a hard line.
 *
 * `w` / `h` are the intrinsic pixel sizes. They go straight onto the
 * <img> so the browser can reserve the right box before the file
 * arrives — that is what keeps layout shift at zero.
 */
export const CHARACTERS = [
  { id: "purple", label: "Purple", src: "/characters/purple.webp", crop: "full", w: 736, h: 900 },
  { id: "green", label: "Green", src: "/characters/green.webp", crop: "full", w: 381, h: 560 },
  { id: "blue", label: "Blue", src: "/characters/blue.webp", crop: "full", w: 325, h: 560 },
  { id: "orange", label: "Orange", src: "/characters/orange.webp", crop: "full", w: 428, h: 560 },
  { id: "pink", label: "Pink", src: "/characters/pink.webp", crop: "bust", w: 560, h: 531 },
  { id: "yellow", label: "Yellow", src: "/characters/yellow.webp", crop: "bust", w: 537, h: 560 },
  { id: "teal", label: "Teal", src: "/characters/teal.webp", crop: "bust", w: 560, h: 526 },
  { id: "lavender", label: "Lavender", src: "/characters/lavender.webp", crop: "bust", w: 560, h: 541 },
];

/** The one that appears on the marketing page. */
export const DEFAULT_CHARACTER = CHARACTERS[0];
