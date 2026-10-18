import { SPEAKERS } from "../data/dialogue";
import { useReadAloud } from "../lib/speech";
import "./HintButton.css";

/**
 * Blob's face in the corner: tap for one step of help, tap again for the
 * next. What each step does is the parent's business (PlayStall); this is
 * the button and the thought bubble that says the step.
 *
 *   message   the step to say, or null when the bubble is closed
 *   shownKey  changes with every tap, so the same words are said again
 */
export default function HintButton({ message, shownKey, onHint }) {
  return (
    <div className="pm-hint">
      <button type="button" className="pm-hint__button" onClick={onHint} aria-label="Ask Blob for a hint">
        <img src={SPEAKERS.blob.portrait} alt="" draggable={false} />
      </button>
      {message && <HintBubble key={shownKey} message={message} />}
    </div>
  );
}

function HintBubble({ message }) {
  useReadAloud(message, SPEAKERS.blob.voice);
  return (
    <p className="pm-hint__bubble" role="status">
      {message}
    </p>
  );
}
