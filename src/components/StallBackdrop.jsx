import { MARKET_LAYERS } from "../data/market";
import "./StallBackdrop.css";

/**
 * The Fruit Stall's painted scene: six layers (sky, far, palms, ground,
 * stall, near) composed on a 1920×1080 stage that covers the screen.
 *
 * `dim` is the market under the haze, for Scene 1: darker, purpler, with
 * slow drifting haze. `stallRef` reaches the stall layer, so the tutorial
 * can point at it.
 *
 * Decorative only; the screens say in words what matters.
 */
export default function StallBackdrop({ dim = false, stallRef }) {
  return (
    <div className={`pm-backdrop${dim ? " pm-backdrop--dim" : ""}`} aria-hidden="true">
      <div className="pm-world">
        {MARKET_LAYERS.map((layer) => (
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
          />
        ))}
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
