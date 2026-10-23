import { useEffect, useRef, useState } from "react";
import { MAP_WORDS } from "../data/dialogue";
import { LANTERN } from "../data/lanterns";
import { MAP_ART, PLACES, isOpen } from "../data/places";
import { after, cancel } from "../lib/pause";
import { useReadAloud } from "../lib/speech";
import "./MarketMap.css";

/*
  The market map, built from the map demo: one clear picture of the
  market (data/places.js), and the haze drawn over it in CSS. Each open
  place shows the clear picture through a soft hole in the haze. A dashed
  chain runs along the main path from place to place, with a small
  padlock between each place and the next that isn't open yet; closed
  places have a wisp of haze and a padlock, open ones a dot, and the
  place the child is at has their pin, with their Zizi's face.

  `opening`: a place whose haze lifts now. The two lanterns that open it
  (data/lanterns.js) float to it, its haze pulls back, its chain falls
  away, and they are spent. Without motion it is simply open.

  A tap on a place opens its card: the Fruit Stall's has "Carry on here"
  (`onCarryOn`); one open but not built yet says so; one still under the
  haze says Blob's friends haven't reached it yet.
*/

const PADLOCK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="currentColor" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const HERE = "fruit"; // where the child is: the only place built so far

export default function MarketMap({ zizi, cleared, opening = null, onCarryOn }) {
  // opening: "waiting" → "arriving" (the lanterns float in) → "lifting" → "open"
  const [step, setStep] = useState(opening ? "waiting" : "open");
  const [card, setCard] = useState(null);
  const scrollRef = useRef(null);
  const boardRef = useRef(null);

  useEffect(() => {
    if (!opening) return undefined;
    const timers = [after(() => setStep("arriving"), 500), after(() => setStep("lifting"), 1900), after(() => setStep("open"), 3600)];
    return () => timers.forEach(cancel);
  }, [opening]);

  // On a narrow screen the map scrolls sideways: start with the child's
  // pin, and the place opening, both in view (centred between them).
  useEffect(() => {
    const scroller = scrollRef.current;
    const board = boardRef.current;
    if (!scroller || !board || board.offsetWidth <= scroller.clientWidth) return;
    const here = PLACES.find((place) => place.id === HERE);
    const next = PLACES.find((place) => place.id === opening) ?? here;
    const middle = (here.x + next.x) / 2;
    scroller.scrollLeft = Math.max(0, (board.offsetWidth * middle) / 100 - scroller.clientWidth / 2);
  }, [opening]);

  const lifted = (place) => isOpen(place, cleared) && !(place.id === opening && (step === "waiting" || step === "arriving"));
  const target = PLACES.find((place) => place.id === opening);
  const words = card == null ? null : cardWords(PLACES[card], lifted(PLACES[card]));

  return (
    <section className="pm-map" aria-label={MAP_WORDS.label}>
      <div ref={scrollRef} className="pm-map__scroll">
        <div ref={boardRef} className="pm-map__board" style={{ "--map": `url("${MAP_ART.src}")` }}>
          <img className="pm-map__art" src={MAP_ART.src} width={MAP_ART.w} height={MAP_ART.h} alt="" draggable={false} />
          <div className="pm-map__veil" aria-hidden="true" />
          <div className="pm-map__veil pm-map__veil--light" aria-hidden="true" />

          {/* The clear market, through a soft hole in the haze over each open place. */}
          {PLACES.map((place) => {
            const mask = `radial-gradient(circle at ${place.x}% ${place.y}%, #000 0%, #000 ${place.r * 0.45}%, transparent ${place.r}%)`;
            return (
              <div
                key={place.id}
                className={`pm-map__clear${lifted(place) ? " is-on" : ""}`}
                style={{ WebkitMaskImage: mask, maskImage: mask }}
                aria-hidden="true"
              />
            );
          })}

          {/* The path from place to place; a chain until the next place opens. */}
          <svg className="pm-map__chains" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {PLACES.slice(0, -1).map((a, i) => {
              const b = PLACES[i + 1];
              return (
                <path
                  key={a.id}
                  className={`pm-map__chain${lifted(b) ? " is-gone" : ""}`}
                  d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 3.5} ${b.x} ${b.y}`}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          {PLACES.slice(0, -1).map((a, i) => {
            const b = PLACES[i + 1];
            return (
              <span
                key={a.id}
                className={`pm-map__link-lock${lifted(b) ? " is-gone" : ""}`}
                style={{ left: `${(a.x + b.x) / 2}%`, top: `${(a.y + b.y) / 2 - 1.8}%` }}
                aria-hidden="true"
              >
                {PADLOCK}
              </span>
            );
          })}

          {/* A wisp of haze over each place still under it. */}
          {PLACES.map((place, i) =>
            lifted(place) ? null : (
              <svg
                key={place.id}
                className="pm-map__wisp"
                viewBox="0 0 60 80"
                style={{ left: `${place.x - 3}%`, top: `${place.y - 15}%` }}
                aria-hidden="true"
              >
                <path d="M30 76 C 16 60, 44 50, 30 34 C 19 22, 41 16, 32 4" style={{ animationDelay: `${i * 1.1}s` }} />
              </svg>
            )
          )}

          {/* The places: the child's pin, a dot where it's open, a padlock where it isn't. */}
          {PLACES.map((place, i) => {
            const open = lifted(place);
            return (
              <button
                key={place.id}
                type="button"
                className={`pm-map__spot${place.id === HERE ? " is-here" : open ? " is-open" : " is-shut"}`}
                style={{ left: `${place.x}%`, top: `${place.y}%` }}
                aria-label={open ? place.name : MAP_WORDS.shutLabel}
                onClick={() => setCard(i)}
              >
                {place.id === HERE ? (
                  <svg className="pm-map__pin" viewBox="0 0 30 38" aria-hidden="true">
                    <defs>
                      <clipPath id="pm-map-face">
                        <circle cx="15" cy="13" r="9.5" />
                      </clipPath>
                    </defs>
                    <path
                      d="M15 37 C15 37 2.5 22 2.5 13.5 A12.5 12.5 0 0 1 27.5 13.5 C27.5 22 15 37 15 37Z"
                      fill="#fdf3e0"
                      stroke="rgba(60,40,20,.55)"
                      strokeWidth="1.4"
                    />
                    <circle cx="15" cy="13" r="9.5" fill="#eef0fe" />
                    <image
                      href={zizi.src}
                      x="5.5"
                      y="3.5"
                      width="19"
                      height="19"
                      preserveAspectRatio="xMidYMin slice"
                      clipPath="url(#pm-map-face)"
                    />
                  </svg>
                ) : open ? (
                  <span className="pm-map__dot" />
                ) : (
                  <span className="pm-map__shut">{PADLOCK}</span>
                )}
              </button>
            );
          })}

          {/* The two lanterns that open the next place, floating to it. */}
          {target &&
            step !== "open" &&
            [0, 1].map((k) => (
              <img
                key={k}
                className={`pm-map__lantern is-${step}`}
                src={LANTERN.lit.src}
                width={LANTERN.lit.w}
                height={LANTERN.lit.h}
                alt=""
                draggable={false}
                style={{ "--to-x": `${target.x + (k ? 2.2 : -2.2)}%`, "--to-y": `${target.y - 6}%`, "--from-x": `${48 + k * 4}%` }}
              />
            ))}
        </div>
      </div>

      {opening && step !== "open" && (
        <p className="pm-sr-only" role="status">
          {MAP_WORDS.opening.replace("{place}", target.name)}
        </p>
      )}

      {words && (
        <MapCard
          words={words}
          onClose={() => setCard(null)}
          onCarryOn={PLACES[card].built && lifted(PLACES[card]) ? onCarryOn : null}
        />
      )}
    </section>
  );
}

/** What a place's card says: open and built, open and not built yet, or still under the haze. */
function cardWords(place, open) {
  if (!open) return { title: MAP_WORDS.shut.title, text: MAP_WORDS.shut.text };
  if (!place.built) return { title: place.name, text: MAP_WORDS.notYet };
  return { title: place.name, text: place.teaches };
}

function MapCard({ words, onClose, onCarryOn }) {
  const buttonRef = useRef(null);
  useReadAloud(`${words.title}. ${words.text}`, "narrator");
  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, [words.title]);

  return (
    <div
      className="pm-map__sheet"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pm-map__card" role="dialog" aria-modal="true" aria-labelledby="pm-map-card-title">
        <h2 id="pm-map-card-title" className="pm-map__card-title">
          {words.title}
        </h2>
        <p className="pm-map__card-text">{words.text}</p>
        <div className="pm-map__card-row">
          {onCarryOn ? (
            <>
              <button ref={buttonRef} type="button" className="pm-map__go" onClick={onCarryOn}>
                {MAP_WORDS.carryOn}
              </button>
              <button type="button" className="pm-map__not-now" onClick={onClose}>
                {MAP_WORDS.notNow}
              </button>
            </>
          ) : (
            <button ref={buttonRef} type="button" className="pm-map__go" onClick={onClose}>
              {MAP_WORDS.allRight}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
