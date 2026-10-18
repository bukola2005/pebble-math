import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import CTAButton from "../components/CTAButton";
import PageLoading from "../components/PageLoading";
import { useAuth } from "../context/AuthContext";
import { authLink } from "../lib/authRedirect";

// What Supabase puts in `type` when a sign-up confirmation link worked.
const CONFIRMATION = ["signup", "email"];

const LINK_FAILED = {
  title: "This confirmation link didn’t work.",
  sub: "Confirmation links work once, and only for a limited time. If you’ve confirmed your email already, sign in. If not, sign up again with the same email and we’ll send a new link.",
};

/**
 * Where the link in the sign-up confirmation email lands (emailRedirectTo
 * in context/AuthContext.jsx).
 *
 * Supabase checks the link before sending people here and puts the outcome
 * in the address (lib/authRedirect.js): a sign-in when it worked, an error
 * when the link was too old or had been used. Opening a good link also
 * signs the grown-up in on this device, so "Sign in" goes straight on to
 * the dashboard; anywhere else it asks for the password as usual.
 *
 * However the page is reached, it says what happened and offers the
 * sign-in button. It is never blank.
 */
export default function EmailConfirmed() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const page = (title, sub) => (
    <AuthLayout title={title} sub={sub}>
      <div className="pm-auth__form">
        <CTAButton className="pm-auth__submit" onClick={() => navigate("/signin")}>
          Sign in
        </CTAButton>
      </div>
    </AuthLayout>
  );

  if (authLink.errorCode) return page(LINK_FAILED.title, LINK_FAILED.sub);

  if (!CONFIRMATION.includes(authLink.type)) {
    return page(
      "There’s no confirmation link here.",
      "This page is for the link in the email we send when you sign up. If you’ve confirmed your email already, you can sign in."
    );
  }

  if (loading) return <PageLoading />;

  // Came from a confirmation link, but Supabase couldn't sign anyone in
  // with it.
  if (!session) return page(LINK_FAILED.title, LINK_FAILED.sub);

  return page("Your email is confirmed.", "Your Pebble Math account is ready.");
}
