/**
 * The agreed paths for the play session's artwork and film, in one place.
 * Dropping a new file in at one of these paths is all it takes to change it.
 *
 * `width` / `height` are the intrinsic pixel sizes, so the browser reserves
 * the box before the file arrives.
 */

/**
 * The loading screen art: Zizi and her mother being pulled apart in the
 * hazy market. The situation tells a child what the game is about before
 * a word is read. A frame from the film, so 1280×720 is its full size.
 */
export const LOADING_ART = {
  src: "/loading/hands-apart.webp",
  width: 1280,
  height: 720,
};

/**
 * The open storybook behind the avatar screen. Where its pages sit is
 * measured from this exact image and written in routes/PlayAvatar.css; a
 * different book picture would need those numbers re-measured.
 */
export const STORYBOOK = {
  src: "/art/storybook-blank.webp",
  width: 1920,
  height: 1072,
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
