import { DEFAULT_CHARACTER } from "../data/characters";
import "./Character.css";

/**
 * Any Pebble Math character. Width and height are always set so the
 * browser reserves the box before the image arrives; `priority` marks
 * the one in the hero, which must not be lazy-loaded.
 */
export default function Character({
  character = DEFAULT_CHARACTER,
  src,
  alt = "",
  className = "",
  motion = "still",
  crop,
  priority = false,
  width,
  height,
}) {
  const source = src ?? character.src;
  const shape = crop ?? character.crop ?? "full";

  return (
    <img
      className={`pm-character pm-character--${motion} pm-character--${shape} ${className}`}
      src={source}
      alt={alt}
      width={width ?? character.w}
      height={height ?? character.h}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      draggable="false"
      /* Decorative unless it is given a description: the copy beside it
         already carries the meaning. */
      aria-hidden={alt === "" ? "true" : undefined}
    />
  );
}
