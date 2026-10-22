import { useEffect, useRef } from "react";
import { shelfFor } from "../data/rewards";
import { setPaused } from "../lib/pause";
import { RewardPicture } from "./RewardItems";
import "./ProfilePanel.css";

/*
  The child's profile, over the game: opened by tapping their name in the
  top corner (PlayHud). Their Zizi, large, their game name, and their
  things, under the place each came from, with an empty space, a grey
  outline and a question mark, for each thing still to find, and the
  places not open yet locked. Seeing two filled and four empty, a child
  knows there is more to come: that is what this screen is for.

  The game pauses while it is open (lib/pause.js) and goes on exactly
  where it was when it closes: with the close button, Escape, or a tap
  outside it. A native <dialog>, so the game behind can't be touched and
  the focus stays inside it.
*/

const LOCK = (
  <svg className="pm-profile__lock" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
  </svg>
);

export default function ProfilePanel({ player, zizi, earned, onClose }) {
  const ref = useRef(null);

  // The panel's own entrance goes on while the game holds.
  useEffect(() => {
    const dialog = ref.current;
    setPaused(true, dialog);
    if (dialog.open) return () => setPaused(false);
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute("open", "");
    return () => setPaused(false);
  }, []);

  // Closing the dialog (any way) puts the focus back on the name.
  const close = () => {
    if (ref.current?.close) ref.current.close();
    else onClose();
  };

  const shelf = shelfFor(earned);

  return (
    <dialog
      ref={ref}
      className="pm-profile"
      aria-labelledby="pm-profile-name"
      onClose={onClose}
      onClick={(event) => {
        // A tap outside the card, on the dimmed game.
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="pm-profile__card">
        <button type="button" className="pm-profile__close" aria-label="Close" onClick={close}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6.5 6.5 11 11m0-11-11 11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>

        <div className="pm-profile__who">
          <div className="pm-profile__figure">
            <img src={zizi.src} width={zizi.w} height={zizi.h} alt="" draggable={false} />
          </div>
          <h2 id="pm-profile-name" className="pm-profile__name">
            {player.game_name}
          </h2>
        </div>

        <div className="pm-profile__things">
          {shelf.map((place, p) => (
            <section
              key={place.place}
              className={`pm-profile__place${place.locked ? " is-locked" : ""}`}
              aria-labelledby={`pm-profile-place-${p}`}
            >
              <h3 id={`pm-profile-place-${p}`} className="pm-profile__from">
                {place.locked && LOCK}
                From {place.place}
                {place.locked && <span className="pm-sr-only"> (not open yet)</span>}
              </h3>
              <ul className="pm-profile__spaces">
                {place.spaces.map((item, i) =>
                  item ? (
                    <li key={item.id} className="pm-profile__item">
                      <span className="pm-profile__picture">
                        <RewardPicture id={item.id} />
                      </span>
                      <span className="pm-profile__item-name">{item.name}</span>
                    </li>
                  ) : (
                    <li key={`empty-${i}`} className="pm-profile__item is-empty">
                      <span className="pm-profile__question" aria-hidden="true">
                        ?
                      </span>
                      <span className="pm-sr-only">Still to find</span>
                    </li>
                  )
                )}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
}
