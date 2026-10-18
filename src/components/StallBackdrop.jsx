import { MARKET_LAYERS, SELLER } from "../data/market";
import "./StallBackdrop.css";

/**
 * The Fruit Stall's painted scene: six layers (sky, far, palms, ground,
 * stall, near) composed on a 1920×1080 stage that covers the screen.
 *
 * `dim` is the market under the haze, for Scene 1: darker, purpler, with
 * slow drifting haze. `close` keeps the stall big enough to play at on a
 * short screen (a phone on its side), at the cost of some sky. `seller`
 * stands the fruit seller behind the stall's right end. `stallRef`
 * reaches the stall layer, so the game can find its table.
 *
 * Decorative only; the screens say in words what matters.
 */
export default function StallBackdrop({ dim = false, close = false, seller = false, stallRef }) {
  return (
    <div
      className={`pm-backdrop${dim ? " pm-backdrop--dim" : ""}${close ? " pm-backdrop--close" : ""}`}
      aria-hidden="true"
    >
      <div className="pm-world">
        {MARKET_LAYERS.flatMap((layer) => [
          // The seller stands behind the stall, so she goes in just before it.
          layer.id === "stall" && seller ? (
            <img
              key="seller"
              className="pm-layer pm-layer--seller"
              src={SELLER.src}
              width={SELLER.w}
              height={SELLER.h}
              alt=""
              draggable={false}
              decoding="async"
            />
          ) : null,
          <img
            key={layer.id}
            ref={layer.id === "stall" ? stallRef : undefined}
            className={`pm-layer pm-layer--${layer.id}`}
            src={layer.src}
            width={layer.w}
            height={layer.h}
            alt=""
            draggable={false}
            decoding="async"
          />,
        ])}
      </div>

      {dim && (
        <div className="pm-haze">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
