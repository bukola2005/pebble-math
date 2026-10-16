import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";
import CTAButton from "../components/CTAButton";
import { useAuth } from "../context/AuthContext";
import { authErrorMessage } from "../lib/authErrors";
import { isValidEmail } from "../lib/validation";

/**
 * "Forgot your password?": takes an email and sends a reset link to it.
 *
 * What comes back is worded the same whether or not the address has an
 * account, so this page can't be used to find out who is signed up.
 * Supabase plays its part: for an unknown address it answers 200 with an
 * empty body, exactly as it does after sending a real reset email
 * (internal/api/recover.go in supabase/auth).
 *
 * Being told to slow down is treated as "sent" too. Supabase returns early
 * for an unknown address, before any email is sent, so "you're sending
 * too often" can only come back for an address that has an account; a
 * different message there would give that away. Instead the page always
 * says to use the newest email and to wait before trying again.
 */
export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const address = email.trim();
    const problem = !address
      ? "Enter your email address."
      : !isValidEmail(address)
        ? "Enter a valid email address, like name@example.com."
        : "";
    setError(problem);
    if (problem) {
      setFormError("Please fix the highlighted field.");
      event.currentTarget.querySelector('[name="email"]')?.focus();
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const { error: failure } = await requestPasswordReset(address);
      const slowDown =
        failure?.code === "over_email_send_rate_limit" ||
        failure?.code === "over_request_rate_limit";
      if (failure && !slowDown) setFormError(authErrorMessage(failure));
      else setSentTo(address);
    } catch {
      setFormError(authErrorMessage());
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email."
        footer={
          <Link className="pm-auth__link" to="/signin" state={{ email: sentTo }}>
            Back to sign in
          </Link>
        }
      >
        <p className="pm-auth__sub">
          If <strong>{sentTo}</strong> has a Pebble Math account, we’ve sent it
          a link to set a new password. The link works once.
        </p>
        <p className="pm-auth__aside">
          Nothing after a few minutes? Check your spam folder, then try again
          in a little while. If you asked more than once, use the newest email.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      sub="Enter the email you signed up with and we’ll send you a link to set a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link className="pm-auth__link" to="/signin" state={{ email: email.trim() }}>
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="pm-auth__form"
        onSubmit={onSubmit}
        noValidate
        aria-busy={submitting}
      >
        <AuthField
          id="forgot-email"
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          error={error}
        />

        {formError && (
          <p className="pm-auth__alert" role="alert">
            {formError}
          </p>
        )}

        <CTAButton type="submit" className="pm-auth__submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send the link"}
        </CTAButton>
      </form>
    </AuthLayout>
  );
}
