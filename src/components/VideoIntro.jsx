import { useEffect, useRef, useState } from "react";
import CTAButton from "./CTAButton";
import { INTRO_FILM } from "../data/media";
import "./VideoIntro.css";

/**
 * The opening film, on a child's first play: the girl and her mother in the
 * market, the purple mist, and the Pebble characters arriving. 22 seconds.
 *
 * `src` is the copy the loading screen already downloaded (a blob: URL), so
 * it plays straight from memory. Without one, the browser picks WebM or MP4
 * from INTRO_FILM itself.
 *
 * Browsers only autoplay video that is muted, so it starts silent with a
 * sound toggle. Anyone can skip at any point, and anyone who has asked for
 * less motion gets the still frame and a play button instead. If the film
 * can't be played at all, it moves on rather than leaving a child stuck.
 */
export default function VideoIntro({ onDone, src }) {
  const video = useRef(null);
  const [sound, setSound] = useState(false);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [waiting, setWaiting] = useState(reduceMotion);

  // If autoplay is refused for any other reason, show the play button
  // rather than a frozen frame.
  useEffect(() => {
    if (reduceMotion) return;
    video.current?.play().catch(() => setWaiting(true));
  }, [reduceMotion]);

  const play = () => {
    setWaiting(false);
    video.current?.play();
  };

  const toggleSound = () => {
    const el = video.current;
    if (!el) return;
    el.muted = !el.muted;
    setSound(!el.muted);
  };

  const lastSource = INTRO_FILM.sources.length - 1;

  return (
    <div className="pm-video">
      <div className="pm-video__frame">
        <video
          ref={video}
          className="pm-video__el"
          src={src}
          poster={INTRO_FILM.poster}
          width={INTRO_FILM.width}
          height={INTRO_FILM.height}
          muted
          playsInline
          preload="auto"
          onEnded={onDone}
          // Fires for a broken `src`.
          onError={onDone}
        >
          {!src &&
            INTRO_FILM.sources.map((source, i) => (
              <source
                key={source.src}
                src={source.src}
                type={source.type}
                // Only once every source has failed is there nothing to play.
                onError={i === lastSource ? onDone : undefined}
              />
            ))}
        </video>

        {waiting && (
          <button type="button" className="pm-video__play" onClick={play}>
            <span className="pm-sr-only">Play the Pebble Math film</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>

      <div className="pm-video__bar">
        <button type="button" className="pm-video__sound" onClick={toggleSound}>
          {sound ? "Turn sound off" : "Turn sound on"}
        </button>
        {/* Full size, not the small button: this one is for a child to find. */}
        <CTAButton variant="secondary" onClick={onDone}>
          Skip intro
        </CTAButton>
      </div>
    </div>
  );
}
