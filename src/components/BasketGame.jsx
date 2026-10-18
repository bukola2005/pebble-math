import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { BASKET, CRATE, ORANGE } from "../data/market";
import "./BasketGame.css";

/*
  The Fruit Stall's play area: oranges on the stall's table, and the
  child's basket on the ground just in front of it, so every drag is a
  short one, down off the table and in.

  Two separate things a child can do with an orange:
    tap   counts it. A number badge appears (1, 2, 3...); tapping a
          counted orange clears it and the rest renumber. A scratchpad for
          the child: it changes nothing in the game.
    drag  moves it. Dropped on the basket it goes in, and the basket's own
          count, on a tag on its rim, goes up. Dropped anywhere else it
          springs back. An orange in the basket can't be picked up again,
          so nothing is ever counted twice.

  Both work by touch, mouse and pen (pointer events). With a keyboard:
  Enter counts the focused orange, B puts it in the basket.

  Everything is placed from where the stall picture is on screen, so the
  oranges sit on its table at any screen size. The parent owns the state
  (which oranges are counted, which are in the basket); this component
  owns how it feels.
*/

// The stall picture (/stall/fruit-stall.webp, 866×787), as fractions of
// its box: the table top's usable width, the line the front row of
// oranges rests on, and the bottom of the table's front edge.
const TABLE = { left: 0.07, right: 0.93, rest: 0.655, face: 0.705 };

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// A tiny seeded random, so a round's layout stays put across re-renders
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

/** Where the table, the basket and the stall are on screen right now. */
function measure(stall) {
  const s = stall.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const geo = {
    stallH: s.height,
    cx: s.left + s.width / 2,
    left: Math.max(s.left + s.width * TABLE.left, 12),
    right: Math.min(s.left + s.width * TABLE.right, vw - 12),
    rest: s.top + s.height * TABLE.rest,
    face: s.top + s.height * TABLE.face,
  };
  // The basket stands on the ground in front of the table, as big as the
  // space below the table allows, with only its handles rising in front
  // of the table's edge (the basket ignores taps, so an orange behind a
  // handle can still be picked up).
  const bottom = vh - 8;
  const h = Math.max(110, Math.min(s.height * 0.48, (bottom - geo.face) / 0.72));
  const w = (h * BASKET.w) / BASKET.h;
  geo.basket = { left: Math.min(Math.max(geo.cx - w / 2, 8), vw - w - 8), top: bottom - h, width: w, height: h };
  return geo;
}

/**
 * The oranges on the table: rows along it, the front row fullest, each
 * row further back sitting a little higher and set between the gaps of
 * the one in front, like a heap.
 *
 * As few rows as will keep each orange at least 64px (a comfortable
 * target for a small finger), and never more than three; if no layout
 * reaches 64px, the one with the biggest oranges.
 */
const GOOD_SIZE = 64;

function arrange(ids, seed, geo) {
  const n = ids.length;
  const width = geo.right - geo.left;
  const biggest = Math.min(geo.stallH * 0.16, 104);
  // How many fit in `rows` rows of up to `across`, every other row one
  // shorter so it sits in the gaps of the row in front.
  const fits = (across, rows) => across * Math.ceil(rows / 2) + Math.max(across - 1, 1) * Math.floor(rows / 2);
  let choice = null;
  for (let rows = 1; rows <= 3; rows++) {
    let across = 1;
    while (fits(across, rows) < n) across++;
    const size = Math.min((width / across) * 0.92, biggest);
    if (!choice || (choice.size < GOOD_SIZE && size > choice.size)) choice = { across, size };
  }
  const perRow = choice.across;
  const size = Math.round(Math.max(48, choice.size));
  const spacing = width / perRow;

  const counts = [];
  for (let left = n, row = 0; left > 0; row++) {
    const room = row % 2 && perRow > 1 ? perRow - 1 : perRow;
    counts.push(Math.min(room, left));
    left -= room;
  }

  const rand = seeded(seed);
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const spots = {};
  let next = 0;
  counts.forEach((count, row) => {
    const start = geo.left + (width - count * spacing) / 2 + spacing / 2;
    for (let k = 0; k < count; k++) {
      const x = start + k * spacing + (rand() * 2 - 1) * size * 0.06;
      const bottom = geo.rest - row * size * 0.52 + (rand() * 2 - 1) * size * 0.04;
      spots[order[next++]] = { x: x - size / 2, y: bottom - size, row, tilt: Math.round((rand() * 2 - 1) * 14) };
    }
  });
  return { size, spots };
}

