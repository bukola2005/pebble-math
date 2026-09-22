import Apple from "./Apple";
import SectionHeading from "./SectionHeading";
import "./MathInteractionPreview.css";

function AppleGroup({ count, label }) {
  return (
    <div className="pm-math__group">
      <div className="pm-math__apples">
        {Array.from({ length: count }).map((_, i) => (
          <Apple key={i} size={46} />
        ))}
      </div>
      <span className="pm-math__count">{label}</span>
    </div>
  );
}

/**
 * The demonstration section: the same chapter shown twice — once as
 * objects, once as money — so the connection is visible without copy.
 */
export default function MathInteractionPreview() {
  return (
    <section className="pm-section pm-math" aria-labelledby="pm-math-title">
      <div className="pm-shell">
        <SectionHeading
          eyebrow="Experience the math"
          id="pm-math-title"
          title="The math is the action."
          lead="Two things a child does in the first chapter, and the arithmetic that falls out of them."
        />

        <div className="pm-math__panels">
          {/* --- objects --- */}
          <figure className="pm-math__panel pm-math__panel--objects">
            <div className="pm-math__equation">
              <AppleGroup count={3} label="3" />
              <span className="pm-math__op" aria-hidden="true">
                +
              </span>
              <AppleGroup count={2} label="2" />
              <span className="pm-math__op" aria-hidden="true">
                =
              </span>
              <AppleGroup count={5} label="5" />
            </div>
            <figcaption className="pm-math__caption">
              Nothing is typed in. The basket counts what a child put in it.
            </figcaption>
          </figure>

          {/* --- money --- */}
          <figure className="pm-math__panel pm-math__panel--money">
            <dl className="pm-math__ledger">
              <div className="pm-math__line">
                <dt>Wallet</dt>
                <dd>₦1,000</dd>
              </div>
              <div className="pm-math__line pm-math__line--spend">
                <dt>Spend</dt>
                <dd>− ₦300</dd>
              </div>
              <div className="pm-math__line pm-math__line--total">
                <dt>Remaining</dt>
                <dd>₦700</dd>
              </div>
            </dl>

            <div
              className="pm-math__bar"
              role="img"
              aria-label="Seven hundred naira of one thousand left in the wallet"
            >
              <span className="pm-math__bar-left" />
              <span className="pm-math__bar-spent" />
            </div>

            <figcaption className="pm-math__caption">
              Paying at a stall is subtraction a child can see.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
