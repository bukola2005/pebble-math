import { useEffect, useRef } from "react";
import { BASKET_AWARD } from "../data/dialogue";
import { BASKET } from "../data/market";
import { useReadAloud } from "../lib/speech";
import "./BasketAward.css";

/**
 * The first thing the game gives a child: their basket. One card, one
 * beat, then on to the tutorial. There is no inventory to open.
 */
export default function BasketAward({ onDone }) {
  const buttonRef = useRef(null);

  useReadAloud(BASKET_AWARD.title, "blob");

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pm-award" role="dialog" aria-modal="true" aria-labelledby="pm-award-title">
      <div className="pm-award__card">
        <div className="pm-award__shine" aria-hidden="true">
          <img src={BASKET.src} width={BASKET.w} height={BASKET.h} alt="" draggable={false} />
        </div>
        <h2 id="pm-award-title" className="pm-award__title">
          {BASKET_AWARD.title}
        </h2>
        <button ref={buttonRef} type="button" className="pm-award__button" onClick={onDone}>
          {BASKET_AWARD.button}
        </button>
      </div>
    </div>
  );
}
