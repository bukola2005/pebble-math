import SectionHeading from "./SectionHeading";
import "./MoneyPreview.css";

const STATS = [
  { label: "Wallet", value: "₦1,000" },
  { label: "Savings", value: "₦300" },
  { label: "Goal", value: "₦1,000" },
];

/**
 * Money as a game object, not a banking screen: a jar that fills, a goal
 * line to reach, and the three numbers a child is actually juggling.
 */
export default function MoneyPreview() {
  return (
    <section
      className="pm-section pm-section--lavender pm-money"
      aria-labelledby="pm-money-title"
    >
      <div className="pm-shell pm-money__grid">
        <div className="pm-money__copy">
          <SectionHeading
            eyebrow="Money & saving"
            id="pm-money-title"
            title="Numbers become decisions."
            lead="Children learn what happens when they spend, save, compare prices and work toward a goal, while using the mathematics behind those decisions."
          />

          <dl className="pm-money__stats">
            {STATS.map((stat) => (
              <div key={stat.label} className="pm-money__stat">
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="pm-money__jar">
          <svg
            viewBox="0 0 220 250"
            role="img"
            aria-labelledby="pm-jar-title"
            className="pm-money__jar-svg"
          >
            <title id="pm-jar-title">
              A savings jar holding ₦300 of a ₦1,000 goal
            </title>

            <defs>
              <clipPath id="pm-jar-clip">
                <path d="M46 64H154a10 10 0 0 1 10 10v128a20 20 0 0 1-20 20H56a20 20 0 0 1-20-20V74a10 10 0 0 1 10-10Z" />
              </clipPath>
            </defs>

            {/* glass body */}
            <path
              d="M46 64H154a10 10 0 0 1 10 10v128a20 20 0 0 1-20 20H56a20 20 0 0 1-20-20V74a10 10 0 0 1 10-10Z"
              fill="#FFFFFF"
              opacity="0.72"
            />

            {/* what’s saved so far */}
            <g clipPath="url(#pm-jar-clip)">
              <path
                d="M30 170c14-8 26 6 40 6s26-10 40-10 26 10 40 10 26-14 40-6v70H30Z"
                fill="#FE885C"
              />
              <circle cx="78" cy="196" r="13" fill="#FFB08C" />
              <circle cx="112" cy="204" r="13" fill="#FFB08C" />
              <circle cx="140" cy="192" r="13" fill="#FFB08C" />
              <text
                x="112"
                y="210"
                textAnchor="middle"
                fontFamily="inherit"
                fontSize="14"
                fontWeight="800"
                fill="#2E1B12"
              >
                ₦
              </text>
            </g>

            <path
              d="M46 64H154a10 10 0 0 1 10 10v128a20 20 0 0 1-20 20H56a20 20 0 0 1-20-20V74a10 10 0 0 1 10-10Z"
              fill="none"
              stroke="#C5CCFB"
              strokeWidth="4"
            />

            {/* rim */}
            <rect x="32" y="42" width="136" height="24" rx="12" fill="#99A6F9" />
            <rect x="32" y="42" width="136" height="10" rx="5" fill="#B4BEFB" />

            {/* the goal line sits where ₦1,000 would reach */}
            <line
              x1="30"
              y1="88"
              x2="170"
              y2="88"
              stroke="#8B99F4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 8"
            />
            <text
              x="176"
              y="93"
              fontFamily="inherit"
              fontSize="13"
              fontWeight="800"
              fill="#4C5CCB"
            >
              Goal
            </text>
          </svg>

          <figcaption className="pm-money__jar-caption">
            <span className="pm-money__jar-goal">₦300 saved</span>
            ₦700 to go.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
