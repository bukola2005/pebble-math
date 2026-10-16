import { CHARACTERS } from "./characters";

/** Blob, the guide: the purple monster. Never pickable, by anyone. */
export const GUIDE = { name: "Blob", character: CHARACTERS[0] };

/**
 * What a grown-up can pick for a child on the dashboard: everyone but Blob.
 * The check on players.monster in supabase/schema.sql lists the same ids.
 */
export const PARENT_MONSTERS = CHARACTERS.filter((monster) => monster.id !== GUIDE.character.id);
