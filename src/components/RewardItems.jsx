import "./RewardItems.css";

/*
  What a child has earned (data/rewards.js), as small item cards: a
  picture, its name and, at full size, where it came from.

  The pictures are drawn here in SVG; there is no painted art for them yet.
  The straw hat is not worn on the child's Zizi: the seven Zizi looks are
  painted with their heads in different places and at different angles,
  and a drawn hat laid over them would sit differently on each and look
  stuck on. So for now it is a card, like the tally stick.
*/
const PICTURES = {
  "straw-hat": (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <ellipse cx="24" cy="31" rx="21" ry="7" fill="#f1cf7a" stroke="#a7772c" strokeWidth="1.5" />
      <path
        d="M13 30c0-9 4.5-15 11-15s11 6 11 15c-3.5 1.6-7 2.3-11 2.3S16.5 31.6 13 30z"
        fill="#f3d688"
        stroke="#a7772c"
        strokeWidth="1.5"
      />
      <path d="M13.6 26.4c3.4 1.4 6.8 2 10.4 2s7-.6 10.4-2" fill="none" stroke="#9d8ae0" strokeWidth="3" />
      <path d="M17.5 20.5h13M15.8 24h16.4" stroke="#c99a45" strokeWidth="1" opacity="0.7" />
    </svg>
  ),
  "tally-stick": (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <g transform="rotate(-18 24 24.5)">
        <rect x="5" y="20" width="38" height="9" rx="4.5" fill="#d29a5e" stroke="#8a5a2c" strokeWidth="1.5" />
        <path
          d="M11 20.6v7.8M14.5 20.6v7.8M18 20.6v7.8M21.5 20.6v7.8M9.5 27.5l13.5-6M28 20.6v7.8M31.5 20.6v7.8"
          stroke="#6b4320"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  ),
};

/** One reward's picture, by its id (for the profile's item cards too). */
export const RewardPicture = ({ id }) => PICTURES[id] ?? null;

/** `size`: "md" with where each came from, "sm" for a compact row. */
export default function RewardItems({ items, size = "md" }) {
  if (!items?.length) return null;
  return (
    <ul className={`pm-rewards pm-rewards--${size}`} aria-label="Earned">
      {items.map((item) => (
        <li key={item.id} className="pm-reward">
          <span className="pm-reward__picture">
            <RewardPicture id={item.id} />
          </span>
          <span className="pm-reward__words">
            <span className="pm-reward__name">{item.name}</span>
            {size === "md" && <span className="pm-reward__from">From {item.place}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
