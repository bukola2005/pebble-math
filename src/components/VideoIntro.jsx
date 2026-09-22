import { useEffect, useRef, useState } from "react";
import CTAButton from "./CTAButton";
import "./VideoIntro.css";

/* WebM first for the browsers that take it, MP4 for Safari and
   anything older. Same 10 seconds either way. */
const WEBM = "/video/intro.webm";
const MP4 = "/video/intro.mp4";
const POSTER = "/video/intro-poster.webp";

/**
 * The opening film: the market, the logo and the characters arriving.
 * It plays once, on the way into the game.
 *
 * Browsers only autoplay video that is muted, so it starts silent with
 * a sound toggle. Anyone can skip, and anyone who has asked for less
 * motion gets the still frame and a play button instead.
 */
export default function VideoIntro({ onDone }) {
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

  return (
    <div className="pm-video">
      <div className="pm-video__frame">
        <video
          ref={video}
          className="pm-video__el"
          poster={POSTER}
          width="1280"
          height="720"
          muted
          playsInline
          preload="auto"
          onEnded={onDone}
        >
          <source src={WEBM} type="video/webm" />
          <source src={MP4} type="video/mp4" />
        </video>

        {waiting && (
          <button type="button" className="pm-video__play" onClick={play}>
            <span className="pm-sr-only">Play the Pebble Math intro</span>
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
        <CTAButton variant="secondary" size="sm" onClick={onDone}>
          Skip intro
        </CTAButton>
      </div>
    </div>
  );
}
