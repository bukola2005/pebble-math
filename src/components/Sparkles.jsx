import "./Sparkles.css";

/*
  Five small four-point stars that scatter a little from (x, y) and then
  fly (dx, dy) to where they land, all within half a second. Alternately
  white and lavender: never orange, which only ever means "press this".

  (x, y) is a point on the screen: the stars are fixed-position, so they
  can fly from the basket to its count, or from the count up into the
  progress meter.
*/
const SPREAD = [
  [-18, -14],
  [14, -20],
  [22, 6],
  [-20, 10],
  [2, -26],
];

/** When the stars arrive (Sparkles.css: up to 60ms of stagger, then 420ms of flight). */
export const SPARKLES_LAND_MS = 450;

export default function Sparkles({ x, y, dx, dy }) {
  return SPREAD.map(([mx, my], i) => (
    <svg
      key={i}
      className={`pm-sparkle${i % 2 ? " pm-sparkle--lavender" : ""}`}
      viewBox="0 0 20 20"
      aria-hidden="true"
      style={{
        left: x,
        top: y,
        "--mx": `${mx}px`,
        "--my": `${my}px`,
        "--dx": `${dx + mx * 0.2}px`,
        "--dy": `${dy + my * 0.2}px`,
        animationDelay: `${i * 15}ms`,
      }}
    >
      <path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" />
    </svg>
  ));
}
