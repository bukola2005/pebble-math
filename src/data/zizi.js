/**
 * Zizi, the player character. Every child plays as Zizi; what they choose
 * on the avatar screen is her look (players.character holds the id).
 *
 * The ids are stored in the database, so don't rename them. The SQL in
 * supabase/schema.sql that clears pre-Zizi values lists them too. `label` is
 * what a screen reader says; nothing on screen spells it out.
 *
 * `w` / `h` are the intrinsic pixel sizes, so the browser reserves the box
 * before the image arrives.
 */
export const ZIZI_LOOKS = [
  { id: "zizi-headband", label: "Afro with a headband", src: "/zizi/zizi-headband.webp", w: 328, h: 900 },
  { id: "zizi-cornrows", label: "Cornrows", src: "/zizi/zizi-cornrows.webp", w: 338, h: 900 },
  { id: "zizi-afro", label: "Big afro", src: "/zizi/zizi-afro.webp", w: 336, h: 900 },
  { id: "zizi-puffs", label: "Afro puffs", src: "/zizi/zizi-puffs.webp", w: 433, h: 900 },
  { id: "zizi-twists", label: "Twists", src: "/zizi/zizi-twists.webp", w: 361, h: 900 },
  { id: "zizi-braids", label: "Braids with beads", src: "/zizi/zizi-braids.webp", w: 350, h: 900 },
];

/** The original Zizi: shown until a child has chosen a look. Not a choice itself. */
export const ZIZI_DEFAULT = {
  id: "zizi-default",
  label: "Zizi",
  src: "/zizi/zizi-default.webp",
  w: 344,
  h: 900,
};

/** The chosen look, or the original Zizi if none has been chosen (or the id is unknown). */
export const getZiziLook = (id) => ZIZI_LOOKS.find((look) => look.id === id) ?? ZIZI_DEFAULT;
