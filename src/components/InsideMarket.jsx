import SectionHeading from "./SectionHeading";
import "./InsideMarket.css";

/* Each line is one idea. The part after the dash names the math, so it
   gets its own colour — the sentence itself is untouched. */
const ITEMS = [
  {
    text: "Pick up objects and watch quantities combine",
    tail: "that’s addition.",
  },
  {
    text: "Spend from a real wallet and calculate what’s left",
    tail: "that’s subtraction and money sense.",
  },
  {
    text:
      "Move through one connected market instead of jumping between disconnected mini-games.",
  },
];

function Check() {
  return (
    <span className="pm-inside__check" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12.8 9.2 18 20 6.4"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function InsideMarket() {
  return (
    <section
      className="pm-section pm-section--lavender pm-inside"
      id="about"
      aria-labelledby="pm-inside-title"
    >
      <div className="pm-shell pm-inside__grid">
        <SectionHeading
          eyebrow="The world"
          id="pm-inside-title"
          title="Inside the market"
          lead="One place, built so that every math idea has somewhere to happen."
          className="pm-inside__head"
        />

        <ul className="pm-inside__list">
          {ITEMS.map((item) => (
            <li key={item.text} className="pm-inside__item">
              <Check />
              <p className="pm-inside__text">
                {item.text}
                {item.tail && (
                  <>
                    {" — "}
                    <span className="pm-inside__tail">{item.tail}</span>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
