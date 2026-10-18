import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SPEAKERS } from "../data/dialogue";
import { ORANGE } from "../data/market";
import { useReadAloud } from "../lib/speech";
import "./CoachMark.css";

const GAP = 14; // between the highlight and the bubble
const EDGE = 12; // keep clear of the screen edges

/**
 * One tutorial beat: everything dims except one thing, a bobbing arrow
 * points at it, and Blob says what it is in a thought bubble beside it.
 * Only ever one highlight on screen.
 *
 *   target       the element to highlight
 *   shape        "round" (an orange) or "box"
 *   text         Blob's line, read aloud too
 *   dragTo       an element: the arrow then shows the drag, from the
 *                target to here, and the child can try it for real
 *   onAdvance    a tap anywhere (or the bubble's button); it gets the
 *                point that was tapped, so a tap on the target can count
 *
 * In the drag beat the overlay lets touches through to the play area,
 * since that is what it's asking the child to do.
 */
export default function CoachMark({ target, shape = "box", text, dragTo = null, onAdvance }) {
  const [rects, setRects] = useState(null);
  const [bubbleAt, setBubbleAt] = useState(null);
  const bubbleRef = useRef(null);
  const buttonRef = useRef(null);
  const interactive = Boolean(dragTo);

  useReadAloud(text, SPEAKERS.blob.voice);

  // Where the target is, and keep up when the screen changes size.
  useLayoutEffect(() => {
    if (!target) return undefined;
    const measure = () =>
      setRects({
        target: target.getBoundingClientRect(),
        to: dragTo ? dragTo.getBoundingClientRect() : null,
        vw: window.innerWidth,
        vh: window.innerHeight,
      });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [target, dragTo]);

  // The bubble goes beside the target, on whichever side has room.
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!rects || !bubble) return;
    // Its layout size: while it pops in it is drawn smaller than it is.
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const { vw, vh } = rects;
    // In the drag beat the bubble keeps clear of the whole trip.
    const a = rects.target;
    const b = rects.to ?? a;
    const t = {
      left: Math.min(a.left, b.left),
      top: Math.min(a.top, b.top),
      right: Math.max(a.right, b.right),
      bottom: Math.max(a.bottom, b.bottom),
    };
    const cx = (t.left + t.right) / 2;
    const cy = (t.top + t.bottom) / 2;
    const clampX = (x) => Math.min(Math.max(x, EDGE), vw - bw - EDGE);
    const clampY = (y) => Math.min(Math.max(y, EDGE + 56), vh - bh - EDGE);
    const room = {
      right: vw - t.right - GAP - EDGE >= bw,
      left: t.left - GAP - EDGE >= bw,
      above: t.top - GAP - EDGE - 56 >= bh,
      below: vh - t.bottom - GAP - EDGE >= bh,
    };
    // Sideways reads best; the arrow is above, so the bubble goes below
    // before it goes above.
    if (room.right && (!room.left || cx < vw / 2)) setBubbleAt({ left: t.right + GAP, top: clampY(cy - bh / 2) });
    else if (room.left) setBubbleAt({ left: t.left - GAP - bw, top: clampY(cy - bh / 2) });
    else if (room.below) setBubbleAt({ left: clampX(cx - bw / 2), top: t.bottom + GAP });
    else if (room.above) setBubbleAt({ left: clampX(cx - bw / 2), top: t.top - GAP - bh });
    else setBubbleAt({ left: clampX(cx - bw / 2), top: clampY(vh - bh - EDGE) });
  }, [rects, text]);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, [text]);

  if (!rects) return null;

  const { target: t, to, vw, vh } = rects;
  const pad = shape === "round" ? 10 : 12;
  // The highlight, kept on screen even when the thing runs off its edge.
  const hole = {
    left: Math.max(t.left - pad, 4),
    top: Math.max(t.top - pad, 4),
    right: Math.min(t.right + pad, vw - 4),
    bottom: Math.min(t.bottom + pad, vh - 4),
  };
  const holeStyle = {
    left: hole.left,
    top: hole.top,
    width: hole.right - hole.left,
    height: hole.bottom - hole.top,
    borderRadius: shape === "round" ? "50%" : 28,
  };
  // The arrow points down at the target from above, or up from below
  // when there's no room above.
  const arrowUp = hole.top < 120;
  const arrowStyle = {
    left: (hole.left + hole.right) / 2 - 28,
    top: arrowUp ? hole.bottom + 6 : hole.top - 70,
  };

  const advance = (event) => onAdvance({ x: event.clientX, y: event.clientY });

  return (
    <div
      className={`pm-coach${interactive ? " is-interactive" : ""}`}
      onClick={interactive ? undefined : advance}
    >
      <div className="pm-coach__hole" style={holeStyle} aria-hidden="true" />

      {interactive && to ? (
        // A ghost orange making the trip, with the arrow riding on it.
        <div
          className="pm-coach__ghost"
          aria-hidden="true"
          style={{
            left: t.left,
            top: t.top,
            width: t.width,
            height: t.height,
            "--dx": `${to.left + to.width / 2 - (t.left + t.width / 2)}px`,
            "--dy": `${to.top + to.height * 0.35 - (t.top + t.height / 2)}px`,
          }}
        >
          <img src={ORANGE.src} alt="" draggable={false} />
          <Arrow className="pm-coach__arrow pm-coach__arrow--ghost" />
        </div>
      ) : (
        <Arrow
          className={`pm-coach__arrow${arrowUp ? " pm-coach__arrow--up" : ""}`}
          style={arrowStyle}
        />
      )}

      <div
        ref={bubbleRef}
        className="pm-coach__bubble"
        style={bubbleAt ?? { left: -9999, top: 0 }}
        onClick={(event) => {
          event.stopPropagation();
          onAdvance({ x: -1, y: -1 });
        }}
      >
        <img className="pm-coach__blob" src={SPEAKERS.blob.portrait} alt="" aria-hidden="true" draggable={false} />
        <p className="pm-coach__text" aria-live="polite">
          <span className="pm-sr-only">{SPEAKERS.blob.label} thinks: </span>
          {text}
        </p>
        <button ref={buttonRef} type="button" className="pm-coach__next" aria-label="Next">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="pm-coach__puff pm-coach__puff--1" aria-hidden="true" />
        <span className="pm-coach__puff pm-coach__puff--2" aria-hidden="true" />
      </div>
    </div>
  );
}

function Arrow({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 56 64" aria-hidden="true">
      <path
        d="M20 4h16v28h13L28 60 7 32h13z"
        fill="var(--pm-purple)"
        stroke="var(--pm-white)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
