import { useCallback, useLayoutEffect, useRef, useState } from "react";
import "./AuthField.css";

/**
 * A labelled text input with an optional hint and an inline error.
 *
 * The label is tied to the input with htmlFor/id, and the hint or error is
 * tied with aria-describedby, so a screen reader reads it when the field is
 * focused. Anything else (type, autoComplete, value, ref…) goes straight
 * onto the <input>.
 *
 * A password field (type="password") also gets a button inside it, at the
 * right, that shows and hides what was typed. Sign-up, sign-in and the new
 * password page all come through here, so it works the same on each.
 */
export default function AuthField({ id, label, hint, error, type, ref, ...inputProps }) {
  const noteId = `${id}-note`;
  const isPassword = type === "password";
  // Hidden to begin with, every time; only the parent shows or hides it.
  const [shown, setShown] = useState(false);
  const input = useRef(null);
  // Where the caret was when the eye was pressed, to put it back after.
  const caret = useRef(null);

  const setInput = useCallback(
    (node) => {
      input.current = node;
      if (typeof ref === "function") return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );

  // Changing the type can drop the caret, and on a phone the tap can take
  // focus from the field: put both back, so they can carry on typing
  // mid-word. Pressed from the keyboard, focus stays on the button.
  useLayoutEffect(() => {
    const at = caret.current;
    caret.current = null;
    if (!at || !input.current) return;
    if (document.activeElement !== input.current) input.current.focus({ preventScroll: true });
    input.current.setSelectionRange(at.start, at.end, at.direction);
  }, [shown]);

  const noteCaret = () => {
    const el = input.current;
    caret.current =
      el && document.activeElement === el
        ? { start: el.selectionStart, end: el.selectionEnd, direction: el.selectionDirection }
        : null;
  };

  const toggle = (event) => {
    // Enter or Space on the button: nothing to put back.
    if (event.detail === 0) caret.current = null;
    setShown((now) => !now);
  };

  const field = (
    <input
      id={id}
      ref={setInput}
      className={isPassword ? "pm-field__input pm-field__input--password" : "pm-field__input"}
      type={isPassword && shown ? "text" : type}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error || hint ? noteId : undefined}
      // Shown as text, a password must not be capitalised, corrected or
      // sent off to be spell-checked.
      {...(isPassword && { autoCapitalize: "none", autoCorrect: "off", spellCheck: false })}
      {...inputProps}
    />
  );

  return (
    <div className="pm-field">
      <label className="pm-field__label" htmlFor={id}>
        {label}
      </label>
      {isPassword ? (
        <div className="pm-field__control">
          {field}
          <button
            type="button"
            className="pm-field__toggle"
            aria-label={shown ? "Hide password" : "Show password"}
            aria-controls={id}
            onPointerDown={noteCaret}
            // A click doesn't take focus, or the caret, from the field.
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggle}
          >
            {shown ? <EyeOpen /> : <EyeStruck />}
          </button>
        </div>
      ) : (
        field
      )}
      {/* An error replaces the hint rather than stacking under it. */}
      {error ? (
        <p id={noteId} className="pm-field__note pm-field__note--error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={noteId} className="pm-field__note">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

// The password is showing: an open eye.
function EyeOpen() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// The password is hidden: the same eye, struck through.
function EyeStruck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 4l16 16" />
    </svg>
  );
}
