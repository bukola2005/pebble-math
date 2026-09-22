/**
 * The characters a player can choose. Labels are colours, not names —
 * naming them is a product decision, not a code one.
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

export const getCharacter = (id) =>
  CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0];

/** The one that appears on the marketing page. */
export const DEFAULT_CHARACTER = CHARACTERS[0];
