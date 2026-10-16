import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CTAButton from "../components/CTAButton";
import PlayerCard from "../components/PlayerCard";
import PlayerForm from "../components/PlayerForm";
import { useAuth } from "../context/AuthContext";
import { listPlayers } from "../lib/players";
import { supabase } from "../lib/supabase";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import "./Dashboard.css";

const ROLE_LABELS = { parent: "Parent", teacher: "Teacher" };

/**
 * The signed-in adult's home: a greeting, and the players (children) under
 * their account, with a way to add and delete them. "Play" hands the device
 * to a child: it opens "Who's playing?" at /play, still signed in as the
 * grown-up.
 */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  // status: "loading" | "ready" | "error"
  const [data, setData] = useState({ status: "loading", profile: null, players: [] });
  // Bumped by "Try again" to run the fetch once more.
  const [attempt, setAttempt] = useState(0);
  const [adding, setAdding] = useState(false);
  // Read out by screen readers when a player is added or deleted.
  const [announcement, setAnnouncement] = useState("");

  const addButton = useRef(null);
  const heading = useRef(null);
  // Bumped when the form closes, so focus can go back to the Add button.
  const [formClosed, setFormClosed] = useState(0);

  useDocumentTitle("Dashboard");

  useEffect(() => {
    let active = true;

    // Row Level Security decides what comes back: only this account's own
    // profile and players. There is no client-side filter to forget.
    Promise.all([
      supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle(),
      listPlayers(),
    ])
      .then(([profile, players]) => {
        if (!active) return;
        if (profile.error || players.error) {
          setData({ status: "error", profile: null, players: [] });
        } else {
          setData({
            status: "ready",
            profile: profile.data,
            players: players.data,
          });
        }
      })
      .catch(() => {
        if (active) setData({ status: "error", profile: null, players: [] });
      });

    return () => {
      active = false;
    };
  }, [user.id, attempt]);

  // The Add button is a different element before and after the first player
  // exists, so focus is restored once the form has gone and the new one is in.
  useEffect(() => {
    if (formClosed > 0) addButton.current?.focus();
  }, [formClosed]);

  const retry = () => {
    setData((prev) => ({ ...prev, status: "loading" }));
    setAttempt((n) => n + 1);
  };

  const closeForm = () => {
    setAdding(false);
    setFormClosed((n) => n + 1);
  };

  const handleAdded = (player) => {
    setData((prev) => ({ ...prev, players: [...prev.players, player] }));
    setAnnouncement(`${player.display_name} was added.`);
    closeForm();
  };

  const handleDeleted = (player) => {
    setData((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== player.id),
    }));
    setAnnouncement(`${player.display_name} was deleted.`);
    // The card that had focus is gone; land on the list's heading.
    heading.current?.focus();
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // Signing out clears the session; ProtectedRoute then sends the
      // visitor to /signin.
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const { status, profile, players } = data;
  // The profile row is created by a database trigger at sign-up. If it's
  // missing (an account made before the SQL was run) we still greet them.
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const roleLabel = ROLE_LABELS[profile?.role];

  const showActions = status === "ready" && players.length > 0 && !adding;
  const showEmptyState = status === "ready" && players.length === 0 && !adding;

  return (
    <div className="pm-dash">
      <header className="pm-dash__bar">
        <Link to="/" className="pm-dash__mark">
          Pebble Math
        </Link>
        <div className="pm-dash__account">
          {/* Which account this is, for anyone who has more than one (a
              home account and a school one, say). Orientation, nothing more. */}
          <p className="pm-dash__email" title={user.email}>
            <span className="pm-sr-only">Signed in as </span>
            {user.email}
          </p>
          <CTAButton
            variant="secondary"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </CTAButton>
        </div>
      </header>

      <main id="main" className="pm-dash__main">
        {roleLabel && <p className="pm-dash__eyebrow">{roleLabel} account</p>}
        <h1 className="pm-dash__title">
          {firstName ? `Hello, ${firstName}.` : "Hello."}
        </h1>

        <section className="pm-dash__section" aria-labelledby="players-heading">
          <div className="pm-dash__head">
            <h2
              id="players-heading"
              ref={heading}
              tabIndex={-1}
              className="pm-dash__h2"
            >
              Players
            </h2>
            {showActions && (
              <div className="pm-dash__actions">
                <CTAButton
                  ref={addButton}
                  variant="secondary"
                  size="sm"
                  onClick={() => setAdding(true)}
                >
                  Add a player
                </CTAButton>
                <CTAButton size="sm" onClick={() => navigate("/play")}>
                  Play
                </CTAButton>
              </div>
            )}
          </div>

          <p className="pm-sr-only" role="status">
            {announcement}
          </p>

          {status === "loading" && (
            <p className="pm-dash__muted" role="status">
              Loading players…
            </p>
          )}

          {status === "error" && (
            <div className="pm-dash__panel">
              <p className="pm-dash__alert" role="alert">
                We couldn’t load your players. Check your connection and try
                again.
              </p>
              <CTAButton variant="secondary" size="sm" onClick={retry}>
                Try again
              </CTAButton>
            </div>
          )}

          {showEmptyState && (
            <div className="pm-dash__panel">
              <p className="pm-dash__empty-title">No players yet.</p>
              <p className="pm-dash__muted">
                No child has been added to this account. Add one with a
                nickname and an age band; they pick their own character the
                first time they play. Children never need an email or a
                password.
              </p>
              <CTAButton ref={addButton} onClick={() => setAdding(true)}>
                Add a player
              </CTAButton>
            </div>
          )}

          {status === "ready" && adding && (
            <PlayerForm
              userId={user.id}
              onAdded={handleAdded}
              onCancel={closeForm}
            />
          )}

          {status === "ready" && players.length > 0 && (
            <ul className="pm-dash__players">
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onDeleted={handleDeleted}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
