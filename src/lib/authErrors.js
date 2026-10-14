/**
 * Turns a Supabase auth error into a sentence a parent can act on.
 *
 * We match on `error.code` (stable) rather than `error.message` (reworded
 * between versions), and never show the raw message. Note that a wrong
 * password and an unknown email both come back as `invalid_credentials`,
 * so the sign-in page can't be used to find out who has an account.
 */
export function authErrorMessage(error) {
  // The browser couldn't reach Supabase (offline, blocked, bad URL), or the
  // server answered with a 5xx. Either way, trying again is the right advice.
  if (error?.name === "AuthRetryableFetchError") {
    return "We couldn’t reach the server. Check your connection, or try again in a moment.";
  }

  switch (error?.code) {
    case "invalid_credentials":
      return "That email and password don’t match. Check them and try again.";
    case "email_not_confirmed":
      return "Please confirm your email first. Open the link we sent you, then sign in.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try signing in instead.";
    case "weak_password":
      return "That password isn’t strong enough. Try a longer one.";
    case "email_address_invalid":
      return "That email address doesn’t look right.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "signup_disabled":
      return "Sign-ups aren’t available right now.";
    default:
      return "Something went wrong. Please try again.";
  }
}
