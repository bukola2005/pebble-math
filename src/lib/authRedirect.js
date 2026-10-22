/*
  What the address bar said when the page loaded, read before supabase-js
  sees it.

  Supabase sends people back from an emailed link with the details in the
  URL: `#access_token=…&type=recovery` when a password-reset link worked,
  `…&type=signup` when a sign-up confirmation link did, and
  `#error=…&error_code=otp_expired` when a link had expired or been used.
  supabase-js reads those, signs the person in, and then clears the address
  bar. It also fires a PASSWORD_RECOVERY event, but from a timer, so a page
  that starts listening a moment late can miss it. Reading the URL here,
  once, is the dependable way for the reset page and /confirmed to know
  how they were opened.

  lib/supabase.js imports this module first, so it always runs before the
  client starts.
*/
const read = () => {
  if (typeof window === "undefined") return new URLSearchParams();
  const params = new URLSearchParams(window.location.search);
  new URLSearchParams(window.location.hash.slice(1)).forEach((value, key) =>
    params.set(key, value)
  );
  return params;
};

const params = read();

// The address inside a link's sign-in (the access token's "email" claim).
// Only decoded, never checked: it is used to fill in the sign-in form, not
// to sign anyone in. Kept in memory, never stored.
function emailIn(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
    const email = JSON.parse(new TextDecoder().decode(bytes)).email;
    return typeof email === "string" && email ? email : null;
  } catch {
    return null;
  }
}

export const authLink = {
  // "recovery" for a password-reset link, "signup" for a confirmation link,
  // null when the page wasn't opened from an emailed link.
  type: params.get("type"),
  // e.g. "otp_expired" when the link was too old or already used.
  errorCode: params.get("error_code") ?? params.get("error"),
  // The parent's address, when the link carried a sign-in. /confirmed
  // passes it to the sign-in form if this device couldn't keep the sign-in.
  email: params.get("access_token") ? emailIn(params.get("access_token")) : null,
};

/**
 * A reset link works once. After the new password is saved, forget that the
 * page came from one, so moving around the site and back to /reset-password
 * doesn't offer the form again.
 */
export function markResetLinkUsed() {
  authLink.type = null;
}
