import { useEffect, useState } from "react";
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

  An open lock is drawn open; one that has just fallen away is gone.
  Without motion (prefers-reduced-motion) the same steps happen, just
  without anything moving.
*/

const LINK_GAP = 22;

function Padlock({ x, y, state }) {
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
      window.setTimeout(() => {
        setStage(next);
        if (next === "open") playLockOpen();
      }, ms)
    );
    return () => timers.forEach(window.clearTimeout);
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
        <Padlock key={i} x={x} y={small ? 8 : chainY(x) - 6} state={stateOf(i)} />
      ))}
    </svg>
  );
}
