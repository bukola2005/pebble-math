import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import CTAButton from "../components/CTAButton";
import PageLoading from "../components/PageLoading";
import { useAuth } from "../context/AuthContext";
import { authLink } from "../lib/authRedirect";

// What Supabase puts in `type` when a sign-up confirmation link worked.
const CONFIRMATION = ["signup", "email"];

/**
 * Where the link in the sign-up confirmation email lands (emailRedirectTo
 * in context/AuthContext.jsx).
 *
 * Nothing here ever looks like a failure: no error styling, no status
 * codes, nothing from Supabase on screen. A parent who sees one assumes
 * they broke something and stops. Every case is one calm sentence and one
 * button:
 *
 *   good link, signed in   "Your email is confirmed."           Continue
 *   good link, the sign-in
 *     didn't stick here    "Your email is confirmed."           Sign in
 *   used or expired link   "This account is already confirmed." Sign in
 *   no link at all         "You can sign in below."             Sign in
 *
 * A good link signs the parent in, so Continue goes straight to the
 * dashboard: they aren't asked for a password they've only just set.
 *
 * "Sign in" carries the parent's address across when it can be read (from
 * the session, or from the link's own sign-in), in router state rather
 * than the address bar, which ends up in browser history and server logs.
 * The sign-in page fills it in and puts the cursor in the password box.
 * When it can't be read, usually after a used link, the form is empty.
 */
export default function EmailConfirmed() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Once Supabase has read the link, take its details (tokens, or its
  // "invalid or has expired" note) out of the address bar.
  useEffect(() => {
    if (!loading && (location.hash || location.search)) navigate("/confirmed", { replace: true });
  }, [loading, location.hash, location.search, navigate]);

  if (loading) return <PageLoading />;

  const fromLink = CONFIRMATION.includes(authLink.type);

  const page = (title, sub, label, onClick) => (
    <AuthLayout title={title} sub={sub}>
      <div className="pm-auth__form">
        <CTAButton className="pm-auth__submit" onClick={onClick}>
          {label}
        </CTAButton>
      </div>
    </AuthLayout>
  );

  if (fromLink && session) {
    return page("Your email is confirmed.", "Your Pebble Math account is ready.", "Continue", () =>
      navigate("/dashboard", { replace: true })
    );
  }

  const email = session?.user?.email ?? authLink.email;
  const signIn = () => navigate("/signin", { state: email ? { email } : null });

  if (fromLink) return page("Your email is confirmed.", "Sign in to carry on.", "Sign in", signIn);

  if (authLink.errorCode) {
    return page(
      "This account is already confirmed.",
      "Sign in with your email and password. If it asks you to confirm your email first, sign up again with the same email for a new link.",
      "Sign in",
      signIn
    );
  }

  return page("You can sign in below.", undefined, "Sign in", signIn);
}
