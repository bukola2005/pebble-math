import CTAButton from "./CTAButton";
import GlassPanel from "./GlassPanel";
import MarketScene from "./MarketScene";
import "./Hero.css";

const CHAPTERS = [
  "Addition",
  "Subtraction",
  "Multiplication",
  "Division",
  "Money & saving",
];

export default function Hero({ onStart }) {
  return (
    <section className="pm-hero" id="top">
      <div className="pm-shell pm-hero__grid">
        <div className="pm-hero__copy">
          <h1 className="pm-hero__title">
            A market where kids learn to{" "}
            <span className="pm-hero__accent">
              use
              <svg
                className="pm-hero__underline"
                viewBox="0 0 120 14"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M3 9.5C22 4.5 52 2.5 78 5.5c14 1.6 27 4 39 6.5"
                  fill="none"
                  stroke="#FE885C"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            math, not just know it.
          </h1>

          <p className="pm-hero__lead">
            Pebble Math is a 2D game where kids pick up objects, combine
            quantities, and spend from a real wallet. They build real number
            sense through one connected market, not a stack of worksheets.
          </p>

          <div className="pm-hero__actions">
            <CTAButton onClick={onStart}>Get Started</CTAButton>
            <CTAButton href="#how-it-works" variant="secondary">
              See How It Works
            </CTAButton>
          </div>

          <div className="pm-hero__chapters">
            <span className="pm-hero__chapters-label">Chapters in the market</span>
            <ul className="pm-hero__chapters-list">
              {CHAPTERS.map((chapter) => (
                <li key={chapter}>{chapter}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pm-hero__visual">
          <MarketScene priority />
        </div>
      </div>
    </section>
  );
}
