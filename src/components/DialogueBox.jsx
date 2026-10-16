import { useEffect, useRef } from "react";
import { DIALOGUE_LEAVES } from "../data/market";
import { SPEAKERS, fillLine } from "../data/dialogue";
import { useReadAloud } from "../lib/speech";
import "./DialogueBox.css";

/**
 * The one dialogue box, for every line anyone says in the game: who is
 * speaking, a small portrait, the line, and a big Next.
 *
 *   line          `{ speaker, text }` from data/dialogue.js
 *   values        what fills `{name}` and `{n}` in the text
 *   ziziPortrait  the child's Zizi look (data/zizi.js), for her lines
 *   buttonLabel   "Next" unless the line ends something ("Let's go")
 *   onNext        the button, or Enter / Space, since it takes the focus
 *
 * The line is read aloud as it appears. The frame is a painted garden:
 * CSS for the border, an SVG filter to roughen its edge like a brush
 * stroke, and two leaf sprigs cut from the stall's near layer.
 */
export default function DialogueBox({ line, values, ziziPortrait, buttonLabel = "Next", onNext }) {
  const speaker = SPEAKERS[line.speaker] ?? { label: "", voice: "narrator" };
  const label = fillLine(speaker.label, values);
  const text = fillLine(line.text, values);
  const portrait = line.speaker === "zizi" ? ziziPortrait?.src : speaker.portrait;
  const buttonRef = useRef(null);

  useReadAloud(text, speaker.voice);

  // Each new line puts the focus back on the button, so Enter keeps going.
  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, [text]);

  return (
    <section className="pm-dialogue" aria-label={`${label} says`}>
      <svg className="pm-dialogue__defs" aria-hidden="true" focusable="false">
        <filter id="pm-painted-edge" x="-4%" y="-8%" width="108%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <img
        className="pm-dialogue__leaves pm-dialogue__leaves--fan"
        src={DIALOGUE_LEAVES.fan.src}
        width={DIALOGUE_LEAVES.fan.w}
        height={DIALOGUE_LEAVES.fan.h}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        className="pm-dialogue__leaves pm-dialogue__leaves--flowers"
        src={DIALOGUE_LEAVES.flowers.src}
        width={DIALOGUE_LEAVES.flowers.w}
        height={DIALOGUE_LEAVES.flowers.h}
        alt=""
        aria-hidden="true"
        draggable={false}
      />

      <div className="pm-dialogue__panel">
        <span className="pm-dialogue__frame" aria-hidden="true" />

        {portrait && (
          <span
            className={`pm-dialogue__portrait pm-dialogue__portrait--${line.speaker}`}
            aria-hidden="true"
          >
            <img
              src={portrait}
              alt=""
              draggable={false}
              style={speaker.portraitFit === "contain" ? { objectFit: "contain" } : undefined}
            />
          </span>
        )}

        <div className="pm-dialogue__words">
          <p className="pm-dialogue__speaker">{label}</p>
          {/* `key` replays the soft fade for every new line. */}
          <p key={text} className="pm-dialogue__line" aria-live="polite">
            {text}
          </p>
        </div>

        <button ref={buttonRef} type="button" className="pm-dialogue__next" onClick={onNext}>
          <span>{buttonLabel}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5 12h13M13 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
