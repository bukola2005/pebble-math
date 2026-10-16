import { useNavigate } from "react-router-dom";
import CTAButton from "./CTAButton";
import { getAgeBandLabel, getClassLevelLabel } from "../data/players";
import { getZiziLook } from "../data/zizi";
import "./MarketPlaceholder.css";

/**
 * Where the market will open. The game itself isn't built yet, so this says
 * so plainly, beside the Zizi the child just made: their look and their
 * game name.
 */
export default function MarketPlaceholder({ player }) {
  const navigate = useNavigate();
  const zizi = getZiziLook(player.character);

  const meta = [
    getAgeBandLabel(player.age_band),
    getClassLevelLabel(player.class_level),
    "Chapter 1, Addition",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="pm-market">
      <div className="pm-market__card">
        <img
          className="pm-market__zizi"
          src={zizi.src}
          width={zizi.w}
          height={zizi.h}
          alt=""
          aria-hidden="true"
        />
        <div>
          <p className="pm-market__name">{player.game_name || player.display_name}</p>
          <p className="pm-market__meta">{meta}</p>
        </div>
      </div>

      <h1 className="pm-market__title">This is where the market opens.</h1>
      <p className="pm-market__text">
        The first chapter is in development. The game itself is what we build
        next.
      </p>

      <CTAButton onClick={() => navigate("/play")}>Who’s playing?</CTAButton>
    </div>
  );
}
