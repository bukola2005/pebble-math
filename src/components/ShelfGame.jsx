import { useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { CARTON, SHELF, TIN, TINS_PER_CARTON } from "../data/provisionStore";
import { after } from "../lib/pause";
import Sparkles from "./Sparkles";
// The spotlight's dim, the number tags and bubble, the counter's count and
// the cracking halves look as they do at the Fruit Stall.
import "./BasketGame.css";
import "./ShelfGame.css";

/*
  The Provision Store's play area (Chapter 2). Three places things can be:

    the delivery  on the ground in front of the shop, on a mat: full
                  cartons of ten tins at the back, loose tins in front.
                  Everything the child handles starts here, and each
                  thing keeps its place there while others are taken.
    the shelf     a wooden shelf unit standing on the ground, holding
                  `holds` tins, ten to each shelf of it (five at the back,
                  five in front), `had` of them on it already. A carton
                  fills a whole empty shelf; a loose tin goes in the first
                  gap, so a part-full shelf fills before an empty one.
                  Nothing outlines the gaps: bare wood is the empty space.
    the counter   the shop's own counter top, where a customer's order is
                  put, and Stage C's answers. Anything on it can be taken
                  back (dragged off it, or tapped).

  `target` is where a dragged carton or tin can go this round: "shelf" or
  "counter". Let go anywhere else, it springs back. A carton tapped (where
  `canCrack`) splits open, and its ten tins join the loose ones. A loose
  tin tapped (where `canTap`) is counted, 1, 2, 3, as oranges are: the
  child's scratchpad, changing nothing.

  Blob's hint (`hintKey`, a key that changes with each tap) is the same
  small thing as at the Fruit Stall: for a few seconds every carton shows
  its 10, and so does each shelf of the unit (what it holds). Nothing
  else: never what to do next, never a total.

  Everything is placed from where the shop picture is on screen. The
  parent owns the state; this component owns how it feels.
*/

// The shop picture (/art/stall-provision.webp, 423×468), as fractions of
// its box: the main counter top's two ends, and the line things on it
// stand on.
const COUNTER = { left: 0.385, right: 0.895, rest: 0.638 };

// The shelf picture (/art/prop-shelf.webp, 687×871) is cut into pieces,
// as fractions of its height, and stacked to make a unit of any number of
// shelves: its top, one shelf (repeated), its feet. Each cut is just
// under a board's front edge, where only the posts cross, so they join.
const CUT = { cap: [0, 0.12], level: [0.39, 0.625], foot: [0.875, 1] };
const span = ([from, to]) => to - from;

// Within one shelf piece: where each row of five stands (fraction of the
// piece's height) and where along it (centres, % of the unit's width).
// The back row stands between the back posts, a little smaller. A tin is
// `TIN_SIZE` of a piece's height.
const ROWS = [
  { rest: 0.6, xs: [34, 42, 50, 58, 66], scale: 0.84 },
  { rest: 0.75, xs: [36, 46.5, 57, 67.5, 78], scale: 1 },
];
const TIN_SIZE = 0.48;

// Blob's corner, bottom left, stays clear.
const BLOB_CORNER = 88;

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** How tall a unit of `levels` shelves is, for each pixel of its width. */
const unitRatio = (levels) => ((span(CUT.cap) + levels * span(CUT.level) + span(CUT.foot)) * SHELF.h) / SHELF.w;

/** Where the shop's counter, the shelf and the delivery are on screen right now. */
function measure(stall, levels) {
  const s = stall.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bottom = vh - 8;
  const counter = {
    left: Math.max(s.left + s.width * COUNTER.left, 10),
    right: Math.min(s.left + s.width * COUNTER.right, vw - 10),
    rest: s.top + s.height * COUNTER.rest,
  };

  // The shelf stands beside the shop, on its right, where there is room;
  // on a narrow screen, in front of it on the left, clear of Blob.
  let shelf = null;
  if (levels) {
    const ratio = unitRatio(levels);
    const tallest = Math.min(vh * 0.72, bottom - 70);
    const beside = s.right - s.width * 0.04;
    const room = vw - 12 - beside;
    let width = Math.min(tallest / ratio, 330);
    if (room >= Math.min(width, 170)) {
      width = Math.min(width, room);
      shelf = { side: "right", left: beside + (room - width) / 2, width };
    } else {
      width = Math.min(width, vw * 0.46);
      shelf = { side: "left", left: BLOB_CORNER, width };
    }
    shelf.height = width * ratio;
    shelf.top = bottom - shelf.height;
  }

  // The counter's usable length: where the shelf stands in front of it,
  // it stops short of the shelf.
  const usable = { ...counter };
  if (shelf && shelf.top < counter.rest) {
    if (shelf.side === "left") usable.left = Math.max(usable.left, shelf.left + shelf.width + 8);
    else usable.right = Math.min(usable.right, shelf.left - 8);
  }

  // The delivery, on the ground in front: left of the shop where there is
  // room (clear of the boxes painted at its foot), beside the shelf on a
  // narrow screen, never in Blob's corner.
  const groundTop = Math.max(counter.rest + 18, vh * 0.45);
  let delivery;
  if (shelf?.side === "left") {
    delivery = { left: shelf.left + shelf.width + 10, right: vw - 10, top: groundTop, bottom };
  } else {
    const right = Math.min(Math.max(s.left + s.width * 0.04, BLOB_CORNER + 240), vw - 10);
    delivery = { left: Math.max(BLOB_CORNER, right - 400), right, top: groundTop, bottom };
  }
  return { shopH: s.height, usable, shelf, delivery };
}

/**
 * The delivery: cartons at the back (in rows, each further row behind and
 * above the one in front, where the space is narrow), loose tins in rows
 * in front of them. A tin is at most 54px tall and shrinks first; a carton
 * keeps a size a finger can hold. Laid out for everything that has been
 * there this round, so nothing moves up when something is taken.
 */
function deliveryLayout(area, cartonCount, tinCount, shopH) {
  const width = area.right - area.left - 16;
  const front = area.bottom - 6;
  let tinH = Math.min(54, shopH * 0.11);
  let cartonW = Math.min(112, shopH * 0.24, width);
  const shape = () => {
    const tinW = (tinH * TIN.w) / TIN.h;
    const perRow = Math.max(1, Math.floor(width / (tinW * 1.12)));
    const rows = tinCount ? Math.ceil(tinCount / perRow) : 0;
    const across = Math.max(1, Math.min(cartonCount, Math.floor((width + 8) / (cartonW + 8))));
    const cartonRows = cartonCount ? Math.ceil(cartonCount / across) : 0;
    const cartonH = (cartonW * CARTON.h) / CARTON.w;
    const tinsTop = front - (rows ? tinH + (rows - 1) * tinH * 0.8 : 0);
    const cartonsBottom = rows ? tinsTop + tinH * 0.6 : front;
    const cartonsTop = cartonRows ? cartonsBottom - cartonH * (1 + (cartonRows - 1) * 0.55) : Infinity;
    return { tinW, perRow, rows, across, cartonH, tinsTop, cartonsBottom, top: Math.min(tinsTop, cartonsTop) };
  };
  let m = shape();
  while (front - m.top > area.bottom - area.top && tinH > 34) {
    tinH *= 0.93;
    m = shape();
  }
  while (front - m.top > area.bottom - area.top && cartonW > 52) {
    cartonW *= 0.93;
    m = shape();
  }
  const cartonsWidth = Math.min(cartonCount, m.across) * (cartonW + 8) - 8;
  const used = Math.max(cartonsWidth, Math.min(tinCount, m.perRow) * m.tinW * 1.12);
  const left = area.left + 8 + Math.max(0, (width - used) / 2);
  const backs = [cartonCount ? m.cartonsBottom : Infinity, m.rows ? m.tinsTop + tinH : Infinity];
  return {
    mat: { left: left - 14, top: Math.min(...backs) - 18, width: used + 28, height: area.bottom - (Math.min(...backs) - 18) },
    carton: (i) => {
      const row = Math.floor(i / m.across);
      const inRow = Math.min(m.across, cartonCount - row * m.across);
      const start = left + (used - (inRow * (cartonW + 8) - 8)) / 2;
      return { left: start + (i % m.across) * (cartonW + 8), top: m.cartonsBottom - m.cartonH * (1 + row * 0.55), width: cartonW, row };
    },
    tin: (i) => {
      const row = Math.floor(i / m.perRow);
      const inRow = Math.min(m.perRow, tinCount - row * m.perRow);
      const start = left + (used - inRow * m.tinW * 1.12) / 2;
      return { left: start + (i % m.perRow) * m.tinW * 1.12 + m.tinW * 0.06, top: m.tinsTop + row * tinH * 0.8, width: m.tinW, height: tinH };
    },
  };
}

/**
 * The counter top: cartons side by side from its left end, loose tins to
 * their right in a little stack (each row sits on the one below, one
 * shorter), shrunk to fit if it has to be.
 */
function counterLayout(usable, cartonCount, tinCount, shopH) {
  const width = usable.right - usable.left - 16;
  let cartonW = Math.min(78, shopH * 0.16);
  let tinH = Math.min(52, shopH * 0.105);
  const shape = () => {
    const tinW = (tinH * TIN.w) / TIN.h;
    // As few tins along the bottom as make a stack of three rows at most.
    let base = 1;
    while (base + Math.max(base - 1, 0) + Math.max(base - 2, 0) < tinCount) base++;
    return { tinW, base, whole: cartonCount * (cartonW + 6) + (tinCount ? base * tinW * 1.06 : 0) };
  };
  let m = shape();
  if (m.whole > width) {
    const k = Math.max(0.45, width / m.whole);
    cartonW *= k;
    tinH *= k;
    m = shape();
  }
  const cartonH = (cartonW * CARTON.h) / CARTON.w;
  const rows = [];
  for (let left = tinCount, row = 0; left > 0; row++) {
    const room = Math.max(m.base - row, 1);
    rows.push(Math.min(room, left));
    left -= room;
  }
  const tall = Math.max(cartonCount ? cartonH : 0, tinCount ? tinH * (1 + (rows.length - 1) * 0.9) : 0, 56);
  const zone = { left: usable.left - 6, top: usable.rest - tall - 16, width: usable.right - usable.left + 12, height: tall + 30 };
  const left = usable.left + 8 + Math.max(0, (width - m.whole) / 2) - zone.left;
  const rest = usable.rest - zone.top;
  const tinsLeft = left + cartonCount * (cartonW + 6);
  return {
    zone,
    rest,
    // Relative to the zone.
    carton: (i) => ({ left: left + i * (cartonW + 6), top: rest - cartonH, width: cartonW }),
    tin: (i) => {
      let row = 0;
      let k = i;
      while (k >= rows[row]) k -= rows[row++];
      const start = tinsLeft + ((m.base - rows[row]) * m.tinW * 1.06) / 2;
      return { left: start + k * m.tinW * 1.06, top: rest - tinH - row * tinH * 0.9, width: m.tinW, height: tinH };
    },
  };
}

/** Where slot `slot` (0: the top shelf, back row, left) is in a unit `width` wide, relative to the unit. */
function slotAt(slot, width) {
  const unitH = (width * SHELF.h) / SHELF.w;
  const levelH = span(CUT.level) * unitH;
  const k = slot % TINS_PER_CARTON;
  const row = ROWS[k < 5 ? 0 : 1];
  const height = TIN_SIZE * levelH * row.scale;
  const tinW = (height * TIN.w) / TIN.h;
  const top = (span(CUT.cap) + Math.floor(slot / TINS_PER_CARTON) * span(CUT.level)) * unitH;
  return { left: (row.xs[k % 5] / 100) * width - tinW / 2, top: top + row.rest * levelH - height, width: tinW, height, back: k < 5 };
}

/** A carton of ten tins; `tag` shows its 10 (`hinted`: for the hint's few seconds). */
function CartonOfTen({ tag = false, hinted = false }) {
  return (
    <>
      <img className="pm-carton__art" src={CARTON.src} width={CARTON.w} height={CARTON.h} alt="" draggable={false} />
      {tag && (
        <span className={`pm-carton__tag${hinted ? " is-hint" : ""}`} aria-hidden="true">
          10
        </span>
      )}
    </>
  );
}

/** Plays an element's move from where it was (`from`) to where it is now. */
function flyIn(el, from, duration, delay = 0) {
  if (!from || !el || reducedMotion()) return;
  const to = el.getBoundingClientRect();
  if (!to.width) return;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const scale = Math.min(from.width / to.width, 3);
  el.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: "translate(0, 0) scale(1)" }],
    { duration, delay, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "backwards" }
  );
}

