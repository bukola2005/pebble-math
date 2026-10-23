import { useEffect, useRef } from "react";
import { friendsFor } from "../data/friends";
import { LANTERN, lanternsShown } from "../data/lanterns";
import { rewardsFor } from "../data/rewards";
import { setPaused } from "../lib/pause";
import { RewardPicture } from "./RewardItems";
import "./ProfilePanel.css";

/*
  The child's profile, over the game: opened by tapping their name in the
  top corner (PlayHud). Their face and game name, then the three things
  the story counts (docs/story.md):

    Friends    seven, Blob first, the rest dark silhouettes until they
               join. First and biggest: it is how close the child is to
               finding their mother.
    Lanterns   lit for the ones they have, dark for the ones still needed
               to open the next place.
    Keepsakes  Grandma's gifts, only the ones they have. Not a set: never
               an empty space.

  `earned` is the stall_progress ids they have; `lanterns` how many
  lanterns they have earned (null when that couldn't be read: the section
  is left out rather than show none), and `spent` how many have opened
  places on the map.

  The game pauses while it is open (lib/pause.js) and goes on exactly
  where it was when it closes: with the close button, Escape, or a tap
  outside it. A native <dialog>, so the game behind can't be touched and
  the focus stays inside it.
*/

export default function ProfilePanel({ player, zizi, earned, lanterns, spent = 0, onClose }) {
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

  const friends = friendsFor(earned);
  const lamps = lanterns == null ? null : lanternsShown(lanterns, spent);
  const keepsakes = rewardsFor(earned);

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
          <img className="pm-profile__face" src={zizi.src} alt="" draggable={false} />
          <h2 id="pm-profile-name" className="pm-profile__name">
            {player.game_name}
          </h2>
        </div>

        <section className="pm-profile__friends" aria-labelledby="pm-profile-friends">
          <h3 id="pm-profile-friends" className="pm-profile__heading">
            Friends
          </h3>
          <ul className="pm-profile__friend-row">
            {friends.map((friend) =>
              friend.joined ? (
                <li key={friend.id} className="pm-profile__friend is-here">
                  <img src={friend.art.src} width={friend.art.w} height={friend.art.h} alt="" draggable={false} />
                  <span className="pm-profile__friend-name">{friend.name}</span>
                </li>
              ) : (
                <li key={friend.id} className="pm-profile__friend is-coming">
                  <img src={friend.unknown.src} alt="" draggable={false} />
                  <span className="pm-sr-only">Not met yet</span>
                </li>
              )
            )}
          </ul>
          <p className="pm-profile__caption">Blob’s friends are helping us look.</p>
        </section>

        <div className="pm-profile__pair">
          {lamps && (
            <section className="pm-profile__lanterns" aria-labelledby="pm-profile-lanterns">
              <h3 id="pm-profile-lanterns" className="pm-profile__heading">
                Lanterns
              </h3>
              <ul className="pm-profile__lantern-row">
                {Array.from({ length: lamps.lit }, (_, i) => (
                  <li key={`lit-${i}`} className="pm-profile__lantern is-lit">
                    <img src={LANTERN.lit.src} width={LANTERN.lit.w} height={LANTERN.lit.h} alt="" draggable={false} />
                    <span className="pm-sr-only">Lit</span>
                  </li>
                ))}
                {Array.from({ length: lamps.dark }, (_, i) => (
                  <li key={`dark-${i}`} className="pm-profile__lantern is-dark">
                    <img src={LANTERN.unlit.src} width={LANTERN.unlit.w} height={LANTERN.unlit.h} alt="" draggable={false} />
                    <span className="pm-sr-only">Not lit yet</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {keepsakes.length > 0 && (
            <section className="pm-profile__keepsakes" aria-labelledby="pm-profile-keepsakes">
              <h3 id="pm-profile-keepsakes" className="pm-profile__heading">
                Keepsakes
              </h3>
              <ul className="pm-profile__keepsake-row">
                {keepsakes.map((item) => (
                  <li key={item.id} className="pm-profile__item">
                    <span className="pm-profile__picture">
                      <RewardPicture id={item.id} />
                    </span>
                    <span className="pm-profile__item-name">{item.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </dialog>
  );
}
