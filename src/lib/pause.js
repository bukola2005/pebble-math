import { useSyncExternalStore } from "react";

/*
  Pausing the game, while the child's profile is open over it (PlayHud).

  Nothing in the game is against the clock, so a pause loses nothing:
  it just holds everything where it is until the profile closes.

    - The game's waits (`after` instead of setTimeout: a line moving on,
      an order being taken, Blob waiting at the wall) stop counting, and
      go on with the time they had left.
    - Everything moving on screen (CSS animations and transitions, and
      the flights made with el.animate) stops mid-way, and goes on.
    - Reading aloud stops (lib/speech.js), and the line being said is said
      again when the game goes on.
*/

let paused = false;
const listeners = new Set();

export const isPaused = () => paused;

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Whether the game is paused, for components that hold still while it is. */
export const usePaused = () => useSyncExternalStore(subscribe, isPaused, isPaused);

/** Runs `listener(paused)` each time the game pauses or goes on. */
export function onPauseChange(listener) {
  const wrapped = () => listener(paused);
  listeners.add(wrapped);
  return () => listeners.delete(wrapped);
}

// --- waits that hold while paused --------------------------------------------------

const waits = new Map(); // id -> { fn, left, startedAt, timer }
let nextId = 1;

function start(id, wait) {
  wait.startedAt = performance.now();
  wait.timer = window.setTimeout(() => {
    waits.delete(id);
    wait.fn();
  }, wait.left);
}

/** Like setTimeout, but holds while the game is paused. */
export function after(fn, ms) {
  const id = nextId++;
  const wait = { fn, left: Math.max(0, ms), startedAt: 0, timer: 0 };
  waits.set(id, wait);
  if (!paused) start(id, wait);
  return id;
}

/** Like clearTimeout, for a wait from `after`. */
export function cancel(id) {
  const wait = waits.get(id);
  if (!wait) return;
  window.clearTimeout(wait.timer);
  waits.delete(id);
}

// --- pausing --------------------------------------------------------------------

let held = []; // the animations stopped by the pause

/**
 * Pauses the game, or lets it go on. `keep` is what pauses it (the
 * profile): anything moving inside it goes on moving.
 */
export function setPaused(next, keep = null) {
  if (next === paused) return;
  paused = next;
  if (paused) {
    for (const wait of waits.values()) {
      window.clearTimeout(wait.timer);
      wait.left = Math.max(0, wait.left - (performance.now() - wait.startedAt));
    }
    // Only what is actually moving, so nothing finished starts again.
    held = (document.getAnimations?.() ?? []).filter(
      (animation) => animation.playState === "running" && !keep?.contains(animation.effect?.target ?? null)
    );
    held.forEach((animation) => animation.pause());
  } else {
    for (const [id, wait] of waits) start(id, wait);
    held.forEach((animation) => {
      try {
        if (animation.playState === "paused") animation.play();
      } catch {
        // Its element has gone: nothing to go on with.
      }
    });
    held = [];
  }
  listeners.forEach((listener) => listener());
}
