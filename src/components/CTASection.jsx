import CTAButton from "./CTAButton";
import Character from "./Character";
import "./CTASection.css";

export default function CTASection({ onStart }) {
  return (
    <section className="pm-section pm-cta" id="get-started">
      <div className="pm-shell">
        <div className="pm-cta__panel">
          <div className="pm-cta__copy">
            <h2 className="pm-cta__title">Step into the market.</h2>
            <p className="pm-cta__lead">
              Start with one basket of apples and ₦1,000 to spend. The rest of
              the market opens from there.
            </p>
            <div className="pm-cta__actions">
              <CTAButton onClick={onStart}>Get Started</CTAButton>
              <CTAButton href="#parents" variant="secondary">
                For parents
              </CTAButton>
            </div>
          </div>

          <div className="pm-cta__stage">
            <Character className="pm-cta__character" />
          </div>
        </div>
      </div>
    </section>
  );
}
