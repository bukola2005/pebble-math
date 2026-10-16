import { INTRO_FILM, STORYBOOK } from "../data/media";
import { ZIZI_DEFAULT, ZIZI_LOOKS, getZiziLook } from "../data/zizi";
import { pickPlayableSource, preloadFile, preloadImage } from "./preload";

/*
  The order of a child's play session, and what each step needs loaded.

    film (first play) → avatar (choose a Zizi look) → name (build a game
    name) → … the rest of the chapter, still to come

  Every step is its own route under /play/:playerId, and its own chunk of
  code. The loading screen fetches only what the next step needs; each step
  then warms the one after it in the background while the child is busy.
*/

/** Where this child goes next, or null when every step built so far is done. */
export function nextStep(player) {
  if (!player.first_play_done) return "intro";
  // An old value from before Zizi (a monster id) counts as no look yet.
  if (!ZIZI_LOOKS.some((look) => look.id === player.character)) return "avatar";
  if (!player.game_name) return "name";
  return null;
}

// The same files as the step routes in routes/PlaySessionShell.jsx, so a
// step fetched here ahead of time is simply there when its route renders.
const STEP_CODE = {
  intro: () => import("../routes/PlayIntro"),
  avatar: () => import("../routes/PlayAvatar"),
  name: () => import("../routes/PlayName"),
};

// Rough sizes in bytes. They only balance the bar between files until each
// file reports its real size; how full the bar is comes from real loading.
const IMAGE_BYTES = 45_000;
const CODE_BYTES = 15_000;
const FILM_BYTES = 1_800_000;

const image = (src) => ({ weight: IMAGE_BYTES, run: () => preloadImage(src) });
const code = (step) => ({ weight: CODE_BYTES, run: STEP_CODE[step] });

/**
 * What the loading screen waits for before sending the child to `step`
 * (null meaning "the end of what's built"). `keepFilm` receives the film
 * as a blob: URL, so it is downloaded exactly once.
 */
export function stepTasks(step, player, keepFilm) {
  switch (step) {
    case "intro": {
      const film = pickPlayableSource(INTRO_FILM.sources);
      return [
        code("intro"),
        image(INTRO_FILM.poster),
        ...(film
          ? [
              {
                weight: FILM_BYTES,
                run: (report, signal) => preloadFile(film.src, report, signal).then(keepFilm),
              },
            ]
          : []),
      ];
    }
    case "avatar":
      return [
        code("avatar"),
        image(STORYBOOK.src),
        image(ZIZI_DEFAULT.src),
        ...ZIZI_LOOKS.map((look) => image(look.src)),
      ];
    case "name":
      return [code("name"), image(getZiziLook(player.character).src)];
    default:
      return [image(getZiziLook(player.character).src)];
  }
}

/**
 * Fetches the next step's code and pictures without waiting for them, so a
 * step that follows straight on doesn't make the child watch things pop in.
 * Never the film: that only ever comes through the loading screen.
 */
export function prefetchStep(step, player) {
  if (!step || step === "intro") return;
  for (const task of stepTasks(step, player, () => {})) {
    task.run(() => {}).catch(() => {});
  }
}
