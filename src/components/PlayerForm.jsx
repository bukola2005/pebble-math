import { useEffect, useRef, useState } from "react";
import AuthField from "./AuthField";
import CTAButton from "./CTAButton";
import { PARENT_MONSTERS } from "../data/monsters";
import { AGE_BANDS, CLASS_LEVELS } from "../data/players";
import { addPlayer, playerErrorMessage } from "../lib/players";
import { PLAYER_NAME_MAX_LENGTH } from "../lib/validation";
import "./PlayerForm.css";

// Returns { fieldName: message } for everything wrong, in form order.
function validate({ displayName, ageBand, monster }) {
  const errors = {};
  const name = displayName.trim();
  if (!name) errors.displayName = "Enter a display name.";
  else if (name.includes("@"))
    // The one thing we can cheaply catch: an email address typed in by habit.
    errors.displayName = "Use a nickname, not an email address.";
  if (!ageBand) errors.ageBand = "Choose an age band.";
  if (!monster) errors.monster = "Pick a monster for them.";
  return errors;
}

/**
 * Adds a child as a player under the signed-in account.
 *
 * It asks for exactly what a player holds and no more: a display name, an
 * age band, an optional class, and a monster so the grown-up can tell their
 * children apart. Never an email, a password, a date of birth or any
 * contact detail. The monster is not the in-game character: in the game the
 * child plays as Zizi and chooses her look themselves.
 */
export default function PlayerForm({ userId, onAdded, onCancel }) {
  const [values, setValues] = useState({
    displayName: "",
    ageBand: "",
    classLevel: "",
    monster: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nameInput = useRef(null);

  // The form opens because someone asked for it: start them in the first field.
  useEffect(() => {
    nameInput.current?.focus();
  }, []);

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
      event.currentTarget.querySelector(`[name="${invalid[0]}"]`)?.focus();
      return;
    }

    setFormError("");
    setSubmitting(true);
    try {
      const { data, error } = await addPlayer({
        profileId: userId,
        displayName: values.displayName.trim(),
        ageBand: values.ageBand,
        classLevel: values.classLevel,
        monster: values.monster,
      });
      if (error) setFormError(playerErrorMessage(error));
      else onAdded(data);
    } catch {
      setFormError(playerErrorMessage());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="pm-playerform"
      onSubmit={onSubmit}
      noValidate
      aria-busy={submitting}
      aria-labelledby="player-form-title"
    >
      <h3 id="player-form-title" className="pm-playerform__title">
        Add a player
      </h3>

      <AuthField
        ref={nameInput}
        id="player-name"
        label="Display name"
        name="displayName"
        type="text"
        autoComplete="off"
        maxLength={PLAYER_NAME_MAX_LENGTH}
        required
        value={values.displayName}
        onChange={change("displayName")}
        hint="A nickname is fine. Please don’t use a surname or an email address."
        error={errors.displayName}
      />

      {/* Age band: four choices, so radios dressed as chips. */}
      <fieldset
        className="pm-choices"
        aria-describedby={errors.ageBand ? "player-age-note" : undefined}
      >
        <legend className="pm-choices__legend">Age band</legend>
        <div className="pm-choices__row">
          {AGE_BANDS.map((band) => (
            <label key={band.id} className="pm-choice">
              {/* The real radio stays in the page for keyboards and screen
                  readers; the chip next to it is what you see. */}
              <input
                className="pm-choice__input pm-sr-only"
                type="radio"
                name="ageBand"
                value={band.id}
                checked={values.ageBand === band.id}
                onChange={change("ageBand")}
                required
              />
              <span className="pm-choice__face">{band.label}</span>
            </label>
          ))}
        </div>
        {errors.ageBand && (
          <p id="player-age-note" className="pm-field__note pm-field__note--error">
            {errors.ageBand}
          </p>
        )}
      </fieldset>

      {/* Class is optional, so a select: "no class" is a real choice there. */}
      <div className="pm-field">
        <label className="pm-field__label" htmlFor="player-class">
          Class (optional)
        </label>
        <select
          id="player-class"
          className="pm-field__input"
          name="classLevel"
          value={values.classLevel}
          onChange={change("classLevel")}
        >
          <option value="">No class</option>
          {CLASS_LEVELS.map((level) => (
            <option key={level.id} value={level.id}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      {/* A monster per child, so a grown-up with several can tell them
          apart at a glance. Blob, the guide, isn't offered. */}
      <fieldset
        className="pm-choices"
        aria-describedby={`player-monster-help${errors.monster ? " player-monster-note" : ""}`}
      >
        <legend className="pm-choices__legend">Their monster</legend>
        <p id="player-monster-help" className="pm-playerform__note">
          So you can tell your children apart. It isn’t their game character:
          in the game every child plays as Zizi and chooses her look.
        </p>
        <div className="pm-monsters">
          {PARENT_MONSTERS.map((option) => (
            <label key={option.id} className="pm-monster">
              <input
                className="pm-monster__input pm-sr-only"
                type="radio"
                name="monster"
                value={option.id}
                checked={values.monster === option.id}
                onChange={change("monster")}
                required
              />
              <span className="pm-monster__face">
                <img
                  src={option.src}
                  alt=""
                  aria-hidden="true"
                  width={option.w}
                  height={option.h}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="pm-sr-only">{option.label} monster</span>
            </label>
          ))}
        </div>
        {errors.monster && (
          <p id="player-monster-note" className="pm-field__note pm-field__note--error">
            {errors.monster}
          </p>
        )}
      </fieldset>

      {formError && (
        <p className="pm-playerform__alert" role="alert">
          {formError}
        </p>
      )}

      <div className="pm-playerform__actions">
        <CTAButton type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add player"}
        </CTAButton>
        <button
          type="button"
          className="pm-playerform__cancel"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
