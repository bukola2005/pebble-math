import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CTAButton from "../components/CTAButton";
import PlayerAvatar from "../components/PlayerAvatar";
import { listPlayers } from "../lib/players";
import { playPick } from "../lib/sound";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import "./Play.css";

/**
 * "Who's playing?" — the screen a grown-up hands to a child.
 *
 * Built for a child, not an adult: one big card per child, their monster
 * and their name, and nothing else to read or manage. No sign-out, no
 * settings, nothing to type. The device stays signed in as the grown-up;
 * the only way back to the dashboard is a small link in the corner.
 *
 * The cards sit still. Tapping one is like picking a player in a game:
 * that monster squashes, hops and lands with a burst of sparkles behind
 * it and a small sound (Play.css, lib/sound.js), and then their game
 * starts.
 */

// How long the chosen card celebrates before the game starts (Play.css: pm-pick-hop).
const PICK_MS = 600;

// The sparkles behind a chosen monster: eight, all the way round.
const BURST = [0, 45, 90, 135, 180, 225, 270, 315];

function PickBurst() {
  return (
    <span className="pm-pick__burst" aria-hidden="true">
      {BURST.map((angle, i) => (
        <svg
          key={angle}
          className={`pm-pick__star${i % 2 ? " pm-pick__star--deep" : ""}`}
          viewBox="0 0 20 20"
          style={{ "--angle": `${angle}deg` }}
        >
          <path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" />
        </svg>
      ))}
    </span>
  );
}

export default function Play() {
  // status: "loading" | "ready" | "error"
  const [data, setData] = useState({ status: "loading", players: [] });
  const [attempt, setAttempt] = useState(0);
  const [chosen, setChosen] = useState(null);
  const navigate = useNavigate();
  const pickTimer = useRef(0);

  useDocumentTitle("Who’s playing?");

  useEffect(() => {
    let active = true;

    // Row Level Security returns only this account's children.
    listPlayers()
      .then(({ data: players, error }) => {
        if (!active) return;
        setData(error ? { status: "error", players: [] } : { status: "ready", players });
      })
      .catch(() => {
        if (active) setData({ status: "error", players: [] });
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => () => window.clearTimeout(pickTimer.current), []);

  // One tap chooses: the card celebrates, then the game starts. Taps after
  // that do nothing. A grown-up's Ctrl-click or middle-click still opens
  // the game in a new tab, as a link would.
  const pick = (event, player) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (chosen) return;
    setChosen(player.id);
    playPick();
    pickTimer.current = window.setTimeout(() => navigate(`/play/${player.id}`), PICK_MS);
  };

  const { status, players } = data;

  return (
    <div className="pm-play">
      <Link className="pm-play__grownups" to="/dashboard">
        Back to dashboard
      </Link>

      <main id="main" className="pm-play__main">
        <h1 className="pm-play__title">Who’s playing?</h1>

        {status === "loading" && (
          <p className="pm-play__note" role="status">
            Loading…
          </p>
        )}

        {status === "error" && (
          <div className="pm-play__panel">
            <p className="pm-play__note" role="alert">
              We couldn’t load the players.
            </p>
            <CTAButton
              onClick={() => {
                setData({ status: "loading", players: [] });
                setAttempt((n) => n + 1);
              }}
            >
              Try again
            </CTAButton>
          </div>
        )}

        {/* Read by the grown-up, so ordinary words are fine here. */}
        {status === "ready" && players.length === 0 && (
          <div className="pm-play__panel">
            <p className="pm-play__note">No children have been added yet.</p>
            <Link className="pm-play__link" to="/dashboard">
              Add a child on the dashboard
            </Link>
          </div>
        )}

        {status === "ready" && players.length > 0 && (
          <ul className="pm-play__cards">
            {players.map((player) => (
              <li key={player.id}>
                <Link
                  className={`pm-pick${chosen === player.id ? " is-chosen" : ""}`}
                  to={`/play/${player.id}`}
                  onClick={(event) => pick(event, player)}
                >
                  <span className="pm-pick__hero">
                    {chosen === player.id && <PickBurst />}
                    <PlayerAvatar player={player} className="pm-pick__avatar" eager />
                  </span>
                  <span className="pm-pick__name">{player.display_name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