/*
  Where oranges sit in the basket, in % of the basket picture: the front
  row fills first, then the row behind, then two on top. They stay left of
  the front handle. Drawn back to front.
*/
const SLOTS = [
  { x: 24, y: 52, layer: 3 },
  { x: 37, y: 53, layer: 3 },
  { x: 50, y: 53, layer: 3 },
  { x: 63, y: 52, layer: 3 },
  { x: 19, y: 41, layer: 2 },
  { x: 32, y: 42, layer: 2 },
  { x: 45, y: 42, layer: 2 },
  { x: 58, y: 41, layer: 2 },
  { x: 30, y: 30, layer: 1 },
  { x: 45, y: 30, layer: 1 },
];

/*
  A crate of ten: the oranges in two rows of five, like a ten frame, set
  along the crate's open top (it is drawn at an angle). Corners of the
  opening, in % of /stall/crate.webp: front (40, 52), right (92, 27),
  left (8, 31).
*/
const CRATE_SLOTS = Array.from({ length: 10 }, (_, i) => {
  const u = ((i % 5) + 0.5) / 5;
  const v = (Math.floor(i / 5) + 0.5) / 2;
  return { x: 40 + u * 52 + v * -32, y: 52 + u * -25 + v * -21 };
}).sort((a, b) => a.y - b.y);

/*
  After a full basket: the crate moves aside and what's left over goes on
  a cloth beside it, apart from the stall, so the leftovers can only mean
  one thing. Laid out to fit the screen, crate first.
*/
const ASIDE_GAP = 16;

function setAside(geo, count, orangeSize) {
  const b = geo.basket;
  const vw = window.innerWidth;
  const room = vw - 24;
  const cols = Math.min(count, 3);
  const rows = Math.ceil(count / cols);
  const size = Math.round(Math.min(orangeSize, b.width * 0.26, (room * 0.45 - 28) / (cols * 1.05)));
  const tray = { width: cols * size * 1.05 + 28, height: (rows - 1) * size * 0.9 + size + 26 };
  const crateWidth = Math.min(b.width * 1.1, room - ASIDE_GAP - tray.width);
  const whole = crateWidth + ASIDE_GAP + tray.width;
  const left = Math.max(12, Math.min(b.left + b.width / 2 - whole / 2, vw - 12 - whole));
  const bottom = b.top + b.height;
  tray.left = left + crateWidth + ASIDE_GAP;
  tray.top = bottom - tray.height;
  const spot = (i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, count - row * cols);
    const start = tray.left + (tray.width - inRow * size * 1.05) / 2;
    return { x: start + (i % cols) * size * 1.05, y: tray.top + 12 + row * size * 0.9 };
  };
  return { crate: { left, top: bottom - crateWidth * (CRATE.h / CRATE.w), width: crateWidth }, tray, size, spot };
}

/** Plays an element's move from where it was (`from`) to where it is now. */
function flyIn(el, from, duration) {
  if (!from || !el || reducedMotion()) return;
  const to = el.getBoundingClientRect();
  if (!to.width) return;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const scale = from.width / to.width;
  el.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: "translate(0, 0) scale(1)" }],
    { duration, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" }
  );
}

