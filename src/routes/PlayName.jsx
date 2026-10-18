import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import CTAButton from "../components/CTAButton";
import { getZiziLook } from "../data/zizi";
import { FIRST_WORDS, SECOND_WORDS, joinName, randomIndex } from "../data/gameNames";
import { chooseGameName } from "../lib/players";
import { prefetchStep } from "../lib/playFlow";
import "./PlayName.css";

/**
 * /play/:playerId/name: the child builds their game name from two lists of
 * words (data/gameNames.js), by tapping. There is no text box anywhere, so
 * a child can never type a real name.
 *
 * Each word steps through its list with big arrow buttons, and Shuffle
 * picks a random pair. It starts on a random pair, so there is something
 * fun to look at before anything is tapped. Saved to players.game_name.
 */
export default function PlayName() {
  const { player, goNext } = useOutletContext();
  const [first, setFirst] = useState(() => randomIndex(FIRST_WORDS));
  const [second, setSecond] = useState(() => randomIndex(SECOND_WORDS));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // While they choose, fetch Scene 1.
  useEffect(() => {
    prefetchStep("story", player);
  }, [player]);

  const name = joinName(FIRST_WORDS[first], SECOND_WORDS[second]);
  const zizi = getZiziLook(player.character);

  const step = (list, setIndex, by) =>
    setIndex((index) => (index + by + list.length) % list.length);

  const shuffle = () => {
    // Always change at least one word, so Shuffle never looks like it did nothing.
    let a = randomIndex(FIRST_WORDS);
    let b = randomIndex(SECOND_WORDS);
    if (a === first && b === second) a = (a + 1) % FIRST_WORDS.length;
    setFirst(a);
    setSecond(b);
  };

  const confirm = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const { error: failure } = await chooseGameName(player.id, name);
      if (failure) setError("That didn’t save. Please try again.");
      else goNext({ game_name: name });
    } catch {
      setError("That didn’t save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pm-name-screen">
      <main id="main" className="pm-name">
        <img
          className="pm-name__zizi"
          src={zizi.src}
          width={zizi.w}
          height={zizi.h}
          alt=""
          aria-hidden="true"
        />

        <div className="pm-name__builder">
          <h1 className="pm-name__title">Pick your game name.</h1>

          <WordPicker
            label="first word"
            word={FIRST_WORDS[first]}
            onPrevious={() => step(FIRST_WORDS, setFirst, -1)}
            onNext={() => step(FIRST_WORDS, setFirst, 1)}
          />
          <WordPicker
            label="second word"
            word={SECOND_WORDS[second]}
            onPrevious={() => step(SECOND_WORDS, setSecond, -1)}
            onNext={() => step(SECOND_WORDS, setSecond, 1)}
          />

          {/* Read out after every change, so the name is heard as it's built. */}
          <p className="pm-sr-only" aria-live="polite">
            {name}
          </p>

          {error && (
            <p className="pm-name__error" role="alert">
              {error}
            </p>
          )}

          <div className="pm-name__actions">
            <CTAButton variant="secondary" onClick={shuffle}>
              <svg className="pm-name__shuffle-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 7h3.5c2 0 3.2 1 4.3 2.8l1.4 2.4c1.1 1.8 2.3 2.8 4.3 2.8H20M17 12l3 3-3 3M4 17h3.5c1.2 0 2.1-.4 2.9-1.1M14.6 8.1c.8-.7 1.7-1.1 2.9-1.1H20M17 4l3 3-3 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Shuffle
            </CTAButton>
            <CTAButton onClick={confirm} disabled={saving}>
              {saving ? "Saving…" : "That’s my name!"}
            </CTAButton>
          </div>
        </div>
      </main>
    </div>
  );
}

/** One word of the name, between big arrows that step through its list. */
function WordPicker({ label, word, onPrevious, onNext }) {
  return (
    <div className="pm-word">
      <button type="button" className="pm-word__arrow" onClick={onPrevious}>
        <span className="pm-sr-only">Previous {label}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* `key` replays the little pop each time the word changes. */}
      <span key={word} className="pm-word__text">
        {word}
      </span>
      <button type="button" className="pm-word__arrow" onClick={onNext}>
        <span className="pm-sr-only">Next {label}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