/** Everything that has been in the delivery this round, in the order it came. */
function useStableOrder(ids, seed) {
  const seen = useRef({ seed, ids: [] });
  if (seen.current.seed !== seed) seen.current = { seed, ids: [] };
  for (const id of ids) if (!seen.current.ids.includes(id)) seen.current.ids.push(id);
  return seen.current.ids;
}

export default function ShelfGame({
  ref,
  stall,
  seed,
  cartons,
  tins,
  counted = [],
  shelf = null,
  counter = null,
  target = null,
  canDrag,
  canTap = false,
  canCrack = false,
  inviteCrack = false,
  hintKey = null,
  spotlight = null,
  answer = null,
  onTap,
  onPlace,
  onReturn,
  onCrack,
}) {
  const [geo, setGeo] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const [breaking, setBreaking] = useState(null); // a carton splitting open
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const flights = useRef(new Map()); // id → { from, duration, delay }
  const justPlaced = useRef(null); // the tin that just went on the shelf, for its sparkles
  const shelfRef = useRef(null);
  const zoneRef = useRef(null);
  const deliveryEls = useRef(new Map());
  const shelfEls = useRef(new Map());
  const counterEls = useRef(new Map());
  const levels = shelf ? shelf.holds / TINS_PER_CARTON : 0;
  const naming = spotlight === "cartons" || spotlight === "tins" || spotlight === "both";
  const allCartons = useStableOrder(cartons, `${seed}-cartons`);
  const allTins = useStableOrder(tins, `${seed}-tins`);

  // Follow the shop picture as the screen changes.
  useLayoutEffect(() => {
    if (!stall) return undefined;
    const update = () => setGeo(measure(stall, levels));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stall);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [stall, levels]);

  useImperativeHandle(ref, () => ({
    shelf: () => shelfRef.current,
    shelfTag: () => shelfRef.current?.querySelector(".pm-shelf__tag"),
    counter: () => zoneRef.current,
    // Notes where these things are now, so they fly from there to where
    // they go next: a right answer going up from the counter onto the
    // shelf, a carton's ten tins each from the carton.
    noteWhere: (ids) => {
      for (const id of ids) {
        const el = counterEls.current.get(id) ?? deliveryEls.current.get(id);
        if (!el) continue;
        const from = el.getBoundingClientRect();
        if (el.dataset.kind === "carton") {
          for (let k = 0; k < TINS_PER_CARTON; k++) flights.current.set(`${id}-${k}`, { from, duration: 420, delay: k * 30 });
        } else flights.current.set(id, { from, duration: 420 });
      }
    },
  }));

  // A carton going onto the shelf becomes its ten tins there, each flying
  // from the carton.
  const noteCarton = (id, from) => {
    for (let k = 0; k < TINS_PER_CARTON; k++) flights.current.set(`${id}-${k}`, { from, duration: 380, delay: k * 25 });
  };
  const forget = (id) => {
    for (const key of [...flights.current.keys()]) if (key === id || key.startsWith(`${id}-`)) flights.current.delete(key);
  };
  // Puts something where it was dropped (or taken back from the counter).
  const send = (id, kind, from, rect) => {
    if (kind === "carton" && from === "delivery" && target === "shelf") noteCarton(id, rect);
    else flights.current.set(id, { from: rect });
    const ok = from === "counter" ? onReturn(id, kind) : onPlace(id, kind);
    if (!ok) forget(id);
    else if (kind === "tin" && from === "delivery" && target === "shelf") justPlaced.current = id;
    return ok;
  };

  // --- dragging ---------------------------------------------------------------
  const start = (event, id, kind, from) => {
    suppressClick.current = false;
    if (!canDrag || drag.current) return; // one thing at a time
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const el = event.currentTarget;
    el.setPointerCapture?.(event.pointerId);
    drag.current = { id, kind, from, el, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, touch: event.pointerType !== "mouse", dragging: false, over: false };
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
      // On a touch screen it rides above the finger, so the child can see
      // what they are carrying.
      d.lift = d.touch ? home.height * 0.5 : 0;
      d.el.style.setProperty("--lift", `${d.lift}px`);
      d.el.classList.add("is-dragging");
      // Taken off the counter, it goes back unless let go over the counter.
      d.zoneEl = d.from === "counter" || target === "counter" ? zoneRef.current : target === "shelf" ? shelfRef.current : null;
      if (d.zoneEl) {
        const b = d.zoneEl.getBoundingClientRect();
        d.zone = { left: b.left - b.width * 0.15, right: b.right + b.width * 0.15, top: b.top - b.height * 0.2, bottom: b.bottom + b.height * 0.1 };
      }
    }
    d.el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    if (!d.zone) return;
    const x = d.cx + dx;
    const y = d.cy + dy - d.lift;
    const over = x >= d.zone.left && x <= d.zone.right && y >= d.zone.top && y <= d.zone.bottom;
    if (over !== d.over) {
      d.over = over;
      // (Taking something back off the counter doesn't light it.)
      if (d.from !== "counter") d.zoneEl.classList.toggle("is-ready", over);
    }
  };

  const springHome = (el) => {
    el.classList.remove("is-dragging");
    el.classList.add("is-returning");
    el.style.transform = "";
    const done = () => el.classList.remove("is-returning");
    el.addEventListener("transitionend", done, { once: true });
    after(done, 600);
  };

  const end = (event, cancelled = false) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    drag.current = null;
    d.zoneEl?.classList.remove("is-ready");
    if (!d.dragging) return; // a tap: the click that follows does it
    const leaving = d.from === "counter" ? !d.over : d.over;
    if (!cancelled && leaving) {
      suppressClick.current = false; // it is about to leave; no click follows
      if (send(d.id, d.kind, d.from, d.el.getBoundingClientRect())) return;
      // Not wanted there: it springs back, and the click that follows the
      // drag is not a tap.
      suppressClick.current = true;
    }
    springHome(d.el);
  };

  // By keyboard: B sends it; on the counter, Enter takes it back too.
  const byKey = (id, el, kind, from) => {
    if (!canDrag || (from === "delivery" && !target)) return;
    send(id, kind, from, el.getBoundingClientRect());
  };

  // A carton splits open: its halves fall apart and its ten tins tumble
  // out among the loose ones.
  const crack = (id) => {
    const el = deliveryEls.current.get(id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ids = Array.from({ length: TINS_PER_CARTON }, (_, k) => `${id}-loose-${k}`);
    ids.forEach((tinId, k) => {
      const w = r.width * 0.15;
      flights.current.set(tinId, {
        from: { left: r.left + r.width * (0.18 + (k % 5) * 0.13), top: r.top + r.height * (0.12 + Math.floor(k / 5) * 0.16), width: w, height: (w * TIN.h) / TIN.w },
        duration: 420,
        delay: 120 + k * 35,
      });
    });
    setBreaking({ key: id, left: r.left, top: r.top, width: r.width });
    after(() => setBreaking((now) => (now?.key === id ? null : now)), 700);
    onCrack(id, ids);
  };

  const keep = (map, id) => (el) => {
    if (el) map.current.set(id, el);
    else map.current.delete(id);
  };

  // Anything that just changed place flies from where it was. A tin that
  // has just gone onto the shelf also sends a few sparkles to its count.
  useLayoutEffect(() => {
    const placed = justPlaced.current;
    if (placed && shelfEls.current.has(placed)) {
      justPlaced.current = null;
      const tag = shelfRef.current?.querySelector(".pm-shelf__tag")?.getBoundingClientRect();
      if (tag && !reducedMotion()) {
        const o = shelfEls.current.get(placed).getBoundingClientRect();
        const x = o.left + o.width / 2;
        const y = o.top + o.height / 2;
        const key = `${placed}-${Date.now()}`;
        setSparkles((list) => [...list, { key, x, y, dx: tag.left + tag.width / 2 - x, dy: tag.top + tag.height / 2 - y }]);
        after(() => setSparkles((list) => list.filter((s) => s.key !== key)), 700);
      }
    }
    for (const [id, flight] of flights.current) {
      const el = shelfEls.current.get(id) ?? counterEls.current.get(id) ?? deliveryEls.current.get(id);
      if (!el) continue;
      flyIn(el, flight.from, flight.duration ?? 300, flight.delay ?? 0);
      flights.current.delete(id);
    }
  });

  if (!geo) return <div className="pm-game pm-shop" />;

  const delivery = deliveryLayout(geo.delivery, allCartons.length, allTins.length, geo.shopH);
  const top = counter ? counterLayout(geo.usable, counter.cartons.length, counter.tins.length, geo.shopH) : null;
  const showCartonTags = naming || hintKey != null;

  const press = (handler) => () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    handler();
  };
  const pointer = (id, kind, from) => ({
    onPointerDown: (event) => start(event, id, kind, from),
    onPointerMove: move,
    onPointerUp: (event) => end(event),
    onPointerCancel: (event) => end(event, true),
    onLostPointerCapture: (event) => end(event, true),
  });

  // --- the shelf, and what is on it slot by slot ----------------------------------
  let shelfView = null;
  if (shelf && geo.shelf) {
    const g = geo.shelf;
    const unitH = (g.width * SHELF.h) / SHELF.w;
    const pieces = [CUT.cap, ...Array.from({ length: levels }, () => CUT.level), CUT.foot];
    const onIt = [];
    for (let slot = 0; slot < shelf.had; slot++) onIt.push({ id: `had-${slot}`, slot, had: true });
    for (const item of shelf.placed) {
      if (item.kind === "carton") {
        for (let k = 0; k < TINS_PER_CARTON; k++) onIt.push({ id: `${item.id}-${k}`, slot: item.level * TINS_PER_CARTON + k });
      } else onIt.push({ id: item.id, slot: item.slot });
    }
    // The back rows first, so the front rows stand over them.
    onIt.sort((a, b) => (b.slot % 10 < 5) - (a.slot % 10 < 5));
    const count = onIt.length;
    shelfView = (
      <div
        ref={shelfRef}
        className={`pm-shelf${shelf.done ? " is-done" : ""}`}
        style={{ left: g.left, top: g.top, width: g.width, height: g.height }}
        role="group"
        aria-label={`A shelf that holds ${shelf.holds} tins`}
      >
        <div className="pm-shelf__art" aria-hidden="true">
          {pieces.map(([from, to], i) => (
            <span key={i} className="pm-shelf__piece" style={{ height: (to - from) * unitH }}>
              <img src={SHELF.src} width={SHELF.w} height={SHELF.h} alt="" draggable={false} style={{ top: -from * unitH }} />
            </span>
          ))}
        </div>
        {onIt.map((tin) => {
          const at = slotAt(tin.slot, g.width);
          return (
            <span
              key={tin.id}
              ref={tin.had ? undefined : keep(shelfEls, tin.id)}
              className={`pm-shelf__tin${tin.had ? " is-had" : " is-added"}${at.back ? " is-back" : ""}`}
              style={{ left: at.left, top: at.top, width: at.width, height: at.height }}
              aria-hidden="true"
            >
              <img src={TIN.src} width={TIN.w} height={TIN.h} alt="" draggable={false} />
            </span>
          );
        })}
        {/* What each shelf holds: with the hint, and as Blob says it. */}
        {(hintKey != null || spotlight === "holds") &&
          Array.from({ length: levels }, (_, i) => (
            <span
              key={`${i}-${spotlight === "holds" ? "named" : hintKey}`}
              className={`pm-shelf__ten${spotlight === "holds" ? "" : " is-hint"}`}
              style={{ top: (span(CUT.cap) + (i + 0.45) * span(CUT.level)) * unitH }}
              aria-hidden="true"
            >
              10
            </span>
          ))}
        {/* The shelf's own count, like the basket's: tins, a carton adding
            10. While Blob says what it had, that number. */}
        {spotlight !== "holds" && spotlight !== "added" && (
          <span key={spotlight === "had" ? "had" : count} className="pm-shelf__tag" aria-hidden="true">
            {spotlight === "had" ? shelf.had : count}
          </span>
        )}
        {spotlight === "added" && answer != null && (
          <span className="pm-game__total pm-shelf__answer" aria-hidden="true">
            {answer}
          </span>
        )}
        <p className="pm-sr-only" aria-live="polite">
          {count === 1 ? "1 tin on the shelf" : `${count} tins on the shelf`}
        </p>
      </div>
    );
  }

  const tinSpots = new Map(allTins.map((id, i) => [id, delivery.tin(i)]));
  const here = tins.map((id) => tinSpots.get(id));

  return (
    <div className={`pm-game pm-shop${spotlight ? ` pm-shop--spot-${spotlight}` : ""}`}>
      <p id="pm-tin-help" className="pm-sr-only">
        {target === "shelf" ? "Press B to put it on the shelf." : "Press B to put it on the counter."}
        {canTap ? " Press Enter to count it." : ""}
      </p>
      <p id="pm-carton-help" className="pm-sr-only">
        {target === "shelf" ? "Press B to put it on the shelf." : "Press B to put it on the counter."}
        {canCrack ? " Press Enter to open it." : ""}
      </p>

      {/* Everything but what Blob is naming goes dim. */}
      {spotlight && <div className="pm-game__dim" aria-hidden="true" />}

      {shelfView}

      {/* The counter top: a plain cloth on it where the order goes, what
          is on it, and how many tins that is. */}
      {top && (
        <div
          ref={zoneRef}
          className={`pm-counter-top${counter.done ? " is-done" : ""}${counter.taken ? " is-taken" : ""}`}
          style={top.zone}
          role="group"
          aria-label="The counter"
        >
          <span className="pm-counter-top__cloth" style={{ top: top.rest - 10 }} aria-hidden="true" />
          {counter.cartons.map((id, i) => (
            <div
              key={id}
              ref={keep(counterEls, id)}
              data-kind="carton"
              className="pm-carton is-movable"
              style={top.carton(i)}
              role="button"
              tabIndex={0}
              aria-label="A carton of tins, on the counter"
              aria-describedby="pm-counter-help"
              {...pointer(id, "carton", "counter")}
              onClick={press(() => byKey(id, counterEls.current.get(id), "carton", "counter"))}
              onKeyDown={(event) => {
                if (["Enter", " ", "b", "B"].includes(event.key)) {
                  event.preventDefault();
                  byKey(id, event.currentTarget, "carton", "counter");
                }
              }}
            >
              <CartonOfTen key={hintKey ?? "plain"} tag={hintKey != null} hinted />
            </div>
          ))}
          {counter.tins.map((id, i) => (
            <span
              key={id}
              ref={keep(counterEls, id)}
              data-kind="tin"
              className="pm-tin is-movable"
              style={top.tin(i)}
              role="button"
              tabIndex={0}
              aria-label="A tin, on the counter"
              aria-describedby="pm-counter-help"
              {...pointer(id, "tin", "counter")}
              onClick={press(() => byKey(id, counterEls.current.get(id), "tin", "counter"))}
              onKeyDown={(event) => {
                if (["Enter", " ", "b", "B"].includes(event.key)) {
                  event.preventDefault();
                  byKey(id, event.currentTarget, "tin", "counter");
                }
              }}
            >
              <img src={TIN.src} width={TIN.w} height={TIN.h} alt="" draggable={false} />
            </span>
          ))}
          <p id="pm-counter-help" className="pm-sr-only">
            Press Enter to take it back.
          </p>
          {counter.counts && (
            <span key={counter.cartons.length * 10 + counter.tins.length} className="pm-order__tag" aria-hidden="true">
              {counter.cartons.length * 10 + counter.tins.length}
            </span>
          )}
          <p className="pm-sr-only" aria-live="polite">
            {`On the counter: ${counter.cartons.length} ${counter.cartons.length === 1 ? "carton" : "cartons"} and ${counter.tins.length} loose ${counter.tins.length === 1 ? "tin" : "tins"}.`}
          </p>
        </div>
      )}

      {/* The delivery, on a mat on the ground. */}
      {(cartons.length > 0 || tins.length > 0) && (
        <div className="pm-delivery" style={delivery.mat} aria-hidden="true" />
      )}
      {cartons
        .map((id) => ({ id, at: delivery.carton(allCartons.indexOf(id)) }))
        // The back rows first, so the front ones stand over them.
        .sort((a, b) => b.at.row - a.at.row)
        .map(({ id, at: { row, ...at } }) => (
        <button
          key={id}
          ref={keep(deliveryEls, id)}
          type="button"
          data-kind="carton"
          data-id={id}
          className={`pm-carton${canDrag ? " is-movable" : ""}${inviteCrack ? " is-inviting" : ""}`}
          style={at}
          aria-label="A carton of tins"
          aria-describedby="pm-carton-help"
          {...pointer(id, "carton", "delivery")}
          onClick={press(() => {
            if (canCrack) crack(id);
          })}
          onKeyDown={(event) => {
            if (event.key === "b" || event.key === "B") {
              event.preventDefault();
              byKey(id, event.currentTarget, "carton", "delivery");
            }
          }}
        >
          <CartonOfTen key={naming ? "named" : hintKey ?? "plain"} tag={showCartonTags} hinted={!naming} />
        </button>
      ))}
      {tins.map((id, i) => {
        const badge = counted.indexOf(id) + 1;
        return (
          <button
            key={id}
            ref={keep(deliveryEls, id)}
            type="button"
            data-kind="tin"
            data-id={id}
            className={`pm-tin${canDrag ? " is-movable" : ""}`}
            style={here[i]}
            aria-label={badge ? `Tin, counted ${badge}` : "Tin"}
            aria-describedby="pm-tin-help"
            {...pointer(id, "tin", "delivery")}
            onClick={press(() => {
              if (canTap) onTap?.(id);
            })}
            onKeyDown={(event) => {
              if (event.key === "b" || event.key === "B") {
                event.preventDefault();
                byKey(id, event.currentTarget, "tin", "delivery");
              }
            }}
          >
            <img src={TIN.src} width={TIN.w} height={TIN.h} alt="" draggable={false} />
            {badge > 0 && (
              <span key={badge} className="pm-orange__badge" aria-hidden="true">
                {badge}
              </span>
            )}
          </button>
        );
      })}

      {/* As Blob names them: the loose tins, and how many, beside them (the
          cartons stand behind them). */}
      {(spotlight === "tins" || spotlight === "both") && tins.length > 0 && (
        <span
          className="pm-game__group-tag"
          style={{
            left: Math.min(Math.max(...here.map((t) => t.left + t.width)) + 28, window.innerWidth - 30),
            top: (Math.min(...here.map((t) => t.top)) + Math.max(...here.map((t) => t.top + t.height))) / 2 + 21,
          }}
          aria-hidden="true"
        >
          {tins.length}
        </span>
      )}
      {/* After the child has said it: the number, over everything left in the delivery. */}
      {spotlight === "both" && answer != null && (
        <span
          className="pm-game__total"
          style={{
            left: delivery.mat.left + delivery.mat.width / 2,
            top: Math.min(delivery.mat.top, ...cartons.map((id) => delivery.carton(allCartons.indexOf(id)).top), ...here.map((t) => t.top)) - 40,
          }}
          aria-hidden="true"
        >
          {answer}
        </span>
      )}

      {/* A carton splitting open: its two halves fall apart. */}
      {breaking && (
        <div key={breaking.key} className="pm-crack pm-crack--carton" style={{ left: breaking.left, top: breaking.top, width: breaking.width }} aria-hidden="true">
          <img className="pm-crack__half pm-crack__half--left" src={CARTON.src} width={CARTON.w} height={CARTON.h} alt="" draggable={false} />
          <img className="pm-crack__half pm-crack__half--right" src={CARTON.src} width={CARTON.w} height={CARTON.h} alt="" draggable={false} />
        </div>
      )}

      {sparkles.map((burst) => (
        <Sparkles key={burst.key} x={burst.x} y={burst.y} dx={burst.dx} dy={burst.dy} />
      ))}
    </div>
  );
}
