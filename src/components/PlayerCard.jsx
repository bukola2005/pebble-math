import { useEffect, useId, useRef, useState } from "react";
import CTAButton from "./CTAButton";
import { getCharacter } from "../data/characters";
import { getAgeBandLabel, getClassLevelLabel } from "../data/players";
import { deletePlayer, playerErrorMessage } from "../lib/players";
import "./PlayerCard.css";

/**
 * One player on the dashboard: character, display name, age band, and class
 * level if there is one. Deleting asks first, in the card itself.
 *
 * `onDeleted` is called only once the database confirms the row is gone.
 */
export default function PlayerCard({ player, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const deleteButton = useRef(null);
  const keepButton = useRef(null);
  const wasConfirming = useRef(false);
  const questionId = useId();

  const character = getCharacter(player.character);
  const meta = [
    getAgeBandLabel(player.age_band),
    getClassLevelLabel(player.class_level),
  ]
    .filter(Boolean)
    .join(" · ");

  // Focus follows the question: into it when it opens (on "Keep", the safe
  // answer), and back to the Delete button when it is dismissed.
  useEffect(() => {
    if (confirming) keepButton.current?.focus();
    else if (wasConfirming.current) deleteButton.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  // After a failed delete both buttons come back; put focus on the safe one.
  useEffect(() => {
    if (error) keepButton.current?.focus();
  }, [error]);

  const confirmDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const { error: failure } = await deletePlayer(player.id);
      if (failure) setError(playerErrorMessage(failure));
      else onDeleted(player);
    } catch {
      setError(playerErrorMessage());
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li className="pm-player">
      <img
        className="pm-player__avatar"
        src={character.src}
        alt=""
        aria-hidden="true"
        width={character.w}
        height={character.h}
        loading="lazy"
        decoding="async"
      />

      <div className="pm-player__info">
        <p className="pm-player__name">{player.display_name}</p>
        {meta && <p className="pm-player__meta">{meta}</p>}
      </div>

      {!confirming && (
        <CTAButton
          ref={deleteButton}
          variant="secondary"
          size="sm"
          aria-label={`Delete ${player.display_name}`}
          onClick={() => setConfirming(true)}
        >
          Delete
        </CTAButton>
      )}

      {confirming && (
        <div
          className="pm-player__confirm"
          role="group"
          aria-labelledby={questionId}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !deleting) setConfirming(false);
          }}
        >
          <p id={questionId} className="pm-player__question">
            Delete {player.display_name}? This removes their player for good
            and can’t be undone.
          </p>

          {error && (
            <p className="pm-player__error" role="alert">
              {error}
            </p>
          )}

          <div className="pm-player__actions">
            <CTAButton
              variant="secondary"
              size="sm"
              className="pm-player__danger"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </CTAButton>
            <CTAButton
              ref={keepButton}
              variant="secondary"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Keep
            </CTAButton>
          </div>
        </div>
      )}
    </li>
  );
}
