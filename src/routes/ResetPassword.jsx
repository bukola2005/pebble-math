import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";
import CTAButton from "../components/CTAButton";
import PageLoading from "../components/PageLoading";
import { useAuth } from "../context/AuthContext";
import { authErrorMessage } from "../lib/authErrors";
import { authLink, markResetLinkUsed } from "../lib/authRedirect";
import { MIN_PASSWORD_LENGTH } from "../lib/validation";

// Returns { fieldName: message } for everything wrong, in form order.
function validate({ password, again }) {
  const errors = {};
  if (!password) errors.password = "Choose a new password.";
  else if (password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!errors.password) {
    if (!again) errors.again = "Type the new password again.";
    else if (again !== password) errors.again = "The two passwords don’t match.";
  }
  return errors;
}

/**
 * Where the link in a password-reset email lands. Supabase has already
 * signed the person in from the link by the time this page shows; here they
 * choose the new password.
 *
 * The form only appears when the page was opened from a reset link
 * (lib/authRedirect.js). Merely being signed in isn't enough: on a family
 * device the browser stays signed in as the grown-up, and a child who typed
 * this address must not be able to change their password.
 *
 * The new password is asked for twice. This page exists because a password
 * was lost once already; a typo here would lose it again.
 */
export default function ResetPassword() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ password: "", again: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  // Set if saving fails because the link's sign-in has already run out.
  const [expired, setExpired] = useState(false);

  const change = (name) => (event) => {
    setValues((prev) => ({ ...prev, [name]: event.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const found = validate(values);
    const invalid = Object.keys(found);
    setErrors(found);
    if (invalid.length > 0) {
      setFormError("Please fix the highlighted fields.");
      event.currentTarget.querySelector(`[name="${invalid[0]}"]`)?.focus();
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const { error } = await updatePassword(values.password);
      if (!error) {
        markResetLinkUsed();
        setDone(true);
      } else if (
        error.name === "AuthSessionMissingError" ||
        error.code === "session_not_found"
      ) {
        setExpired(true);
      } else {
        setFormError(authErrorMessage(error));
      }
    } catch {
      setFormError(authErrorMessage());
    } finally {
      setSubmitting(false);
    }
  };

  const askAgain = (
    <Link className="pm-auth__link" to="/forgot-password">
      Send me a new link
    </Link>
  );

  if (done) {
    return (
      <AuthLayout
        title="Your password has been changed."
        sub="You’re signed in. Use the new password next time."
      >
        <div className="pm-auth__form">
          <CTAButton className="pm-auth__submit" onClick={() => navigate("/dashboard")}>
            Go to your dashboard
          </CTAButton>
        </div>
      </AuthLayout>
    );
  }

  // The link was too old or had been used, so Supabase sent an error back
  // instead of signing anyone in.
  if (authLink.errorCode || expired) {
    return (
      <AuthLayout
        title="This reset link didn’t work."
        sub="Reset links work once, and only for a limited time. Ask for a new one and use the newest email."
        footer={askAgain}
      />
    );
  }

  if (authLink.type !== "recovery") {
    return (
      <AuthLayout
        title="Open the link in your email."
        sub="To set a new password, use the link from the reset email. If you don’t have one, you can ask for it."
        footer={askAgain}
      />
    );
  }

  if (loading) return <PageLoading />;

  // Came from a reset link, but Supabase couldn't sign them in with it.
  if (!session) {
    return (
      <AuthLayout
        title="This reset link didn’t work."
        sub="Reset links work once, and only for a limited time. Ask for a new one and use the newest email."
        footer={askAgain}
      />
    );
  }

  return (
    <AuthLayout
      title="Choose a new password."
      sub={`For ${session.user.email}.`}
    >
      <form
        className="pm-auth__form"
        onSubmit={onSubmit}
        noValidate
        aria-busy={submitting}
      >
        {/* Tells password managers which account this new password is for. */}
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={session.user.email}
          readOnly
          hidden
        />

        <AuthField
          id="reset-password"
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={values.password}
          onChange={change("password")}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={errors.password}
        />

        <AuthField
          id="reset-again"
          label="Type it again"
          name="again"
          type="password"
          autoComplete="new-password"
          required
          value={values.again}
          onChange={change("again")}
          error={errors.again}
        />

        {formError && (
          <p className="pm-auth__alert" role="alert">
            {formError}
          </p>
        )}

        <CTAButton type="submit" className="pm-auth__submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save new password"}
        </CTAButton>
      </form>
    </AuthLayout>
  );
}
