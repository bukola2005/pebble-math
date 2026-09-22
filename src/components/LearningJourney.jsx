import SectionHeading from "./SectionHeading";
import "./LearningJourney.css";

const CHAPTERS = [
  { glyph: "+", name: "Addition", text: "Combine quantities." },
  { glyph: "−", name: "Subtraction", text: "Understand what remains." },
  { glyph: "×", name: "Multiplication", text: "Work with groups." },
  { glyph: "÷", name: "Division", text: "Share and distribute." },
  { glyph: "₦", name: "Money & Saving", text: "Use math to make everyday decisions." },
];

/**
 * One path, five stops. Deliberately not five worlds — the line never
 * breaks, because the market never changes.
 */
export default function LearningJourney() {
  return (
    <section
      className="pm-section pm-section--lavender pm-journey"
      id="learning"
      aria-labelledby="pm-journey-title"
    >
      <div className="pm-shell">
        <SectionHeading
          eyebrow="The learning journey"
          id="pm-journey-title"
          title="Five chapters. One market."
          lead="Nothing resets between them. The same stalls come back, one idea further in."
        />

        <ol className="pm-journey__path">
          {CHAPTERS.map((chapter, i) => (
            <li
              key={chapter.name}
              className={`pm-journey__stop${
                i === CHAPTERS.length - 1 ? " pm-journey__stop--last" : ""
              }`}
            >
              <span className="pm-journey__marker" aria-hidden="true">
                {chapter.glyph}
              </span>
              <h3 className="pm-journey__name">{chapter.name}</h3>
              <p className="pm-journey__text">{chapter.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
