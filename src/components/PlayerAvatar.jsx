import { getCharacter } from "../data/characters";
import "./PlayerAvatar.css";

// The first letter of the name, counted by character rather than by byte so
// a name that starts with an accented letter or an emoji still works.
const initialOf = (name) => [...name.trim()][0]?.toUpperCase() ?? "";

/**
 * A player's round picture: their character, or, until they have picked
 * one on their first play, a neutral circle with the first letter of their
 * name. No artwork stands in for a choice the child hasn't made.
 *
 * Decorative either way: the name is always shown next to it. Size it with
 * `className` (width, height and, for the letter, font-size).
 */
export default function PlayerAvatar({ player, className = "", eager = false }) {
  if (!player.character) {
    return (
      <span className={`pm-avatar pm-avatar--none ${className}`} aria-hidden="true">
        {initialOf(player.display_name)}
      </span>
    );
  }

  const character = getCharacter(player.character);
  return (
    <img
      className={`pm-avatar ${className}`}
      src={character.src}
      alt=""
      aria-hidden="true"
      width={character.w}
      height={character.h}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
