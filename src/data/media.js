/**
 * The agreed paths for the play session's artwork and film, in one place.
 * Dropping a new file in at one of these paths is all it takes to change it.
 *
 * `width` / `height` are the intrinsic pixel sizes, so the browser reserves
 * the box before the file arrives.
 */

/** The loading screen art. Supplied by the designer; see README. */
export const LOADING_ART = {
  src: "/loading/pebble-loading.webp",
  width: 1600,
  height: 893,
};

/**
 * The opening film, shown once, on a child's first play.
 *
 * WebM (VP9) is listed first for the browsers that take it, MP4 (H.264) for
 * Safari and anything older. The types carry exact codecs so that asking
 * the browser `canPlayType` picks the same file a <video> would.
 */
export const INTRO_FILM = {
  sources: [
    { src: "/video/pre-intro.webm", type: 'video/webm; codecs="vp9, opus"' },
    { src: "/video/pre-intro.mp4", type: 'video/mp4; codecs="avc1.4D401F, mp4a.40.2"' },
  ],
  poster: "/video/pre-intro-poster.webp",
  width: 1280,
  height: 720,
};
