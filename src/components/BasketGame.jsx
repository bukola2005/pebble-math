import { useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { BASKET, CRATE, ORANGE } from "../data/market";
import "./BasketGame.css";

/*
  The Fruit Stall's play area: oranges scattered on the ground, and the
  child's basket.

  Two separate things a child can do with an orange:
    tap   counts it. A number badge appears (1, 2, 3...); tapping a
          counted orange clears it and the rest renumber. A scratchpad for
          the child: it changes nothing in the game.
    drag  moves it. Dropped on the basket it goes in, and the basket's own
          count goes up. Dropped anywhere else it springs back home. An
          orange in the basket can't be picked up again, so nothing is
          ever counted twice.

  Both work by touch, mouse and pen (pointer events). With a keyboard:
  Enter counts the focused orange, B puts it in the basket.

  The parent owns the state (which oranges are counted, which are in the
  basket); this component owns how it feels.
*/

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// A tiny seeded random, so a round's scatter stays put across re-renders
// and when the screen turns.
function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lays the oranges out in the box: the biggest grid of cells that fits
 * them with a few cells to spare, a random cell for each orange, nudged
 * off-centre and tilted, so they look tipped out rather than lined up.
 */
function scatter(ids, seed, width, height) {
  const n = ids.length;
  const grid = (cells) => {
    let best = null;
    for (let rows = 1; rows <= cells; rows++) {
      const cols = Math.ceil(cells / rows);
      const cell = Math.min(width / cols, height / rows);
      if (!best || cell > best.cell) best = { rows, cols, cell };
    }
    return best;
  };
  let { rows, cols, cell } = grid(n + Math.ceil(n / 4));
  if (cell < 58) ({ rows, cols, cell } = grid(n)); // no room to spare

  const rand = seeded(seed);
  const cells = Array.from({ length: rows * cols }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const cw = width / cols;
  const ch = height / rows;
  const size = Math.round(Math.max(48, Math.min(104, Math.min(cw, ch) * 0.84)));
  const slackX = Math.max(0, cw - size) / 2;
  const slackY = Math.max(0, ch - size) / 2;

  const spots = {};
  ids.forEach((id, i) => {
    const col = cells[i] % cols;
    const row = Math.floor(cells[i] / cols);
    spots[id] = {
      x: (col + 0.5) * cw + (rand() * 2 - 1) * slackX * 0.85 - size / 2,
      y: (row + 0.5) * ch + (rand() * 2 - 1) * slackY * 0.85 - size / 2,
      tilt: Math.round((rand() * 2 - 1) * 16),
    };
  });
  return { size, spots };
}

/*
  Where oranges sit in the basket, in % of the basket picture: the front
  row fills first, then the row behind, then two on top. They stay left of
  the front handle. Drawn back to front.
*/
const SLOTS = [
  { x: 25, y: 53, layer: 3 },
  { x: 37, y: 54, layer: 3 },
  { x: 49, y: 54, layer: 3 },
  { x: 61, y: 53, layer: 3 },
  { x: 20, y: 43, layer: 2 },
  { x: 32, y: 44, layer: 2 },
  { x: 44, y: 44, layer: 2 },
  { x: 56, y: 43, layer: 2 },
  { x: 30, y: 34, layer: 1 },
  { x: 44, y: 34, layer: 1 },
];

/** Plays an element's move from where it was (`from`) to where it is now. */
function flyIn(el, from, duration) {
  if (!from || !el || reducedMotion()) return;
  const to = el.getBoundingClientRect();
  if (!to.width) return;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const scale = from.width / to.width;
  el.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      { transform: "translate(0, 0) scale(1)" },
    ],
    { duration, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" }
  );
}

export default function BasketGame({
  ref,
  seed,
  oranges,
  inBasket,
  counted,
  enabled,
  basketHidden = false,
  dim = false,
  onTap,
  onDrop,
  onLeave,
}) {
  const pileRef = useRef(null);
  const basketRef = useRef(null);
  const [box, setBox] = useState(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const flights = useRef(new Map()); // id → the rect it is flying from
  const pileEls = useRef(new Map());
  const basketEls = useRef(new Map());

  // The pile's size decides the scatter; keep it current as the screen turns.
  useLayoutEffect(() => {
    const el = pileRef.current;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setBox((old) => (old && old.width === width && old.height === height ? old : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = box && box.width > 0 ? scatter(oranges, seed, box.width, box.height) : null;

  useImperativeHandle(ref, () => ({
    basket: () => basketRef.current,
    // The orange nearest the basket: the shortest first drag.
    nearestOrange: () => {
      const b = basketRef.current?.getBoundingClientRect();
      let best = null;
      let bestDistance = Infinity;
      for (const el of pileEls.current.values()) {
        const r = el.getBoundingClientRect();
        const d = b ? Math.hypot(r.left - b.left, r.top - b.top) : 0;
        if (d < bestDistance) [best, bestDistance] = [el, d];
      }
      return best;
    },
    // Sends an orange from the basket back to its place on the ground.
    flyBack: (id) => {
      const el = basketEls.current.get(id);
      if (el) flights.current.set(id, el.getBoundingClientRect());
      onLeave(id);
    },
  }));

  // --- dragging ---------------------------------------------------------------
  const start = (event, id) => {
    suppressClick.current = false;
    if (!enabled || drag.current) return; // one orange at a time
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const el = event.currentTarget;
    el.setPointerCapture?.(event.pointerId);
    drag.current = {
      id,
      el,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      touch: event.pointerType !== "mouse",
      dragging: false,
      over: false,
    };
  };

  const move = (event) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;

    if (!d.dragging) {
      // A small wobble is still a tap; beyond it, it's a drag.
      if (Math.hypot(dx, dy) < (d.touch ? 9 : 5)) return;
      d.dragging = true;
      suppressClick.current = true;
      const home = d.el.getBoundingClientRect();
      d.cx = home.left + home.width / 2;
      d.cy = home.top + home.height / 2;
      // On a touch screen the orange rides above the finger, so the child
      // can see what they are carrying.
      d.lift = d.touch ? home.height * 0.5 : 0;
      d.el.style.setProperty("--lift", `${d.lift}px`);
      d.el.classList.add("is-dragging");
      // Generous: anywhere over the basket or just above its mouth counts.
      const b = basketRef.current.getBoundingClientRect();
      d.zone = {
        left: b.left - b.width * 0.2,
        right: b.right + b.width * 0.2,
        top: b.top - b.height * 0.55,
        bottom: b.bottom + b.height * 0.1,
      };
    }

    d.el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    const x = d.cx + dx;
    const y = d.cy + dy - d.lift;
    const over = x >= d.zone.left && x <= d.zone.right && y >= d.zone.top && y <= d.zone.bottom;
    if (over !== d.over) {
      d.over = over;
      basketRef.current.classList.toggle("is-ready", over);
    }
  };

  const springHome = (el) => {
    el.classList.remove("is-dragging");
    el.classList.add("is-returning");
    el.style.transform = "";
    const done = () => el.classList.remove("is-returning");
    el.addEventListener("transitionend", done, { once: true });
    window.setTimeout(done, 600);
  };

  const end = (event, cancelled = false) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    drag.current = null;
    basketRef.current?.classList.remove("is-ready");
    if (!d.dragging) return; // a tap: the click that follows counts it

    if (!cancelled && d.over) {
      flights.current.set(d.id, d.el.querySelector(".pm-orange__body").getBoundingClientRect());
      suppressClick.current = false; // the orange is about to leave; no click follows
      if (onDrop(d.id)) return;
      flights.current.delete(d.id);
    }
    springHome(d.el);
  };

  const dropByKey = (id, el) => {
    if (!enabled) return;
    flights.current.set(id, el.getBoundingClientRect());
    if (!onDrop(id)) flights.current.delete(id);
  };

  // --- landing, both ways --------------------------------------------------------
  const setPileEl = (id) => (el) => {
    if (el) pileEls.current.set(id, el);
    else pileEls.current.delete(id);
  };
  const setBasketEl = (id) => (el) => {
    if (el) basketEls.current.set(id, el);
    else basketEls.current.delete(id);
  };

  // Anything that just changed place flies from where it was.
  useLayoutEffect(() => {
    for (const [id, from] of flights.current) {
      const el = basketEls.current.get(id) ?? pileEls.current.get(id);
      if (!el) continue;
      flyIn(el, from, 300);
      flights.current.delete(id);
    }
  });

  const onGround = layout ? oranges.filter((id) => !inBasket.includes(id)) : [];
  // Lower on the screen means nearer, so drawn later.
  onGround.sort((a, b) => layout.spots[a].y - layout.spots[b].y);

  const inSlots = inBasket.slice(0, SLOTS.length).map((id, i) => ({ id, ...SLOTS[i] }));
  inSlots.sort((a, b) => a.layer - b.layer);

  return (
    <div className={`pm-game${dim ? " is-dim" : ""}`}>
      <p id="pm-orange-help" className="pm-sr-only">
        Press Enter to count it. Press B to put it in the basket.
      </p>

      <div className="pm-game__pile" ref={pileRef}>
        <img
          className="pm-game__crate"
          src={CRATE.src}
          width={CRATE.w}
          height={CRATE.h}
          alt=""
          aria-hidden="true"
          draggable={false}
        />

        {onGround.map((id) => {
          const spot = layout.spots[id];
          const badge = counted.indexOf(id) + 1;
          return (
            <button
              key={id}
              ref={setPileEl(id)}
              type="button"
              className="pm-orange"
              data-id={id}
              style={{ left: spot.x, top: spot.y, width: layout.size, height: layout.size }}
              aria-label={badge ? `Orange, counted ${badge}` : "Orange"}
              aria-describedby="pm-orange-help"
              onPointerDown={(event) => start(event, id)}
              onPointerMove={move}
              onPointerUp={(event) => end(event)}
              onPointerCancel={(event) => end(event, true)}
              onLostPointerCapture={(event) => end(event, true)}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                onTap(id);
              }}
              onKeyDown={(event) => {
                if (event.key === "b" || event.key === "B") {
                  event.preventDefault();
                  dropByKey(id, event.currentTarget);
                }
              }}
            >
              <span className="pm-orange__body" style={{ "--tilt": `${spot.tilt}deg` }}>
                <img src={ORANGE.src} width={ORANGE.w} height={ORANGE.h} alt="" draggable={false} />
              </span>
              {badge > 0 && (
                <span key={badge} className="pm-orange__badge" aria-hidden="true">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hidden until the child is given it; then it arrives with a pop. */}
      <div className={`pm-basket${basketHidden ? " is-hidden" : ""}`} ref={basketRef}>
        <img
          className="pm-basket__art"
          src={BASKET.src}
          width={BASKET.w}
          height={BASKET.h}
          alt=""
          draggable={false}
        />
        {inSlots.map((slot) => (
          <span
            key={slot.id}
            ref={setBasketEl(slot.id)}
            className="pm-basket__orange"
            style={{ left: `${slot.x - 10}%`, top: `${slot.y - 12}%` }}
          >
            <img src={ORANGE.src} width={ORANGE.w} height={ORANGE.h} alt="" draggable={false} />
          </span>
        ))}
        {/* The basket's front wall again, over the oranges, so they sit in it. */}
        <img
          className="pm-basket__art pm-basket__front"
          src={BASKET.src}
          width={BASKET.w}
          height={BASKET.h}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <span key={inBasket.length} className="pm-basket__count" aria-hidden="true">
          {inBasket.length}
        </span>
        <p className="pm-sr-only" aria-live="polite">
          {inBasket.length === 1 ? "1 orange in the basket" : `${inBasket.length} oranges in the basket`}
        </p>
      </div>
    </div>
  );
}
