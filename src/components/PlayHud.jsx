import { useNavigate } from "react-router-dom";
import { getZiziLook } from "../data/zizi";
import { canSpeak, setMuted, useMuted } from "../lib/speech";
import "./PlayHud.css";

/**
 * The corners of every play screen: a small way out on the left, and on
 * the right the child's game name (the one place it is shown) with the
 * sound switch: reading aloud and the game's few sounds.
 */
export default function PlayHud({ player }) {
  const navigate = useNavigate();
  const muted = useMuted();
  const zizi = getZiziLook(player.character);

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
          <p className="pm-hud__name">
            <img src={zizi.src} alt="" aria-hidden="true" draggable={false} />
            <span>{player.game_name}</span>
          </p>
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
    </div>
  );
}
