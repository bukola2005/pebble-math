import { useEffect, useRef, useState } from "react";
import { LOADING_ART } from "../data/media";
import "./PlayLoading.css";

const sum = (list) => list.reduce((total, n) => total + n, 0);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * The loading screen between "Who's playing?" and the game: full screen,
 * the moment Zizi and her mum are pulled apart, with a slim bar low down.
 * It is a story beat as much as a wait: the first picture a child sees,
 * and it tells them what the game is about.
 *
 * `tasks` is a list of `{ weight, run(report, signal) }`, or null while the
 * list isn't known yet. `run` does the real work and calls
 * `report(loaded, total)` as it goes; `weight` is its rough size in bytes
 * until it reports a real one. A task that fails still counts as finished:
 * the bar measures work done, and a missing file must never trap a child on
 * this screen.
 *
 * `minimum` (ms) is how long the picture stays up at the least: about two
 * seconds on a first play, one after that. It is a floor, never a delay
 * added on top: the bar can never show more than has really loaded, it
 * just isn't allowed to race across faster than the minimum, and a slow
 * load simply takes as long as it takes. The bar glides between values.
 *
 * `onDone` runs once every task has settled, the minimum has passed and
 * the bar has reached the end.
 */
export default function PlayLoading({ tasks, onDone, minimum = 1000 }) {
  const [percent, setPercent] = useState(0);
  const [artFailed, setArtFailed] = useState(false);
  const fillRef = useRef(null);
  const latestOnDone = useRef(onDone);

  useEffect(() => {
    latestOnDone.current = onDone;
  });

  useEffect(() => {
    if (!tasks) return undefined;

    const controller = new AbortController();
    const loaded = tasks.map(() => 0);
    const totals = tasks.map((task) => task.weight);
    const startedAt = performance.now();
    const still = reducedMotion();
    let real = 0; // how much has really loaded, 0 to 1
    let shown = 0; // what the bar shows
    let results = null; // set once every task has settled
    let frame = 0;
    let lastPercent = -1;

    const measure = () => {
      const whole = sum(totals);
      // Never let it slide backwards when a file reports its real size.
      real = Math.max(real, whole > 0 ? Math.min(1, sum(loaded) / whole) : 1);
    };

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      // The ceiling rises with time and reaches the end at the minimum, so
      // a quick load still fills smoothly; real progress caps it.
      const target = Math.min(results ? 1 : real, easeInOut(Math.min(1, elapsed / minimum)));
      // Once everything is in, it finishes briskly rather than drifting.
      shown = still ? target : shown + (target - shown) * (results ? 0.32 : 0.16);
      if (Math.abs(target - shown) < 0.002) shown = target;

      if (fillRef.current) fillRef.current.style.transform = `scaleX(${shown})`;
      const now = Math.round(shown * 100);
      if (now !== lastPercent) {
        lastPercent = now;
        setPercent(now);
      }

      if (results && elapsed >= minimum && shown >= 1) {
        latestOnDone.current(results);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    measure();
    frame = requestAnimationFrame(tick);

    Promise.allSettled(
      tasks.map((task, i) =>
        task
          .run((done, total) => {
            if (total) totals[i] = total;
            loaded[i] = Math.min(done, totals[i]);
            measure();
          }, controller.signal)
          .finally(() => {
            loaded[i] = totals[i];
            measure();
          })
      )
    ).then((settled) => {
      if (!controller.signal.aborted) results = settled;
    });

    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
    };
  }, [tasks, minimum]);

  return (
    <div className="pm-loading">
      {!artFailed && (
        <img
          className="pm-loading__art"
          src={LOADING_ART.src}
          width={LOADING_ART.width}
          height={LOADING_ART.height}
          alt="Zizi and her mum being pulled apart in the purple haze of the market"
          decoding="async"
          fetchPriority="high"
          onError={() => setArtFailed(true)}
        />
      )}

      {/* If the art can't be fetched, the plain wordmark keeps the screen
          recognisable. This is the failure case, not a stand-in for the art. */}
      {artFailed && <p className="pm-loading__mark">Pebble Math</p>}

      {/* Low and out of the way: the picture carries the moment. The word
          "Loading" is there for screen readers only. */}
      <div className="pm-loading__status">
        <p className="pm-sr-only" id="pm-loading-label">
          Loading
        </p>
        <div
          className="pm-loading__track"
          role="progressbar"
          aria-labelledby="pm-loading-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div ref={fillRef} className="pm-loading__fill" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </div>
  );
}
