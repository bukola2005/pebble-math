import { useEffect, useState } from "react";
import { after, cancel } from "../lib/pause";
import { playLockOpen } from "../lib/sound";
import "./LockChain.css";

/*
  Mum's chain and its padlocks (LOCK_COUNT in data/market.js), drawn in
  SVG so it needs no artwork.

    total     how many locks
    open      how many are already open (from the left)
    opening   which lock to open now, with its little scene: the key
              turns, the shackle springs, a soft sound, and the lock falls
              away. -1 for none.
    small     the card version: no sagging chain, locks in a row

  An open lock is drawn open; one that has just fallen away is gone. As
  the shackle springs, a handful of sparkles fly out from it, the same
  ones the basket sends (BasketGame.jsx). Without motion
  (prefers-reduced-motion) the same steps happen, just without anything
  moving, and without the sparkles.
*/

const LINK_GAP = 22;

/*
  Six four-point stars, alternately white and lavender (never orange),
  that scatter a little from the shackle and then fly outwards, all within
  half a second. [direction x, direction y] for each.
*/
const SPARKLE_DIRECTIONS = [
  [-1, -0.55],
  [-0.4, -1],
  [0.35, -1],
  [1, -0.6],
  [-0.95, 0.35],
  [0.9, 0.4],
];
const STAR = "M0 -14 L3.3 -3.3 L14 0 L3.3 3.3 L0 14 L-3.3 3.3 L-14 0 L-3.3 -3.3 Z";

function Sparkles() {
  return SPARKLE_DIRECTIONS.map(([x, y], i) => (
    <path
      key={i}
      className={`pm-lock-sparkle${i % 2 ? " pm-lock-sparkle--lavender" : ""}`}
      d={STAR}
      style={{
        "--mx": `${x * 22}px`,
        "--my": `${y * 22}px`,
        "--dx": `${x * 95}px`,
        "--dy": `${y * 95}px`,
        animationDelay: `${i * 10}ms`,
      }}
    />
  ));
}

function Padlock({ x, y, state, sparkle }) {
  return (
    <g className={`pm-lock pm-lock--${state}`} transform={`translate(${x} ${y})`}>
      <g className="pm-lock__swing">
        {/* Closed: both legs in the body. Open: one leg out, raised. */}
        <path className="pm-lock__shackle pm-lock__shackle--closed" d="M -13 30 V 14 a 13 13 0 0 1 26 0 V 30" />
        <path className="pm-lock__shackle pm-lock__shackle--open" d="M -13 30 V 2 a 13 13 0 0 1 26 0 V 10" />
        <rect className="pm-lock__body" x="-22" y="26" width="44" height="38" rx="9" />
        <rect className="pm-lock__shine" x="-16" y="30" width="8" height="26" rx="4" />
        <circle className="pm-lock__hole" cx="0" cy="42" r="5" />
        <rect className="pm-lock__hole pm-lock__slot" x="-2" y="44" width="4" height="10" rx="2" />
      </g>
      {/* Outside the swing, so they don't fall with the lock. */}
      {sparkle && (
        <g transform="translate(0 16)" aria-hidden="true">
          <Sparkles />
        </g>
      )}
    </g>
  );
}

export default function LockChain({ total = 7, open = 0, opening = -1, small = false }) {
  // closed → turning → open (sound) → falling → gone
  const [stage, setStage] = useState(opening >= 0 ? "closed" : null);

  useEffect(() => {
    if (opening < 0) return undefined;
    const steps = [
      [1100, "turning"],
      [1700, "open"],
      [2500, "falling"],
      [3500, "gone"],
    ];
    const timers = steps.map(([ms, next]) =>
      after(() => {
        setStage(next);
        if (next === "open") playLockOpen();
      }, ms)
    );
    return () => timers.forEach(cancel);
  }, [opening]);

  const width = 520;
  const spacing = width / total;
  const xs = Array.from({ length: total }, (_, i) => spacing * (i + 0.5));
  // The chain sags gently between its two ends.
  const sag = small ? 0 : 18;
  const chainY = (x) => 30 + sag * Math.sin((Math.PI * x) / width);
  const links = [];
  for (let x = 6, i = 0; x < width - 6; x += LINK_GAP, i++) links.push({ x, y: chainY(x), flat: i % 2 === 0 });

  const stateOf = (i) => {
    if (i === opening) return stage ?? "closed";
    return i < open ? "open" : "closed";
  };

  return (
    <svg
      className={`pm-chain${small ? " pm-chain--small" : ""}`}
      viewBox={`0 0 ${width} ${small ? 100 : 130}`}
      role="img"
      aria-label={`${open + (stage === "open" || stage === "falling" || stage === "gone" ? 1 : 0)} of ${total} locks open`}
    >
      <defs>
        <linearGradient id="pm-lock-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6cf6b" />
          <stop offset="1" stopColor="#c48a2c" />
        </linearGradient>
      </defs>

      {!small &&
        links.map((link, i) => (
          <ellipse
            key={i}
            className="pm-chain__link"
            cx={link.x + LINK_GAP / 2}
            cy={link.y}
            rx={LINK_GAP * 0.62}
            ry={link.flat ? 7 : 2.5}
          />
        ))}

      {xs.map((x, i) => (
        <Padlock
          key={i}
          x={x}
          y={small ? 8 : chainY(x) - 6}
          state={stateOf(i)}
          sparkle={i === opening && stage === "open"}
        />
      ))}
    </svg>
  );
}
