import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";
import CTAButton from "../components/CTAButton";
import { useAuth } from "../context/AuthContext";
import { clearAccountDeletedNote, hasAccountDeletedNote } from "../lib/account";
import { authErrorMessage } from "../lib/authErrors";
import { isValidEmail } from "../lib/validation";

// Returns { fieldName: message }. Sign-in doesn't enforce a password length:
// it only asks whether the password is right, not whether it's a good one.
function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(email.trim()))
    errors.email = "Enter a valid email address, like name@example.com.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export default function SignIn() {
  const { session, signIn } = useAuth();
  const location = useLocation();
  // Arriving from "already has an account", a reset email or /confirmed,
  // the address comes along in router state (never the address bar) so it
  // doesn't need typing twice, and the cursor starts in the password box.
  const carriedEmail = Boolean(location.state?.email);
  const [values, setValues] = useState({
    email: location.state?.email ?? "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Just after "Delete my account": say so, once.
  const [accountDeleted] = useState(hasAccountDeletedNote);
  useEffect(() => {
    if (accountDeleted) clearAccountDeletedNote();
  }, [accountDeleted]);

  // ProtectedRoute leaves the page the visitor was trying to reach in
  // router state. Signed in, we send them there, or to the dashboard if
  // they came to sign-in directly. This also covers a visitor who is
  // already signed in, and a sign-in that just succeeded: it creates the
  // session through the auth listener, and that lands here.
  if (session) {
    return <Navigate to={location.state?.from ?? "/dashboard"} replace />;
  }

  const change = (name) => (event) => {
    setValues((prev) => ({ ...prev, [name]: event.target.value }));
    // Editing a field clears its own complaint.
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
      // Move to the first problem; its message is read with the field.
      event.currentTarget.querySelector(`[name="${invalid[0]}"]`)?.focus();
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const { error } = await signIn({
        email: values.email.trim(),
        password: values.password,
      });
      if (error) setFormError(authErrorMessage(error));
      // On success there is nothing to do: the redirect above takes over.
    } catch {
      setFormError(authErrorMessage());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back."
      sub="Sign in with the email and password you signed up with."
      footer={
        <>
          New here?{" "}
          <Link className="pm-auth__link" to="/signup">
            Create an account
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
        {/* Just after "Delete my account". */}
        {accountDeleted && (
          <p className="pm-auth__aside" role="status">
            Your account has been deleted, with every child on it and everything they played.
          </p>
        )}

        <AuthField
          id="signin-email"
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={values.email}
          onChange={change("email")}
          error={errors.email}
        />

        <AuthField
          id="signin-password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus={carriedEmail}
          required
          value={values.password}
          onChange={change("password")}
          error={errors.password}
        />

        <p className="pm-auth__aside-link">
          <Link
            className="pm-auth__link"
            to="/forgot-password"
            state={{ email: values.email.trim() }}
          >
            Forgot your password?
          </Link>
        </p>

        {formError && (
          <p className="pm-auth__alert" role="alert">
            {formError}
          </p>
        )}

        <CTAButton
          type="submit"
          className="pm-auth__submit"
          disabled={submitting}
        >
          {submitting ? "Signing you in…" : "Sign in"}
        </CTAButton>
      </form>
    </AuthLayout>
  );
}
