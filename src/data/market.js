/**
 * The market's artwork: the Fruit Stall's six background layers, and the
 * things a child handles there. `w` / `h` are the intrinsic pixel sizes.
 *
 * Where each layer sits is in components/StallBackdrop.css, in percentages
 * of a 1920×1080 scene. A new picture dropped in at the same path just
 * works; one with a different shape needs its size updated here.
 */

/** Back to front. The stall is its own layer: it's what the child works at. */
export const MARKET_LAYERS = [
  { id: "sky", src: "/stall/sky.webp", w: 1600, h: 893 },
  { id: "far", src: "/stall/far.webp", w: 1414, h: 124 },
  { id: "palms", src: "/stall/palms.webp", w: 849, h: 480 },
  { id: "ground", src: "/stall/ground.webp", w: 1920, h: 486 },
  { id: "stall", src: "/stall/fruit-stall.webp", w: 695, h: 639 },
  { id: "near", src: "/stall/near.webp", w: 1414, h: 662 },
];

export const BASKET = { src: "/stall/basket.webp", w: 480, h: 433 };
export const ORANGE = { src: "/stall/orange.webp", w: 168, h: 182 };
export const CRATE = { src: "/stall/crate.webp", w: 440, h: 328 };

/** Leaf sprigs cut from the near layer, for the dialogue box's corners. */
export const DIALOGUE_LEAVES = {
  fan: { src: "/ui/leaves-fan.webp", w: 240, h: 248 },
  flowers: { src: "/ui/leaves-flowers.webp", w: 260, h: 224 },
};

/** Everything a market screen draws, for the loading screen to fetch. */
export const MARKET_IMAGES = [
  ...MARKET_LAYERS.map((layer) => layer.src),
  DIALOGUE_LEAVES.fan.src,
  DIALOGUE_LEAVES.flowers.src,
  "/characters/purple.webp",
];
