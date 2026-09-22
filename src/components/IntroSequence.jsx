import { useEffect, useState } from "react";
import MarketScene from "./MarketScene";
import CTAButton from "./CTAButton";
import "./IntroSequence.css";

/* One beat per line. Change this single number to slow the intro down
   or speed it up — nothing else depends on the timing. */
const BEAT_MS = 2200;

const LINES = [
  "Welcome to Pebble Math.",
  "Ready to see what numbers can do?",
  "Let’s go.",
];

export default function IntroSequence({ name, character, onDone }) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // With reduced motion the intro is already over: the last line shows.
  const [beat, setBeat] = useState(reduceMotion ? LINES.length - 1 : -1);

  useEffect(() => {
    if (reduceMotion) return undefined;

    const timers = LINES.map((_, i) =>
      setTimeout(() => setBeat(i), 900 + i * BEAT_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  const greeting = beat === 0 && name ? `Welcome to Pebble Math, ${name}.` : null;
  const lastBeat = beat >= LINES.length - 1;

  return (
    <div className="pm-intro">
      <div className="pm-intro__stage">
        <MarketScene reveal character={character} />
      </div>

      <div className="pm-intro__lines" aria-live="polite">
        {LINES.map((line, i) => (
          <p
            key={line}
            className={`pm-intro__line${beat === i ? " is-on" : ""}${
              beat > i ? " is-past" : ""
            }`}
          >
            {i === 0 ? greeting ?? line : line}
          </p>
        ))}
      </div>

      <div className={`pm-intro__go${lastBeat ? " is-on" : ""}`}>
        <CTAButton onClick={onDone}>Enter the market</CTAButton>
      </div>

      {!lastBeat && (
        <button type="button" className="pm-intro__skip" onClick={onDone}>
          Skip intro
        </button>
      )}
    </div>
  );
}
