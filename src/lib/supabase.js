// Must stay the first import: it reads the emailed link's details from the
// address bar before the client below clears them.
import "./authRedirect";
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;

// VITE_SUPABASE_PUBLISHABLE_KEY is the name we use. Supabase is retiring the
// "anon" key in its favour, but the old name is still read so a .env.local
// written before the switch keeps working.
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

function connect() {
  if (!url || !key) {
    console.warn(
      "Supabase isn't configured: set VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_PUBLISHABLE_KEY. Accounts are switched off."
    );
    return null;
  }

  try {
    return createClient(url, key);
  } catch (error) {
    // createClient throws on a malformed URL. Treat that like a missing
    // setting rather than letting it take the page down.
    console.error("Supabase settings are invalid. Accounts are switched off.", error);
    return null;
  }
}

/**
 * The one Supabase client for the account pages, or `null` when the
 * settings are missing or unusable.
 *
 * It is `null` rather than an error on purpose: only the account pages need
 * it, so a missing setting must never stop the landing page from loading.
 * The account routes check for `null` (see routes/AuthShell.jsx) before
 * rendering anything that uses it.
 *
 * The publishable key is safe in the browser: what a visitor can read or
 * write is decided by the Row Level Security policies in
 * supabase/schema.sql, not by keeping this key secret.
 */
export const supabase = connect();
