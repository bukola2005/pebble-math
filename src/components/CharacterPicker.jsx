import { useState } from "react";
import CTAButton from "./CTAButton";
import { CHARACTERS } from "../data/characters";
import "./CharacterPicker.css";

/**
 * A child picks who they'll be, on their first play: the same eight
 * characters as everywhere else, big enough for small fingers, and almost
 * nothing to read.
 *
 * Tapping a character only selects it; the button confirms. One stray tap
 * shouldn't decide something the child keeps.
 *
 * It saves nothing itself: `onConfirm(characterId)` does, and the session
 * passes `saving` and any `error` back in.
 */
export default function CharacterPicker({ initial, saving, error, onConfirm }) {
  const [choice, setChoice] = useState(initial ?? null);

  return (
    <div className="pm-picker">
      <h1 className="pm-picker__title" id="pm-picker-title">
        Pick who you’ll be.
      </h1>

      <fieldset className="pm-picker__options" aria-labelledby="pm-picker-title">
        {CHARACTERS.map((option) => (
          <label key={option.id} className="pm-picker__option">
            {/* The real radio stays in the page for keyboards and screen
                readers; the round picture next to it is what you see. */}
            <input
              className="pm-picker__input pm-sr-only"
              type="radio"
              name="character"
              value={option.id}
              checked={choice === option.id}
              onChange={() => setChoice(option.id)}
            />
            <span className="pm-picker__face">
              {/* Already downloaded and decoded by the loading screen; no
                  `decoding="async"`, so they paint with the first frame. */}
              <img
                src={option.src}
                alt=""
                aria-hidden="true"
                width={option.w}
                height={option.h}
              />
            </span>
            <span className="pm-sr-only">{option.label} character</span>
          </label>
        ))}
      </fieldset>

      {error && (
        <p className="pm-picker__error" role="alert">
          {error}
        </p>
      )}

      <CTAButton onClick={() => onConfirm(choice)} disabled={!choice || saving}>
        {saving ? "Saving…" : "This is me"}
      </CTAButton>
    </div>
  );
}
