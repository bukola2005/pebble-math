import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CTAButton from "../components/CTAButton";
import PlayerAvatar from "../components/PlayerAvatar";
import { listPlayers } from "../lib/players";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import "./Play.css";

/**
 * "Who's playing?" — the screen a grown-up hands to a child.
 *
 * Built for a child, not an adult: one big card per child, their monster
 * and their name, and nothing else to read or manage. No sign-out, no
 * settings, nothing to type. The device stays signed in as the grown-up;
 * the only way back to the dashboard is a small link in the corner.
 */
export default function Play() {
  // status: "loading" | "ready" | "error"
  const [data, setData] = useState({ status: "loading", players: [] });
  const [attempt, setAttempt] = useState(0);

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
                <Link className="pm-pick" to={`/play/${player.id}`}>
                  <PlayerAvatar player={player} className="pm-pick__avatar" eager />
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
