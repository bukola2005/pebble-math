import { useEffect, useRef, useState } from "react";
import CTAButton from "./CTAButton";
import { INTRO_FILM } from "../data/media";
import "./VideoIntro.css";

/**
 * The opening film, full screen, on a child's first play: Zizi and her mum
 * in the market, the purple haze, and Mum taken. 22 seconds.
 *
 * It waits behind "Tap to begin". Browsers only play sound after the
 * person has tapped something, and that tap is it, so the film plays with
 * its sound on. Skip is there from the very first second, before and
 * during the film.
 *
 * `src` is the copy the loading screen already downloaded (a blob: URL), so
 * it plays straight from memory. Without one, the browser picks WebM or MP4
 * from INTRO_FILM itself. If the film can't be played at all, it moves on
 * rather than leaving a child stuck.
 */
export default function VideoIntro({ onDone, src }) {
  const video = useRef(null);
  const beginButton = useRef(null);
  const [started, setStarted] = useState(false);

  // Keyboard users start on the one thing there is to do.
  useEffect(() => {
    beginButton.current?.focus();
  }, []);

  const begin = async () => {
    const el = video.current;
    if (!el) return;
    setStarted(true);
    el.muted = false;
    try {
      await el.play();
    } catch {
      // Very rarely refused even after a tap (some battery savers). Better
      // to play silently than not at all.
      el.muted = true;
      try {
        await el.play();
      } catch {
        setStarted(false);
      }
    }
  };

  const lastSource = INTRO_FILM.sources.length - 1;

  return (
    <div className="pm-film">
      <video
        ref={video}
        className="pm-film__video"
        src={src}
        poster={INTRO_FILM.poster}
        width={INTRO_FILM.width}
        height={INTRO_FILM.height}
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

      {!started && (
        <button
          ref={beginButton}
          type="button"
          className="pm-film__begin"
          onClick={begin}
        >
          <span className="pm-film__begin-label">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
            Tap to begin
          </span>
        </button>
      )}

      <CTAButton variant="secondary" className="pm-film__skip" onClick={onDone}>
        Skip
      </CTAButton>
    </div>
  );
}
