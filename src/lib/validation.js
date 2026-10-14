export const MIN_PASSWORD_LENGTH = 8;

// The database caps full_name at 80 characters (supabase/schema.sql).
export const NAME_MAX_LENGTH = 80;

// A child's display name. Matches the check constraint on players.display_name
// (supabase/schema.sql) and the 24-character limit in the Get Started flow.
export const PLAYER_NAME_MAX_LENGTH = 24;

// Deliberately loose: something@something.something. The only real test of
// an email address is whether the confirmation message arrives.
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
