import SectionHeading from "./SectionHeading";
import "./ParentSection.css";

const NOTES = [
  {
    q: "What does a child actually do?",
    a: "They walk into the market with something to buy, pick objects up, put them in a basket, pay from a wallet and count what’s left. The math happens inside those actions, not beside them.",
  },
  {
    q: "What do they learn?",
    a: "Counting, addition, subtraction, multiplication, division, and money — as chapters of the same market, in that order.",
  },
  {
    q: "Why one market instead of lots of mini-games?",
    a: "A child who only meets addition in an addition game learns the game. Meeting the same idea again at a different stall, with different objects, is what turns it into number sense.",
  },
  {
    q: "Why does the interaction matter so much?",
    a: "Answering 3 + 2 is recall. Putting three apples and two apples into one basket and watching it become five is understanding. We build for the second one.",
  },
  {
    q: "How does money fit in?",
    a: "Prices are in naira. A child spends from a wallet, works out the change, compares what two things cost, and saves toward something they want — the same arithmetic, with a consequence attached.",
  },
  {
    q: "Where is Pebble Math today?",
    a: "In development. This page shows the product direction and the first chapter of the market. It is not a finished game yet.",
  },
];

export default function ParentSection() {
  return (
    <section
      className="pm-section pm-parents"
      id="parents"
      aria-labelledby="pm-parents-title"
    >
      <div className="pm-shell pm-parents__grid">
        <SectionHeading
          eyebrow="For parents"
          id="pm-parents-title"
          title="What your child is actually doing."
          lead="Short answers, in plain language. No claims we can’t stand behind yet."
          className="pm-parents__head"
        />

        <dl className="pm-parents__list">
          {NOTES.map((note) => (
            <div key={note.q} className="pm-parents__note">
              <dt className="pm-parents__q">{note.q}</dt>
              <dd className="pm-parents__a">{note.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
