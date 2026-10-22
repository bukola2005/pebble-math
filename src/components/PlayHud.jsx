import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NUMBER_WORDS, capitalise } from "../data/dialogue";
import { getZiziLook } from "../data/zizi";
import { canSpeak, setMuted, useMuted } from "../lib/speech";
import ProfilePanel from "./ProfilePanel";
import "./PlayHud.css";

/**
 * The corners of every play screen: a small way out on the left, and on
 * the right the child's game name (the one place it is shown) with the
 * sound switch: reading aloud and the game's few sounds.
 *
 * Tapping the name opens the child's profile over the game, which pauses
 * until it closes (ProfilePanel). `earned` is what it shows them as
 * having: the stall_progress ids they have cleared, today's included;
 * `lanterns` how many lanterns, today's included (null if unknown).
 *
 * At a stall, `meter` adds the progress meter: a ring around the child's
 * face, one segment per round with small gaps between, filling clockwise
 * from the top in solid lavender as each is answered.
 *   { total, filled, glow, ref }   `glow` while the last one has just
 *                                  filled; `ref` for the sparkles to aim at
 * It only ever says how far through the child is: no number, no score.
 */

// The ring, in its own 44-unit box: its middle, radius and width.
const RING = { c: 22, r: 19.5, w: 4, gap: 3 };

function MeterRing({ total, filled }) {
  const around = 2 * Math.PI * RING.r;
  const each = around / total;
  const gap = total > 1 ? RING.gap : 0;
  return (
    <svg className="pm-hud__ring" viewBox="0 0 44 44" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <circle
          key={i}
          className={`pm-hud__segment${i < filled ? " is-on" : ""}`}
          cx={RING.c}
          cy={RING.c}
          r={RING.r}
          strokeWidth={RING.w}
          strokeDasharray={`${each - gap} ${around - each + gap}`}
          strokeDashoffset={-(i * each + gap / 2)}
          transform={`rotate(-90 ${RING.c} ${RING.c})`}
        />
      ))}
    </svg>
  );
}

/** Where each segment's middle is, for the sparkles that fly into it. */
function SegmentMarks({ total }) {
  return Array.from({ length: total }, (_, i) => {
    const angle = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / total;
    return (
      <span
        key={i}
        className="pm-hud__mark"
        data-segment={i}
        style={{
          left: `${((RING.c + RING.r * Math.cos(angle)) / 44) * 100}%`,
          top: `${((RING.c + RING.r * Math.sin(angle)) / 44) * 100}%`,
        }}
      />
    );
  });
}
export default function PlayHud({
  player,
  meter = null,
  earned = player.cleared_stalls ?? [],
  lanterns = player.lanterns ?? null,
}) {
  const navigate = useNavigate();
  const muted = useMuted();
  const zizi = getZiziLook(player.character);
  const [profileOpen, setProfileOpen] = useState(false);
  const nameRef = useRef(null);

  const closeProfile = () => {
    setProfileOpen(false);
    // The dialog gives the focus back itself; where it can't, the name has it.
    if (document.activeElement === document.body) nameRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="pm-hud">
      <button
        type="button"
        className="pm-hud__button"
        onClick={() => navigate("/play")}
        aria-label="Back to Who’s playing?"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="pm-hud__right">
        {player.game_name && (
          <div className="pm-hud__name">
            {meter ? (
              <span
                ref={meter.ref}
                className={`pm-hud__face${meter.glow ? " is-glowing" : ""}`}
                role="progressbar"
                aria-label="How far through"
                aria-valuemin={0}
                aria-valuemax={meter.total}
                aria-valuenow={meter.filled}
                aria-valuetext={
                  meter.filled >= meter.total
                    ? "All done"
                    : `${capitalise(NUMBER_WORDS[meter.filled])} done, ${NUMBER_WORDS[meter.total - meter.filled]} to go`
                }
              >
                <MeterRing total={meter.total} filled={meter.filled} />
                <img src={zizi.src} alt="" aria-hidden="true" draggable={false} />
                <SegmentMarks total={meter.total} />
              </span>
            ) : (
              <img src={zizi.src} alt="" aria-hidden="true" draggable={false} />
            )}
            <span className="pm-hud__game-name">{player.game_name}</span>
            {/* Over the whole chip, so the meter inside it stays a meter. */}
            <button
              ref={nameRef}
              type="button"
              className="pm-hud__open"
              aria-label={`${player.game_name}: open profile`}
              aria-haspopup="dialog"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen(true)}
            />
          </div>
        )}

        {/* Only where the browser can actually read aloud. */}
        {canSpeak && (
          <button
            type="button"
            className="pm-hud__button"
            aria-label="Sound"
            aria-pressed={!muted}
            onClick={() => setMuted(!muted)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              {muted ? (
                <path d="m15.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              ) : (
                <path
                  d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        )}
      </div>

      {profileOpen && (
        <ProfilePanel player={player} zizi={zizi} earned={earned} lanterns={lanterns} onClose={closeProfile} />
      )}
    </div>
  );
}