export default function BasketGame({
  ref,
  stall,
  seed,
  oranges,
  inBasket,
  counted,
  canDrag,
  canTap = true,
  basketHidden = false,
  dim = false,
  gapsUpTo = 0,
  gapsPulse = false,
  closed = false,
  trayed = false,
  spotlight = null,
  total = 0,
  demoKey = 0,
  onTap,
  onDrop,
  onLeave,
}) {
  const basketRef = useRef(null);
  const [geo, setGeo] = useState(null);
  const [demo, setDemo] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const justPlaced = useRef(null); // the orange that just went in, for its sparkles
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const flights = useRef(new Map()); // id → the rect it is flying from
  const tableEls = useRef(new Map());
  const basketEls = useRef(new Map());

  // Follow the stall picture as the screen changes.
  useLayoutEffect(() => {
    if (!stall) return undefined;
    const update = () => setGeo(measure(stall));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stall);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [stall]);

  const layout = geo ? arrange(oranges, seed, geo) : null;

  const nearestOrange = () => {
    const b = basketRef.current?.getBoundingClientRect();
    let best = null;
    let bestDistance = Infinity;
    for (const el of tableEls.current.values()) {
      const r = el.getBoundingClientRect();
      const d = b ? Math.hypot(r.left + r.width / 2 - (b.left + b.width / 2), r.top - b.top) : 0;
      if (d < bestDistance) [best, bestDistance] = [el, d];
    }
    return best;
  };

  useImperativeHandle(ref, () => ({
    basket: () => basketRef.current,
    nearestOrange,
    // Sends an orange from the basket back to its place on the table.
    flyBack: (id) => {
      const el = basketEls.current.get(id);
      if (el) flights.current.set(id, el.getBoundingClientRect());
      onLeave(id);
    },
  }));

  // Blob's third hint: one orange's trip to the basket, slowly, once.
  useEffect(() => {
    if (!demoKey || !geo) return;
    const from = nearestOrange()?.getBoundingClientRect();
    const slot = SLOTS[Math.min(inBasket.length, SLOTS.length - 1)];
    if (!from) return;
    const b = geo.basket;
    const toX = b.left + (b.width * slot.x) / 100;
    const toY = b.top + (b.height * slot.y) / 100;
    setDemo({
      key: demoKey,
      left: from.left,
      top: from.top,
      size: from.width,
      dx: toX - (from.left + from.width / 2),
      dy: toY - (from.top + from.height / 2),
    });
    // Gone once it has played (a timer rather than animationend, so it
    // also goes when motion is reduced and nothing animates).
    const id = window.setTimeout(() => setDemo(null), 2900);
    return () => window.clearTimeout(id);
    // Only a new hint tap starts it again.
  }, [demoKey]);

  // --- dragging ---------------------------------------------------------------
  const start = (event, id) => {
    suppressClick.current = false;
    if (!canDrag || drag.current) return; // one orange at a time
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
      // Generous: anywhere over the basket, a little beside it, or just
      // above its mouth counts.
      const b = basketRef.current.getBoundingClientRect();
      d.zone = {
        left: b.left - b.width * 0.2,
        right: b.right + b.width * 0.2,
        top: b.top - b.height * 0.35,
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
      if (onDrop(d.id)) {
        justPlaced.current = d.id;
        return;
      }
      flights.current.delete(d.id);
    }
    springHome(d.el);
  };

  const dropByKey = (id, el) => {
    if (!canDrag) return;
    flights.current.set(id, el.getBoundingClientRect());
    if (onDrop(id)) justPlaced.current = id;
    else flights.current.delete(id);
  };

  // --- landing, both ways ---------------------------------------------------------
  const keep = (map, id) => (el) => {
    if (el) map.current.set(id, el);
    else map.current.delete(id);
  };

  // Anything that just changed place flies from where it was. An orange
  // that has just gone into the basket also sends a few sparkles from
  // where it lands to the basket's count (measured before it starts
  // flying, so from where it ends up).
  useLayoutEffect(() => {
    const placed = justPlaced.current;
    if (placed && basketEls.current.has(placed)) {
      justPlaced.current = null;
      const tag = basketRef.current?.querySelector(".pm-basket__tag")?.getBoundingClientRect();
      if (tag && !reducedMotion()) {
        const o = basketEls.current.get(placed).getBoundingClientRect();
        const x = o.left + o.width / 2;
        const y = o.top + o.height / 2;
        const key = `${placed}-${Date.now()}`;
        setSparkles((list) => [
          ...list,
          { key, x, y, dx: tag.left + tag.width / 2 - x, dy: tag.top + tag.height / 2 - y },
        ]);
        window.setTimeout(() => setSparkles((list) => list.filter((s) => s.key !== key)), 700);
      }
    }
    for (const [id, from] of flights.current) {
      const el = basketEls.current.get(id) ?? tableEls.current.get(id);
      if (!el) continue;
      flyIn(el, from, 300);
      flights.current.delete(id);
    }
  });

  if (!layout) return <div className="pm-game" />;

  const onTable = oranges.filter((id) => !inBasket.includes(id));
  const asideAt = new Map(onTable.map((id, i) => [id, i]));
  const aside = trayed && onTable.length ? setAside(geo, onTable.length, layout.size) : null;
  // Rows further back first, so the front row is drawn over them.
  onTable.sort((a, b) => layout.spots[b].row - layout.spots[a].row);

  const inSlots = inBasket.slice(0, SLOTS.length).map((id, i) => ({ id, ...SLOTS[i] }));
  inSlots.sort((a, b) => a.layer - b.layer);
  const gaps = SLOTS.slice(inBasket.length, Math.min(gapsUpTo, SLOTS.length));
  const b = geo.basket;

  return (
    <div className={`pm-game${dim ? " is-dim" : ""}${spotlight ? ` pm-game--spot-${spotlight}` : ""}`}>
      <p id="pm-orange-help" className="pm-sr-only">
        Press Enter to count it. Press B to put it in the basket.
      </p>

      {/* Everything but what Blob is naming goes dim. */}
      {spotlight && <div className="pm-game__dim" aria-hidden="true" />}

      {/* The cloth the leftovers go on, with how many there are. */}
      {aside && (
        <div
          className="pm-tray"
          style={{ left: aside.tray.left, top: aside.tray.top, width: aside.tray.width, height: aside.tray.height }}
          aria-hidden="true"
        >
          <span className="pm-tray__tag">{onTable.length}</span>
        </div>
      )}

      {onTable.map((id) => {
        const spot = layout.spots[id];
        const badge = counted.indexOf(id) + 1;
        const at = aside ? aside.spot(asideAt.get(id)) : null;
        return (
          <button
            key={id}
            ref={keep(tableEls, id)}
            type="button"
            className={`pm-orange${aside ? " is-set-aside" : ""}`}
            data-id={id}
            style={
              at
                ? { left: at.x, top: at.y, width: aside.size, height: aside.size }
                : { left: spot.x, top: spot.y, width: layout.size, height: layout.size }
            }
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
              if (canTap) onTap(id);
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

      {/* Hidden until the child is given it; then it arrives with a pop. */}
      <div
        className={`pm-basket${basketHidden ? " is-hidden" : ""}${closed ? " is-closed" : ""}`}
        ref={basketRef}
        style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
      >
        <img className="pm-basket__art" src={BASKET.src} width={BASKET.w} height={BASKET.h} alt="" draggable={false} />
        {inSlots.map((slot) => (
          <span
            key={slot.id}
            ref={keep(basketEls, slot.id)}
            className="pm-basket__orange"
            style={{ left: `${slot.x - 11}%`, top: `${slot.y - 13}%` }}
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
        {/* The empty spaces still to fill, as outlines. */}
        {gaps.map((slot, i) => (
          <span
            key={`gap-${inBasket.length + i}`}
            className={`pm-basket__gap${gapsPulse ? " is-pulsing" : ""}`}
            style={{ left: `${slot.x - 11}%`, top: `${slot.y - 12}%` }}
            aria-hidden="true"
          />
        ))}
        {/* The basket's own count, on a tag tied to its rim. */}
        <span key={inBasket.length} className="pm-basket__tag" aria-hidden="true">
          {inBasket.length}
        </span>
        <p className="pm-sr-only" aria-live="polite">
          {inBasket.length === 1 ? "1 orange in the basket" : `${inBasket.length} oranges in the basket`}
        </p>
      </div>

      {/* A full basket closes into a crate of ten, which stays. */}
      {closed && (
        <div
          className="pm-crate"
          style={
            aside
              ? aside.crate
              : {
                  left: b.left + b.width / 2 - b.width * 0.55,
                  top: b.top + b.height - b.width * 1.1 * (CRATE.h / CRATE.w),
                  width: b.width * 1.1,
                }
          }
          role="img"
          aria-label="A crate of ten oranges"
        >
          <img className="pm-crate__art" src={CRATE.src} width={CRATE.w} height={CRATE.h} alt="" draggable={false} />
          {CRATE_SLOTS.map((slot, i) => (
            <span
              key={i}
              className="pm-crate__orange"
              style={{ left: `${slot.x - 8}%`, top: `${slot.y - 12}%`, animationDelay: `${0.25 + i * 0.05}s` }}
            >
              <img src={ORANGE.src} width={ORANGE.w} height={ORANGE.h} alt="" draggable={false} />
            </span>
          ))}
          <span className="pm-crate__tag" aria-hidden="true">
            10
          </span>
        </div>
      )}

      {/* Both together, and how many that makes, above the gap between them. */}
      {aside && spotlight === "both" && (
        <span
          className="pm-game__total"
          style={{ left: aside.tray.left - ASIDE_GAP / 2, top: aside.tray.top - 40 }}
          aria-hidden="true"
        >
          {total}
        </span>
      )}

      {/* A few sparkles from the orange just placed to the basket's count. */}
      {sparkles.map((burst) => (
        <Sparkles key={burst.key} x={burst.x} y={burst.y} dx={burst.dx} dy={burst.dy} />
      ))}

      {/* Blob's slow demonstration: a ghost orange makes the trip once. */}
      {demo && (
        <div
          key={demo.key}
          className="pm-game__demo"
          style={{ left: demo.left, top: demo.top, width: demo.size, height: demo.size, "--dx": `${demo.dx}px`, "--dy": `${demo.dy}px` }}
          aria-hidden="true"
        >
          <img src={ORANGE.src} alt="" draggable={false} />
        </div>
      )}
    </div>
  );
}

/*
  Five small four-point stars that scatter a little from (x, y) and then
  fly to the count, all within half a second. Alternately white and
  lavender: never orange, which only ever means "press this".
*/
const SPARKLE_SPREAD = [
  [-18, -14],
  [14, -20],
  [22, 6],
  [-20, 10],
  [2, -26],
];

function Sparkles({ x, y, dx, dy }) {
  return SPARKLE_SPREAD.map(([mx, my], i) => (
    <svg
      key={i}
      className={`pm-sparkle${i % 2 ? " pm-sparkle--lavender" : ""}`}
      viewBox="0 0 20 20"
      aria-hidden="true"
      style={{
        left: x,
        top: y,
        "--mx": `${mx}px`,
        "--my": `${my}px`,
        "--dx": `${dx + mx * 0.2}px`,
        "--dy": `${dy + my * 0.2}px`,
        animationDelay: `${i * 15}ms`,
      }}
    >
      <path d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" />
    </svg>
  ));
}
