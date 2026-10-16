import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthField from "../components/AuthField";
import CTAButton from "../components/CTAButton";
import { useAuth } from "../context/AuthContext";
import { authErrorMessage } from "../lib/authErrors";
import {
  MIN_PASSWORD_LENGTH,
  NAME_MAX_LENGTH,
  isValidEmail,
} from "../lib/validation";
import "./SignUp.css";

// Same wording as the Get Started flow, so the two read as one product.
const ROLES = [
  { id: "parent", title: "Parent", text: "I’m setting this up for my child." },
  { id: "teacher", title: "Teacher", text: "I want to use it with my class." },
];

// Returns { fieldName: message } for everything wrong, in form order.
function validate({ role, fullName, email, password }) {
  const errors = {};
  if (!role) errors.role = "Choose parent or teacher.";
  if (!fullName.trim()) errors.fullName = "Enter your name.";
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!isValidEmail(email.trim()))
    errors.email = "Enter a valid email address, like name@example.com.";
  if (!password) errors.password = "Choose a password.";
  else if (password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  return errors;
}

/*
  Did sign-up land on an address that already has an account?

  Supabase doesn't say so outright, to stop sign-up being used to find out
  who is registered. What it does instead (internal/api/signup.go in
  supabase/auth):
    - Email and phone confirmation both on (this project's setting): a 200
      with a stand-in user whose `identities` list is empty. A real new
      account always comes back with one identity, its email.
    - Either confirmation off: an error, user_already_exists.
  If Supabase ever changes the shape, this simply stops matching and the
  page falls back to "check your email", which is wrong but harmless.

  An address that signed up before but never confirmed is a third case:
  Supabase resends the confirmation, keeps the old password, and returns the
  real user, so it can't be told apart here. The "check your email" screen
  says what that means.
*/
function alreadyRegistered(data, error) {
  if (error) return error.code === "user_already_exists" || error.code === "email_exists";
  const identities = data?.user?.identities;
  return Array.isArray(identities) && identities.length === 0;
}

/**
 * A parent or teacher creates the account. Children never sign up: they
 * are added as players under it later, with no email or password of their own.
 */
export default function SignUp() {
  const { session, signUp } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    role: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Set to the address once sign-up worked but still needs confirming.
  const [confirmingEmail, setConfirmingEmail] = useState("");
  // Set to the address when it turns out to have an account already.
  const [existingEmail, setExistingEmail] = useState("");

  // Already signed in, or just signed up with confirmation switched off:
  // there's nothing to do here. Sign-up creates the session through the
  // auth listener, so this is also how a successful sign-up gets to the
  // dashboard.
  if (session) return <Navigate to="/dashboard" replace />;

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
      const { data, error } = await signUp({
        email: values.email.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        role: values.role,
      });

      if (alreadyRegistered(data, error)) {
        setExistingEmail(values.email.trim());
      } else if (error) {
        setFormError(authErrorMessage(error));
      } else if (!data.session) {
        // Supabase's "confirm email" setting is on: the account exists but
        // can't sign in until the link in the email is opened.
        setConfirmingEmail(values.email.trim());
      }
      // Otherwise there is a session and the redirect above takes over.
    } catch {
      setFormError(authErrorMessage());
    } finally {
      setSubmitting(false);
    }
  };

  if (existingEmail) {
    return (
      <AuthLayout
        title="This email already has an account."
        footer={
          <button
            type="button"
            className="pm-auth__link pm-auth__link-button"
            onClick={() => setExistingEmail("")}
          >
            Use a different email
          </button>
        }
      >
        <p className="pm-auth__sub">
          <strong>{existingEmail}</strong> is already signed up for Pebble
          Math. Signing up again doesn’t change its password, so sign in with
          the password you chose before.
        </p>
        <div className="pm-auth__choices">
          <CTAButton
            onClick={() => navigate("/signin", { state: { email: existingEmail } })}
          >
            Sign in
          </CTAButton>
          <Link
            className="pm-auth__link"
            to="/forgot-password"
            state={{ email: existingEmail }}
          >
            Forgot your password?
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (confirmingEmail) {
    return (
      <AuthLayout
        title="Check your email."
        footer={
          <Link className="pm-auth__link" to="/signin" state={{ email: confirmingEmail }}>
            Back to sign in
          </Link>
        }
      >
        <p className="pm-auth__sub">
          Open the link we sent to <strong>{confirmingEmail}</strong> to
          confirm your account, then sign in.
        </p>
        <p className="pm-auth__aside">
          Nothing after a few minutes? Check your spam folder. If you signed up
          with this email before but never opened the link, this is a new copy
          of it, and your password is still the one you chose the first time.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account."
      sub="This account is for the parent or teacher. Children don’t need one."
      footer={
        <>
          Already have an account?{" "}
          <Link className="pm-auth__link" to="/signin">
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
        <fieldset
          className="pm-roles"
          aria-describedby={errors.role ? "role-note" : undefined}
        >
          <legend className="pm-roles__legend">I’m signing up as</legend>
          <div className="pm-roles__options">
            {ROLES.map((role) => (
              <label key={role.id} className="pm-role">
                {/* The real radio stays in the page for keyboards and screen
                    readers; the card next to it is what you see. */}
                <input
                  className="pm-role__input pm-sr-only"
                  type="radio"
                  name="role"
                  value={role.id}
                  checked={values.role === role.id}
                  onChange={change("role")}
                  required
                />
                <span className="pm-role__card">
                  <span className="pm-role__title">{role.title}</span>
                  <span className="pm-role__text">{role.text}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.role && (
            <p id="role-note" className="pm-field__note pm-field__note--error">
              {errors.role}
            </p>
          )}
        </fieldset>

        <AuthField
          id="signup-name"
          label="Your name"
          name="fullName"
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          required
          value={values.fullName}
          onChange={change("fullName")}
          error={errors.fullName}
        />

        <AuthField
          id="signup-email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={values.email}
          onChange={change("email")}
          error={errors.email}
        />

        <AuthField
          id="signup-password"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={values.password}
          onChange={change("password")}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={errors.password}
        />

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
          {submitting ? "Creating your account…" : "Create account"}
        </CTAButton>
      </form>
    </AuthLayout>
  );
}
