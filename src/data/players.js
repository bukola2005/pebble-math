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

export const CLASS_LEVELS = [
  { id: "primary-1", label: "Primary 1" },
  { id: "primary-2", label: "Primary 2" },
  { id: "primary-3", label: "Primary 3" },
  { id: "primary-4", label: "Primary 4" },
  { id: "primary-5", label: "Primary 5" },
  { id: "primary-6", label: "Primary 6" },
];

const labelFor = (list, id) => list.find((item) => item.id === id)?.label ?? null;

export const getAgeBandLabel = (id) => labelFor(AGE_BANDS, id);
export const getClassLevelLabel = (id) => labelFor(CLASS_LEVELS, id);
