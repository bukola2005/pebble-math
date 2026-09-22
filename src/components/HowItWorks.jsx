import SectionHeading from "./SectionHeading";
import "./HowItWorks.css";

const STEPS = [
  {
    title: "Explore",
    text: "Enter the market and discover what needs to be done.",
  },
  {
    title: "Interact",
    text: "Pick up objects, move them, combine them and make choices.",
  },
  {
    title: "Think",
    text: "Use numbers to understand the situation.",
  },
  {
    title: "Apply",
    text: "Use the mathematical idea again in a different situation.",
  },
];

/**
 * Four beats of the same loop, laid out along one line so it reads as a
 * cycle rather than four unrelated features.
 */
export default function HowItWorks() {
  return (
    <section
      className="pm-section pm-how"
      id="how-it-works"
      aria-labelledby="pm-how-title"
    >
      <div className="pm-shell">
        <SectionHeading
          eyebrow="How it works"
          id="pm-how-title"
          title="The same four beats, every time."
          lead="A child doesn’t start with a question. They start with something to do — and the question turns up inside it."
        />

        <ol className="pm-how__steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="pm-how__step">
              <span className="pm-how__num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="pm-how__dot" aria-hidden="true" />
              <h3 className="pm-how__title">{step.title}</h3>
              <p className="pm-how__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
