import { useEffect, useRef, useState } from "react";
import { LOADING_ART } from "../data/media";
import "./PlayLoading.css";

// Long enough that a load served straight from cache doesn't flash the
// screen up and away; short enough not to feel like waiting.
const MIN_VISIBLE_MS = 700;

const sum = (list) => list.reduce((total, n) => total + n, 0);

/**
 * The loading screen between "Who's playing?" and the market: the Pebble
 * Math art with a bar that fills as the session's files actually arrive.
 * There is no timer behind the bar and no fake progress.
 *
 * `tasks` is a list of `{ weight, run(report, signal) }`, or null while the
 * list isn't known yet. `run` does the real work and calls
 * `report(loaded, total)` as it goes; `weight` is its rough size in bytes
 * until it reports a real one. A task that fails still counts as finished:
 * the bar measures work done, and a missing file must never trap a child on
 * this screen.
 *
 * `onDone` runs once every task has settled and the screen has been up for
 * at least MIN_VISIBLE_MS.
 */
export default function PlayLoading({ tasks, onDone }) {
  const [progress, setProgress] = useState(0);
  const [artFailed, setArtFailed] = useState(false);
  const shownAt = useRef(performance.now());
  const latestOnDone = useRef(onDone);

  useEffect(() => {
    latestOnDone.current = onDone;
  });

  useEffect(() => {
    if (!tasks) return undefined;

    const controller = new AbortController();
    const loaded = tasks.map(() => 0);
    const totals = tasks.map((task) => task.weight);

    const update = () => {
      if (controller.signal.aborted) return;
      const whole = sum(totals);
      const fraction = whole > 0 ? Math.min(1, sum(loaded) / whole) : 1;
      // Never let the bar slide backwards when a file reports its real size.
      setProgress((previous) => Math.max(previous, fraction));
    };

    update();

    Promise.allSettled(
      tasks.map((task, i) =>
        task
          .run((done, total) => {
            if (total) totals[i] = total;
            loaded[i] = Math.min(done, totals[i]);
            update();
          }, controller.signal)
          .finally(() => {
            loaded[i] = totals[i];
            update();
          })
      )
    ).then(async (results) => {
      const wait = MIN_VISIBLE_MS - (performance.now() - shownAt.current);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      if (!controller.signal.aborted) latestOnDone.current(results);
    });

    return () => controller.abort();
  }, [tasks]);

  const percent = Math.round(progress * 100);

  return (
    <div className="pm-loading">
      {!artFailed && (
        <img
          className="pm-loading__art"
          src={LOADING_ART.src}
          width={LOADING_ART.width}
          height={LOADING_ART.height}
          alt="Pebble Math"
          decoding="async"
          fetchPriority="high"
          onError={() => setArtFailed(true)}
        />
      )}

      {/* If the art can't be fetched, the plain wordmark keeps the screen
          recognisable. This is the failure case, not a stand-in for the art. */}
      {artFailed && <p className="pm-loading__mark">Pebble Math</p>}

      <div className="pm-loading__status">
        <p className="pm-loading__label" id="pm-loading-label">
          Loading…
        </p>
        <div
          className="pm-loading__track"
          role="progressbar"
          aria-labelledby="pm-loading-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="pm-loading__fill"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>
    </div>
  );
}
