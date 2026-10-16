import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CTAButton from "../components/CTAButton";
import { STORYBOOK } from "../data/media";
import { ZIZI_LOOKS, getZiziLook } from "../data/zizi";
import { chooseCharacter } from "../lib/players";
import { prefetchStep } from "../lib/playFlow";
import "./PlayAvatar.css";

/**
 * /play/:playerId/avatar: the child chooses how Zizi looks, on the open
 * storybook. One decision only: six looks, then "This is me".
 *
 * On a wide screen the six looks sit on the left page and the chosen Zizi
 * stands on the right page, with the button under her. On a phone held
 * upright the book shows its left page only, with the looks on it.
 *
 * Tapping a look only selects it; the button confirms, so one stray tap
 * doesn't decide something the child keeps. The look is saved to
 * players.character the moment they confirm.
 */
export default function PlayAvatar() {
  const { player, goNext } = useOutletContext();
  const known = ZIZI_LOOKS.some((look) => look.id === player.character);
  const [choice, setChoice] = useState(known ? player.character : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // While they choose, quietly fetch the name screen. (The looks themselves
  // came with the loading screen.)
  useEffect(() => {
    prefetchStep("name", player);
  }, [player]);

  const confirm = async () => {
    if (!choice || saving) return;
    setSaving(true);
    setError("");
    try {
      const { error: failure } = await chooseCharacter(player.id, choice);
      if (failure) setError("That didn’t save. Please try again.");
      else goNext({ character: choice });
    } catch {
      setError("That didn’t save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // The original Zizi stands on the page until a look is chosen.
  const shown = getZiziLook(choice);

  return (
    <div className="pm-book-screen">
      {/* The same picture, blurred, fills whatever the book doesn't cover.
          It is already downloaded, so it costs nothing. */}
      <img className="pm-book-screen__backdrop" src={STORYBOOK.src} alt="" aria-hidden="true" />

      <main id="main" className="pm-book">
        {/* The picture of the book, clipped to the book's box; on a phone
            that box is the left page alone. */}
        <div className="pm-book__paper" aria-hidden="true">
          <img
            className="pm-book__art"
            src={STORYBOOK.src}
            width={STORYBOOK.width}
            height={STORYBOOK.height}
            alt=""
          />
        </div>

        <h1 className="pm-book__title" id="pm-avatar-title">
          Which Zizi are you?
        </h1>

        <fieldset className="pm-book__looks" aria-labelledby="pm-avatar-title">
          {ZIZI_LOOKS.map((look) => (
            <label key={look.id} className="pm-look">
              {/* The real radio stays in the page for keyboards and screen
                  readers; the picture next to it is what you see. */}
              <input
                className="pm-look__input pm-sr-only"
                type="radio"
                name="look"
                value={look.id}
                checked={choice === look.id}
                onChange={() => setChoice(look.id)}
              />
              <span className="pm-look__face">
                <img src={look.src} alt="" aria-hidden="true" width={look.w} height={look.h} />
              </span>
              <span className="pm-sr-only">{look.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="pm-book__preview" aria-hidden="true">
          <img key={shown.id} src={shown.src} alt="" width={shown.w} height={shown.h} />
        </div>

        <div className="pm-book__actions">
          {error && (
            <p className="pm-book__error" role="alert">
              {error}
            </p>
          )}
          <CTAButton onClick={confirm} disabled={!choice || saving}>
            {saving ? "Saving…" : "This is me"}
          </CTAButton>
        </div>
      </main>
    </div>
  );
}
