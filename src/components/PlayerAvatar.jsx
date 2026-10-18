import { CHARACTERS } from "../data/characters";
import "./PlayerAvatar.css";

// The first letter of the name, counted by character rather than by byte so
// a name that starts with an accented letter or an emoji still works.
const initialOf = (name) => [...name.trim()][0]?.toUpperCase() ?? "";

/**
 * A child's round picture on the grown-up's side (the dashboard and "Who's
 * playing?"): the monster the grown-up picked for them, so children are
 * easy to tell apart at a glance. Without one (a child added before
 * monsters came back), a neutral circle with the first letter of their name.
 *
 * This is not the in-game character. In the game every child is Zizi.
 *
 * Decorative either way: the name is always shown next to it. Size it with
 * `className` (width, height and, for the letter, font-size).
 */
export default function PlayerAvatar({ player, className = "", eager = false }) {
  const monster = CHARACTERS.find((option) => option.id === player.monster);

  if (!monster) {
    return (
      <span className={`pm-avatar pm-avatar--none ${className}`} aria-hidden="true">
        {initialOf(player.display_name)}
      </span>
    );
  }

  return (
    <img
      className={`pm-avatar ${className}`}
      src={monster.src}
      alt=""
      aria-hidden="true"
      width={monster.w}
      height={monster.h}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
