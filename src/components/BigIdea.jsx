import "./BigIdea.css";

/**
 * The argument of the whole product, in two lines. Typography and space
 * do the work here — no illustration, no cards.
 */
export default function BigIdea() {
  return (
    <section className="pm-section pm-idea">
      <div className="pm-idea__glow" aria-hidden="true" />
      <div className="pm-shell pm-idea__inner">
        <h2 className="pm-idea__title">
          Don't just teach kids what numbers are.
          <br />
          <span className="pm-idea__accent">Help them use numbers.</span>
        </h2>
        <p className="pm-idea__copy">
          Every chapter (from addition through money and saving) asks a child
          to do the math inside a real decision, not just answer a question
          about it.
        </p>
      </div>
    </section>
  );
}
