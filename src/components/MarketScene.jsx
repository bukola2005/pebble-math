import { useEffect, useRef, useState } from "react";
import Character from "./Character";
import "./MarketScene.css";

/**
 * The market stall: one crate, one basket, one character. Two apples
 * travel from the crate into the basket on a slow loop and the basket
 * count moves 3 → 5, so the picture says "the objects are the math"
 * before anyone reads a word.
 *
 * `reveal`    builds the scene up piece by piece (used by the intro).
 * `character` swaps in the player's chosen character.
 * `priority`  marks the hero copy, which loads eagerly.
 *
 * The apple loop pauses whenever the scene is scrolled out of view, so
 * it costs nothing while someone is reading further down the page.
 *
 * Drawn as SVG — no stock art, no raster illustration — so it stays
 * crisp and stays editable.
 */
export default function MarketScene({ reveal = false, character, priority = false }) {
  const wrapper = useRef(null);
  const [onScreen, setOnScreen] = useState(true);

  // A loop nobody can see is just battery. Pause it when it scrolls away.
  useEffect(() => {
    const el = wrapper.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "150px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapper}
      className={`pm-scene${reveal ? " pm-scene--reveal" : ""}${
        onScreen ? "" : " pm-scene--paused"
      }`}
    >
      <div className="pm-scene__aura" aria-hidden="true" />

      <svg
        className="pm-scene__svg"
        viewBox="0 0 700 586"
        role="img"
        aria-labelledby="pm-scene-title pm-scene-desc"
      >
        <title id="pm-scene-title">A Pebble Math market stall</title>
        <desc id="pm-scene-desc">
          A striped market stall with a crate of apples and a basket. Two
          apples move from the crate into the basket, and the basket count
          changes from three to five.
        </desc>

        <defs>
          <linearGradient id="pm-apple-fill" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#FFB08C" />
            <stop offset="55%" stopColor="#FE885C" />
            <stop offset="100%" stopColor="#F0662F" />
          </linearGradient>

          <linearGradient id="pm-wood-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCF5EE" />
            <stop offset="100%" stopColor="#EFDFCD" />
          </linearGradient>

          <linearGradient id="pm-wood-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EFE1D2" />
            <stop offset="100%" stopColor="#E7D5C2" />
          </linearGradient>

          <linearGradient id="pm-canopy-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E1E32" stopOpacity="0.16" />
            <stop offset="45%" stopColor="#1E1E32" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="pm-ground" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#6E7EE8" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#6E7EE8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#6E7EE8" stopOpacity="0" />
          </radialGradient>

          {/* One apple, reused everywhere. */}
          <g id="pm-apple">
            <circle r="15" fill="url(#pm-apple-fill)" />
            <path
              d="M1 -14c3.4-6.4 11-7.6 13.4-5.6 1.2 3.2-4.4 9-12 7.4z"
              fill="#7D8CF2"
            />
            <ellipse
              cx="-5.4"
              cy="-5.6"
              rx="4.4"
              ry="3"
              fill="#FFFFFF"
              opacity="0.5"
              transform="rotate(-28 -5.4 -5.6)"
            />
          </g>

          {/* The scalloped canopy, used as a clip for the stripes. */}
          <clipPath id="pm-canopy-clip">
            <path d="M108 156 H592 V196 a30.25 30.25 0 0 1 -60.5 0 a30.25 30.25 0 0 1 -60.5 0 a30.25 30.25 0 0 1 -60.5 0 a30.25 30.25 0 0 1 -60.5 0 a30.25 30.25 0 0 1 -60.5 0 a30.25 30.25 0 0 1 -60.5 0 a30.25 30.25 0 0 1 -60.5 0 a30.25 30.25 0 0 1 -60.5 0 Z" />
          </clipPath>

          {/* A slim striped trim on the counter — the awning's echo,
              deliberately quieter than the awning itself. */}
          <clipPath id="pm-valance-clip">
            <rect x="158" y="431" width="384" height="14" rx="4" />
          </clipPath>
        </defs>

        <g transform="translate(0 -26)">
          {/* --- ground ---------------------------------------------- */}
          <g className="pm-scene__ground">
            <ellipse cx="350" cy="548" rx="288" ry="52" fill="url(#pm-ground)" />
            <ellipse cx="352" cy="502" rx="206" ry="16" fill="#6E7EE8" opacity="0.1" />

            {/* where the character stands */}
            <ellipse cx="110" cy="553" rx="50" ry="11" fill="#6E7EE8" opacity="0.16" />

            {/* pebbles — a quiet nod to the name */}
            <ellipse cx="146" cy="536" rx="15" ry="8.5" fill="#DFE3FD" />
            <ellipse cx="172" cy="545" rx="9" ry="5.5" fill="#EEF0FE" />
            <ellipse cx="500" cy="553" rx="13" ry="7.5" fill="#E4E7FD" />
            <ellipse cx="524" cy="560" rx="8" ry="5" fill="#EEF0FE" />
          </g>

          {/* --- crates stacked beside the stall --------------------- */}
          <g className="pm-scene__side">
            <ellipse cx="614" cy="516" rx="54" ry="12" fill="#6E7EE8" opacity="0.18" />
            <rect x="572" y="470" width="86" height="46" rx="8" fill="#F4E8DB" stroke="#E2D0BC" strokeWidth="2" />
            <line x1="580" y1="486" x2="650" y2="486" stroke="#E7D7C5" strokeWidth="2" strokeLinecap="round" />
            <line x1="580" y1="501" x2="650" y2="501" stroke="#E7D7C5" strokeWidth="2" strokeLinecap="round" />
            <use href="#pm-apple" x="593" y="440" />
            <use href="#pm-apple" x="625" y="438" />
            <rect x="580" y="444" width="70" height="30" rx="7" fill="#F8F0E6" stroke="#E2D0BC" strokeWidth="2" />
            <line x1="588" y1="459" x2="642" y2="459" stroke="#EADCCC" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* --- stall frame and awning ------------------------------ */}
          <g className="pm-scene__frame">
            <rect x="130" y="176" width="15" height="330" rx="7.5" fill="#DBD5F0" />
            <rect x="130" y="176" width="5" height="330" rx="2.5" fill="#F1EFFB" />
            <rect x="555" y="176" width="15" height="330" rx="7.5" fill="#DBD5F0" />
            <rect x="555" y="176" width="5" height="330" rx="2.5" fill="#F1EFFB" />

            <g clipPath="url(#pm-canopy-clip)">
              <rect x="108" y="150" width="484" height="90" fill="#FFFFFF" />
              {[0, 2, 4, 6].map((i) => (
                <rect
                  key={i}
                  x={108 + i * 60.5}
                  y="150"
                  width="60.5"
                  height="90"
                  fill="#99A6F9"
                />
              ))}
              <rect x="108" y="150" width="484" height="90" fill="url(#pm-canopy-shade)" />
            </g>

            <path
              d="M108 196 a30.25 30.25 0 0 0 60.5 0 a30.25 30.25 0 0 0 60.5 0 a30.25 30.25 0 0 0 60.5 0 a30.25 30.25 0 0 0 60.5 0 a30.25 30.25 0 0 0 60.5 0 a30.25 30.25 0 0 0 60.5 0 a30.25 30.25 0 0 0 60.5 0 a30.25 30.25 0 0 0 60.5 0"
              fill="none"
              stroke="#FE885C"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <rect x="98" y="138" width="504" height="18" rx="9" fill="#6E7EE8" />
            <rect x="98" y="138" width="504" height="7" rx="3.5" fill="#8B99F4" />
          </g>

          {/* --- counter --------------------------------------------- */}
          <g className="pm-scene__counter">
            <rect x="146" y="404" width="408" height="27" rx="13.5" fill="url(#pm-wood-top)" />
            <rect x="158" y="428" width="384" height="72" rx="10" fill="url(#pm-wood-front)" />
            <g stroke="#E0CDB8" strokeWidth="2" strokeLinecap="round">
              <line x1="254" y1="458" x2="254" y2="492" />
              <line x1="350" y1="458" x2="350" y2="492" />
              <line x1="446" y1="458" x2="446" y2="492" />
            </g>

            <g clipPath="url(#pm-valance-clip)">
              <rect x="158" y="431" width="384" height="14" fill="#F4F5FE" />
              {[0, 2, 4, 6, 8, 10].map((i) => (
                <rect key={i} x={158 + i * 32} y="431" width="32" height="14" fill="#C5CCFB" />
              ))}
            </g>
            <rect x="146" y="404" width="408" height="9" rx="4.5" fill="#FFFFFF" opacity="0.65" />
          </g>

          {/* --- crate of apples (the supply) ------------------------ */}
          <g className="pm-scene__crate">
            <use href="#pm-apple" x="218" y="350" />
            <use href="#pm-apple" x="251" y="346" />
            <use href="#pm-apple" x="284" y="350" />
            <rect
              x="196"
              y="356"
              width="110"
              height="50"
              rx="9"
              fill="#F4E8DB"
              stroke="#E0CDB8"
              strokeWidth="2"
            />
            <rect x="213" y="368" width="76" height="27" rx="7" fill="#FFFFFF" stroke="#EADCCC" strokeWidth="1.5" />
            <text
              x="251"
              y="386"
              textAnchor="middle"
              fontFamily="inherit"
              fontSize="15"
              fontWeight="800"
              fill="#2E1B12"
            >
              ₦120
            </text>
          </g>

          {/* --- basket (the destination) ---------------------------- */}
          <g className="pm-scene__basket">
            <use href="#pm-apple" x="402" y="344" />
            <use href="#pm-apple" x="440" y="340" />
            <use href="#pm-apple" x="478" y="344" />
          </g>

          {/* the two apples that travel: the outer group places them,
              the inner one carries the motion */}
          <g className="pm-scene__flyers">
            <g transform="translate(240 318)">
              <use className="pm-scene__fly pm-scene__fly--a" href="#pm-apple" />
            </g>
            <g transform="translate(276 318)">
              <use className="pm-scene__fly pm-scene__fly--b" href="#pm-apple" />
            </g>
          </g>

          <g className="pm-scene__basket">
            <path
              d="M386 366 H494 L484 408 H396 Z"
              fill="#F2E4D4"
              stroke="#D9C2A9"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <g stroke="#E0CBB2" strokeWidth="2" strokeLinecap="round">
              <line x1="391" y1="382" x2="489" y2="382" />
              <line x1="394" y1="396" x2="486" y2="396" />
              <line x1="414" y1="368" x2="411" y2="406" />
              <line x1="440" y1="368" x2="440" y2="406" />
              <line x1="466" y1="368" x2="469" y2="406" />
            </g>
            <rect x="376" y="352" width="128" height="18" rx="9" fill="#E8D6C2" />
            <rect x="376" y="352" width="128" height="7" rx="3.5" fill="#F3E6D7" />
          </g>

          {/* a small spark when the apples land */}
          <g className="pm-scene__spark" stroke="#FE885C" strokeWidth="3.5" strokeLinecap="round">
            <line x1="516" y1="316" x2="516" y2="303" />
            <line x1="526" y1="324" x2="536" y2="318" />
            <line x1="506" y1="324" x2="496" y2="318" />
          </g>
        </g>
      </svg>

      {/* Glass chips sit on top as real HTML so the blur is genuine. */}
      <div className="pm-scene__chip pm-glass">
        <span className="pm-scene__chip-dot" aria-hidden="true" />
        <span className="pm-scene__chip-text">
          <span className="pm-scene__chip-label">In the basket</span>
          <span className="pm-scene__chip-value">
            <span className="pm-odo" aria-hidden="true">
              <span className="pm-odo__strip">
                <span>3</span>
                <span>5</span>
              </span>
            </span>
            <span className="pm-sr-only">5</span>
            <span className="pm-scene__chip-unit">apples</span>
          </span>
        </span>
      </div>

      <div className="pm-scene__plus" aria-hidden="true">
        +2
      </div>

      <Character
        className="pm-scene__character"
        character={character}
        priority={priority}
      />
    </div>
  );
}
