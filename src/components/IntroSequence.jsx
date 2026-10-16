import { useEffect, useState } from "react";
import MarketScene from "./MarketScene";
import CTAButton from "./CTAButton";
import "./IntroSequence.css";

/* The child has just watched a 22-second film, so this is short: the
   market builds itself up with their character in it (the scene's own
   build-up runs to about 2.9s), the welcome arrives just after it starts,
   and the way in appears once their character has walked onto the stall.
   Change these two numbers to retime it; nothing else depends on them. */
const WELCOME_AT_MS = 600;
const READY_AT_MS = 2600;

/**
 * The personalised welcome, on a child's first play only, straight after
 * the opening film. Its one job is to greet the child by name.
 */
export default function IntroSequence({ name, character, onDone }) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // 0: the scene is building. 1: the welcome is up. 2: they can go in.
  // With reduced motion the intro is already over.
  const [step, setStep] = useState(reduceMotion ? 2 : 0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timers = [
      setTimeout(() => setStep(1), WELCOME_AT_MS),
      setTimeout(() => setStep(2), READY_AT_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  const welcome = name ? `Welcome to Pebble Math, ${name}.` : "Welcome to Pebble Math.";

  return (
    <div className="pm-intro">
      <div className="pm-intro__stage">
        <MarketScene reveal character={character} />
      </div>

      <div className="pm-intro__lines" aria-live="polite">
        <p className={`pm-intro__line${step >= 1 ? " is-on" : ""}`}>{welcome}</p>
      </div>

      {/* inert until it shows, so it can't be tabbed to while invisible. */}
      <div className={`pm-intro__go${step >= 2 ? " is-on" : ""}`} inert={step < 2}>
        <CTAButton onClick={onDone}>Enter the market</CTAButton>
      </div>
    </div>
  );
}
