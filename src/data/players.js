/**
 * The values a player profile may hold, with the words shown for them.
 *
 * Ages are coarse bands, never a date of birth, and the ids here must
 * match the check constraints on `players` in supabase/schema.sql.
 */
export const AGE_BANDS = [
  { id: "under-7", label: "Under 7" },
  { id: "7-8", label: "7–8" },
  { id: "9-10", label: "9–10" },
  { id: "11-plus", label: "11 and over" },
];

/**
 * The bands a grown-up can pick when adding a child. Pebble Math covers
 * kindergarten to Primary 3, so the older bands aren't offered: there are
 * no games for them yet. They stay above so a child added earlier with one
 * still shows its label.
 */
export const OFFERED_AGE_BANDS = AGE_BANDS.filter((band) => band.id === "under-7" || band.id === "7-8");

/** Said under the age band picker. */
export const AGE_RANGE_NOTE =
  "Pebble Math is for kindergarten to Primary 3. There are no games above that level yet.";

export const CLASS_LEVELS = [
  { id: "kindergarten", label: "Kindergarten" },
  { id: "primary-1", label: "Primary 1" },
  { id: "primary-2", label: "Primary 2" },
  { id: "primary-3", label: "Primary 3" },
  { id: "primary-4", label: "Primary 4" },
  { id: "primary-5", label: "Primary 5" },
  { id: "primary-6", label: "Primary 6" },
];

/**
 * The classes a grown-up can pick: kindergarten to Primary 3, the same
 * range as the game. Primary 4 to 6 stay above so a child added earlier
 * with one still shows its label.
 */
export const OFFERED_CLASS_LEVELS = CLASS_LEVELS.filter((level) =>
  ["kindergarten", "primary-1", "primary-2", "primary-3"].includes(level.id)
);

const labelFor = (list, id) => list.find((item) => item.id === id)?.label ?? null;

export const getAgeBandLabel = (id) => labelFor(AGE_BANDS, id);
export const getClassLevelLabel = (id) => labelFor(CLASS_LEVELS, id);
