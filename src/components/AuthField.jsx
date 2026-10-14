import "./AuthField.css";

/**
 * A labelled text input with an optional hint and an inline error.
 *
 * The label is tied to the input with htmlFor/id, and the hint or error is
 * tied with aria-describedby, so a screen reader reads it when the field is
 * focused. Anything else (type, autoComplete, value, ref…) goes straight
 * onto the <input>.
 */
export default function AuthField({ id, label, hint, error, ...inputProps }) {
  const noteId = `${id}-note`;

  return (
    <div className="pm-field">
      <label className="pm-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="pm-field__input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error || hint ? noteId : undefined}
        {...inputProps}
      />
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
