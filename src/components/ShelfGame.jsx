import { useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { CARTON, SHELF, TIN, TINS_PER_CARTON } from "../data/provisionStore";
import { after } from "../lib/pause";
import Sparkles from "./Sparkles";
// The spotlight's dim, the number tags and bubble, the place for an order
// (cloth or counter) and the cracking halves look as they do at the Fruit
// Stall.
import "./BasketGame.css";
import "./ShelfGame.css";

/*
  The Provision Store's play area (Chapter 2). Three things, side by side
  in one band along the ground in front of the shop, so every drag is a
  short one:

    the shelf     a wooden shelf unit, holding `holds` tins, ten to each
                  shelf of it (five at the back, five in front), `had` of
                  them on it already. A carton fills a whole empty shelf;
                  loose tins go in the first gaps, so a part-full shelf
                  fills before an empty one. Nothing outlines the gaps:
                  bare wood is the empty space.
    the delivery  on a mat: full cartons of ten tins at the back, loose
                  tins in front. Everything the child handles starts here,
                  and each thing keeps its place there while others go.
    the place     where a customer's order is put (a cloth), or Stage C's
                  answer (a counter top): a rectangle with a pale cream
                  edge, always there, with room to spare. Anything on it
                  can be taken back (dragged off it, or tapped).

  On a narrow screen the delivery and the place sit side by side, and the
  shelf stands just behind them.

  `target` is where things can go this round: "shelf" or "place". Let go
  anywhere else, they spring back. A carton tapped (where `canCrack`)
  splits open, and its ten tins join the loose ones.

  Loose tins can be chosen (where `canChoose`): a tap lifts one and
  numbers it, 1, 2, 3, in the order chosen (`chosen`); a tap on a chosen
  one puts it down, and the rest renumber. Dragging any chosen tin carries
  all of them together, and they go only if all of them fit; dragging one
  that isn't chosen carries just that one. A carton always moves alone.
  Choosing is counting: the numbers are the child's.

  Blob's hint (`hintKey`, a key that changes with each tap) is the same
  small thing as at the Fruit Stall: for a few seconds every carton shows
  its 10, and so does each shelf of the unit (what it holds). Nothing
  else: never what to do next, never a total.

  The parent owns the state; this component owns how it feels.
*/

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

// Blob's corner, bottom left, stays clear; and the space between things.
const BLOB_CORNER = 88;
const GAP = 14;

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** How tall a unit of `levels` shelves is, for each pixel of its width. */
const unitRatio = (levels) => ((span(CUT.cap) + levels * span(CUT.level) + span(CUT.foot)) * SHELF.h) / SHELF.w;

/**
 * Where the shelf, the delivery and the place for an order are on screen
 * right now: one band along the ground, left to right, as close together
 * as they fit. Too narrow for that (a phone held upright), the delivery
 * and the place share the ground and the shelf stands just behind them.
 */
function measure(levels, withPlace) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bottom = vh - 8;
  // Clear of the corner buttons and the line at the top.
  const top = vh <= 480 ? 118 : Math.max(220, vh * 0.28);
  const left = BLOB_CORNER;
  const room = vw - 10 - left;
  const low = Math.min(190, Math.max(120, (bottom - top) * 0.34));
  const ratio = levels ? unitRatio(levels) : 0;
  const parts = (levels ? 1 : 0) + 1 + (withPlace ? 1 : 0);
  let shelfW = levels ? Math.min(300, (bottom - top) / ratio) : 0;
  let deliveryW = Math.min(340, Math.max(200, vw * 0.28));
  let placeW = withPlace ? Math.min(280, Math.max(170, vw * 0.22)) : 0;
  const total = () => shelfW + deliveryW + placeW + GAP * (parts - 1);
  if (total() > room) {
    // All three a little smaller, down to the least that still works.
    const least = { shelf: levels ? 140 : 0, delivery: 190, place: withPlace ? 150 : 0 };
    const spare = shelfW - least.shelf + (deliveryW - least.delivery) + (placeW - least.place);
    const k = Math.min(1, (total() - room) / Math.max(spare, 1));
    shelfW -= (shelfW - least.shelf) * k;
    deliveryW -= (deliveryW - least.delivery) * k;
    placeW -= (placeW - least.place) * k;
  }
  const geo = {};
  if (total() <= room + 0.5) {
    let x = left + (room - total()) / 2;
    if (levels) {
      geo.shelf = { left: x, width: shelfW, height: shelfW * ratio, top: bottom - shelfW * ratio };
      x += shelfW + GAP;
    }
    geo.delivery = { left: x, right: x + deliveryW, top: bottom - low, bottom };
    x += deliveryW + GAP;
    if (withPlace) geo.place = { left: x, top: bottom - low, width: placeW, height: low };
  } else {
    const lowTop = bottom - low;
    if (withPlace) {
      const deliveryWidth = Math.round((room - GAP) * 0.56);
      geo.delivery = { left, right: left + deliveryWidth, top: lowTop, bottom };
      geo.place = { left: left + deliveryWidth + GAP, top: lowTop, width: room - deliveryWidth - GAP, height: low };
    } else geo.delivery = { left, right: left + room, top: lowTop, bottom };
    if (levels) {
      const feet = lowTop + 12;
      const width = Math.min(room * 0.8, 300, (feet - top) / ratio);
      geo.shelf = { left: left + (room - width) / 2, width, height: width * ratio, top: feet - width * ratio };
    }
  }
  return geo;
}

/**
 * The delivery: cartons at the back (in rows, each further row behind and
 * above the one in front, where the space is narrow), loose tins in rows
 * in front of them. Tins shrink first; a carton keeps a size a finger can
 * hold. Laid out for everything that has been there this round, so
 * nothing moves up when something goes.
 */
function deliveryLayout(area, cartonCount, tinCount) {
  const width = area.right - area.left - 16;
  const tall = area.bottom - area.top;
  const front = area.bottom - 6;
  let tinH = Math.min(54, tall * 0.36);
  // In one row if they fit at a size a finger can hold.
  let cartonW = Math.min(110, tall * 0.75, width, cartonCount ? Math.max(60, (width + 8) / cartonCount - 8) : 110);
  const shape = () => {
    const tinW = (tinH * TIN.w) / TIN.h;
    const perRow = Math.max(1, Math.floor(width / (tinW * 1.12)));
    const rows = tinCount ? Math.ceil(tinCount / perRow) : 0;
    const across = Math.max(1, Math.min(cartonCount, Math.floor((width + 8) / (cartonW + 8))));
    const cartonRows = cartonCount ? Math.ceil(cartonCount / across) : 0;
    const cartonH = (cartonW * CARTON.h) / CARTON.w;
    const tinsTop = front - (rows ? tinH + (rows - 1) * tinH * 0.8 : 0);
    // Just behind the tins, never hidden by them: a carton's middle stays clear to touch.
    const cartonsBottom = rows ? tinsTop + tinH * 0.15 : front;
    const cartonsTop = cartonRows ? cartonsBottom - cartonH * (1 + (cartonRows - 1) * 0.55) : Infinity;
    return { tinW, perRow, rows, across, cartonH, tinsTop, cartonsBottom, top: Math.min(tinsTop, cartonsTop) };
  };
  let m = shape();
  while (front - m.top > tall && tinH > 32) {
    tinH *= 0.93;
    m = shape();
  }
  while (front - m.top > tall && cartonW > 52) {
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
 * Inside the place for an order: cartons side by side along its back,
 * loose tins in rows in front of them, all shrunk to fit if there are
 * more than it was made for. Relative to the place.
 */
function placeLayout(place, cartonCount, tinCount) {
  const pad = 14;
  const gap = 6;
  const inner = place.width - pad * 2;
  const room = place.height - pad * 2;
  let cartonW = Math.min(84, cartonCount ? (inner - (cartonCount - 1) * gap) / cartonCount : 84);
  let tinH = Math.min(46, room * 0.4);
  const shape = () => {
    const tinW = (tinH * TIN.w) / TIN.h;
    const perRow = Math.max(1, Math.floor((inner + gap) / (tinW + gap)));
    const rows = tinCount ? Math.ceil(tinCount / perRow) : 0;
    const cartonH = cartonCount ? (cartonW * CARTON.h) / CARTON.w : 0;
    return { tinW, perRow, rows, cartonH, height: cartonH + (cartonCount && rows ? gap : 0) + rows * tinH + Math.max(rows - 1, 0) * (gap * 0.5) };
  };
  let m = shape();
  while (m.height > room && tinH > 18) {
    tinH *= 0.92;
    cartonW *= 0.95;
    m = shape();
  }
  const cartonsWidth = cartonCount * cartonW + Math.max(cartonCount - 1, 0) * gap;
  const tinsTop = pad + (cartonCount ? m.cartonH + gap : 0);
  return {
    carton: (i) => ({ left: pad + (inner - cartonsWidth) / 2 + i * (cartonW + gap), top: pad, width: cartonW }),
    tin: (i) => {
      const row = Math.floor(i / m.perRow);
      const inRow = Math.min(m.perRow, tinCount - row * m.perRow);
      const start = pad + (inner - (inRow * m.tinW + (inRow - 1) * gap)) / 2;
      return { left: start + (i % m.perRow) * (m.tinW + gap), top: tinsTop + row * (tinH + gap * 0.5), width: m.tinW, height: tinH };
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
  seed,
  cartons,
  tins,
  chosen = [],
  shelf = null,
  place = null,
  target = null,
  canDrag,
  canChoose = false,
  canCrack = false,
  inviteCrack = false,
  hintKey = null,
  spotlight = null,
  answer = null,
  onChoose,
  onPlace,
  onReturn,
  onCrack,
}) {
  const levels = shelf ? shelf.holds / TINS_PER_CARTON : 0;
  const withPlace = Boolean(place);
  const [geo, setGeo] = useState(() => measure(levels, withPlace));
  const [sparkles, setSparkles] = useState([]);
  const [breaking, setBreaking] = useState(null); // a carton splitting open
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const flights = useRef(new Map()); // id → { from, duration, delay }
  const justPlaced = useRef(null); // the tin that just went on the shelf, for its sparkles
  const shelfRef = useRef(null);
  const placeRef = useRef(null);
  const deliveryEls = useRef(new Map());
  const shelfEls = useRef(new Map());
  const placeEls = useRef(new Map());
  const naming = spotlight?.startsWith("place-") ?? false;
  const allCartons = useStableOrder(cartons, `${seed}-cartons`);
  const allTins = useStableOrder(tins, `${seed}-tins`);

  // Follow the screen as it changes.
  useLayoutEffect(() => {
    const update = () => setGeo(measure(levels, withPlace));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [levels, withPlace]);

  useImperativeHandle(ref, () => ({
    shelf: () => shelfRef.current,
    shelfTag: () => shelfRef.current?.querySelector(".pm-shelf__tag"),
    place: () => placeRef.current,
    // Notes where these things are now, so they fly from there to where
    // they go next: a right answer going from the counter onto the shelf,
    // a carton's ten tins each from the carton.
    noteWhere: (ids) => {
      for (const id of ids) {
        const el = placeEls.current.get(id) ?? deliveryEls.current.get(id);
        if (!el) continue;
        const from = el.getBoundingClientRect();
        if (el.dataset.kind === "carton") {
          for (let k = 0; k < TINS_PER_CARTON; k++) flights.current.set(`${id}-${k}`, { from, duration: 420, delay: k * 30 });
        } else flights.current.set(id, { from, duration: 420 });
      }
    },
  }));

  const forget = (id) => {
    for (const key of [...flights.current.keys()]) if (key === id || key.startsWith(`${id}-`)) flights.current.delete(key);
  };
  // Sends what was dropped (or taken back off the place), each thing
  // flying from where it was: a carton going onto the shelf becomes its
  // ten tins there, each from the carton.
  const send = (ids, kind, from, rects) => {
    ids.forEach((id, i) => {
      if (kind === "carton" && from === "delivery" && target === "shelf") {
        for (let k = 0; k < TINS_PER_CARTON; k++) flights.current.set(`${id}-${k}`, { from: rects[i], duration: 380, delay: k * 25 });
      } else flights.current.set(id, { from: rects[i], delay: i * 30 });
    });
    const ok = from === "place" ? onReturn(ids[0], kind) : onPlace(ids.map((id) => ({ id, kind })));
    if (!ok) ids.forEach(forget);
    else if (kind === "tin" && from === "delivery" && target === "shelf") justPlaced.current = ids[ids.length - 1];
    return ok;
  };
  // What a drag (or B) on a loose tin carries: all the chosen ones, if it
  // is one of them; otherwise just it.
  const carried = (id, kind, from) =>
    from === "delivery" && kind === "tin" && chosen.includes(id) ? chosen.filter((t) => deliveryEls.current.has(t)) : [id];
  const elFor = (id, from) => (from === "place" ? placeEls : deliveryEls).current.get(id);

  // --- dragging ---------------------------------------------------------------
  const start = (event, id, kind, from) => {
    suppressClick.current = false;
    if (!canDrag || drag.current) return; // one at a time
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const el = event.currentTarget;
    el.setPointerCapture?.(event.pointerId);
    const group = carried(id, kind, from);
    drag.current = {
      id,
      kind,
      from,
      el,
      group,
      els: group.map((g) => elFor(g, from)).filter(Boolean),
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
      // On a touch screen what is carried rides above the finger, so the
      // child can see it.
      d.lift = d.touch ? home.height * 0.5 : 0;
      for (const el of d.els) {
        el.style.setProperty("--lift", `${d.lift}px`);
        el.classList.add("is-dragging");
      }
      // Taken off the place, it goes back unless let go over the place.
      d.zoneEl = d.from === "place" || target === "place" ? placeRef.current : target === "shelf" ? shelfRef.current : null;
      if (d.zoneEl) {
        const b = d.zoneEl.getBoundingClientRect();
        d.zone = { left: b.left - b.width * 0.15, right: b.right + b.width * 0.15, top: b.top - b.height * 0.2, bottom: b.bottom + b.height * 0.1 };
      }
    }
    for (const el of d.els) el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    if (!d.zone) return;
    const x = d.cx + dx;
    const y = d.cy + dy - d.lift;
    const over = x >= d.zone.left && x <= d.zone.right && y >= d.zone.top && y <= d.zone.bottom;
    if (over !== d.over) {
      d.over = over;
      // (Taking something back off the place doesn't light it.)
      if (d.from !== "place") d.zoneEl.classList.toggle("is-ready", over);
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
    const leaving = d.from === "place" ? !d.over : d.over;
    if (!cancelled && leaving) {
      suppressClick.current = false; // they are about to leave; no click follows
      if (send(d.group, d.kind, d.from, d.els.map((el) => el.getBoundingClientRect()))) return;
      // Not wanted there (or not all of them fit): back they spring, and
      // the click that follows the drag is not a tap.
      suppressClick.current = true;
    }
    d.els.forEach(springHome);
  };

  // By keyboard: B sends it (and the others chosen with it); on the
  // place, Enter takes it back too.
  const byKey = (id, kind, from) => {
    if (!canDrag || (from === "delivery" && !target)) return;
    const group = carried(id, kind, from);
    send(group, kind, from, group.map((g) => elFor(g, from)?.getBoundingClientRect()));
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
      const el = shelfEls.current.get(id) ?? placeEls.current.get(id) ?? deliveryEls.current.get(id);
      if (!el) continue;
      flyIn(el, flight.from, flight.duration ?? 300, flight.delay ?? 0);
      flights.current.delete(id);
    }
  });

  const delivery = deliveryLayout(geo.delivery, allCartons.length, allTins.length);
  const inPlace = place && geo.place ? placeLayout(geo.place, place.cartons.length, place.tins.length) : null;

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

  return (
    <div className={`pm-game pm-shop${spotlight ? ` pm-shop--spot-${spotlight}` : ""}`}>
      <p id="pm-tin-help" className="pm-sr-only">
        {canChoose ? "Press Enter to choose it, or put it down again. " : ""}
        {target === "shelf" ? "Press B to put it, and any chosen with it, on the shelf." : "Press B to put it, and any chosen with it, in the place for the order."}
      </p>
      <p id="pm-carton-help" className="pm-sr-only">
        {target === "shelf" ? "Press B to put it on the shelf." : "Press B to put it in the place for the order."}
        {canCrack ? " Press Enter to open it." : ""}
      </p>

      {/* Everything but what Blob is naming goes dim. */}
      {spotlight && <div className="pm-game__dim" aria-hidden="true" />}

      {shelfView}

      {/* The delivery, on a mat on the ground. */}
      {(cartons.length > 0 || tins.length > 0) && <div className="pm-delivery" style={delivery.mat} aria-hidden="true" />}

      {/* The place for an order: a customer's cloth, or Stage C's counter
          top. Always there, with its edge; nothing drawn on it but what
          the child puts there. */}
      {inPlace && (
        <div
          ref={placeRef}
          className={`pm-order pm-shop-place${place.counter ? " pm-order--counter" : ""}${place.done ? " is-done" : ""}${place.taken ? " is-taken" : ""}`}
          style={geo.place}
          role="group"
          aria-label={place.counter ? "The counter" : "The customer's order"}
        >
          {place.cartons.map((id, i) => (
            <div
              key={id}
              ref={keep(placeEls, id)}
              data-kind="carton"
              className="pm-carton is-movable"
              style={inPlace.carton(i)}
              role="button"
              tabIndex={0}
              aria-label="A carton of tins, in the order"
              aria-describedby="pm-place-help"
              {...pointer(id, "carton", "place")}
              onClick={press(() => byKey(id, "carton", "place"))}
              onKeyDown={(event) => {
                if (["Enter", " ", "b", "B"].includes(event.key)) {
                  event.preventDefault();
                  byKey(id, "carton", "place");
                }
              }}
            >
              <CartonOfTen key={naming ? "named" : hintKey ?? "plain"} tag={naming || hintKey != null} hinted={!naming} />
            </div>
          ))}
          {place.tins.map((id, i) => (
            <span
              key={id}
              ref={keep(placeEls, id)}
              data-kind="tin"
              className="pm-tin is-movable"
              style={inPlace.tin(i)}
              role="button"
              tabIndex={0}
              aria-label="A tin, in the order"
              aria-describedby="pm-place-help"
              {...pointer(id, "tin", "place")}
              onClick={press(() => byKey(id, "tin", "place"))}
              onKeyDown={(event) => {
                if (["Enter", " ", "b", "B"].includes(event.key)) {
                  event.preventDefault();
                  byKey(id, "tin", "place");
                }
              }}
            >
              <img src={TIN.src} width={TIN.w} height={TIN.h} alt="" draggable={false} />
            </span>
          ))}
          <p id="pm-place-help" className="pm-sr-only">
            Press Enter to take it back.
          </p>
          {place.counts && (
            <span key={place.cartons.length * 10 + place.tins.length} className="pm-order__tag" aria-hidden="true">
              {place.cartons.length * 10 + place.tins.length}
            </span>
          )}
          {/* As Blob names them: the loose tins, and how many, beside them. */}
          {(spotlight === "place-tins" || spotlight === "place-both") && place.tins.length > 0 && (
            <span
              className="pm-game__group-tag pm-shop-place__group"
              style={{
                left: Math.min(Math.max(...place.tins.map((_, i) => inPlace.tin(i).left + inPlace.tin(i).width)) + 26, geo.place.width + 10),
                top: Math.max(...place.tins.map((_, i) => inPlace.tin(i).top + inPlace.tin(i).height)) + 2,
              }}
              aria-hidden="true"
            >
              {place.tins.length}
            </span>
          )}
          {spotlight === "place-both" && answer != null && (
            <span className="pm-game__total pm-shop-place__answer" aria-hidden="true">
              {answer}
            </span>
          )}
          <p className="pm-sr-only" aria-live="polite">
            {`In the order: ${place.cartons.length} ${place.cartons.length === 1 ? "carton" : "cartons"} and ${place.tins.length} loose ${place.tins.length === 1 ? "tin" : "tins"}.`}
          </p>
        </div>
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
                byKey(id, "carton", "delivery");
              }
            }}
          >
            <CartonOfTen key={hintKey ?? "plain"} tag={hintKey != null} hinted />
          </button>
        ))}
      {tins.map((id) => {
        const badge = chosen.indexOf(id) + 1;
        return (
          <button
            key={id}
            ref={keep(deliveryEls, id)}
            type="button"
            data-kind="tin"
            data-id={id}
            className={`pm-tin${canDrag ? " is-movable" : ""}${badge ? " is-chosen" : ""}`}
            style={tinSpots.get(id)}
            aria-label={badge ? `Tin, chosen ${badge}` : "Tin"}
            aria-pressed={canChoose ? badge > 0 : undefined}
            aria-describedby="pm-tin-help"
            {...pointer(id, "tin", "delivery")}
            onClick={press(() => {
              if (canChoose) onChoose?.(id);
            })}
            onKeyDown={(event) => {
              if (event.key === "b" || event.key === "B") {
                event.preventDefault();
                byKey(id, "tin", "delivery");
              }
            }}
          >
            <img src={TIN.src} width={TIN.w} height={TIN.h} alt="" draggable={false} />
            {badge > 0 && (
              <span key={badge} className="pm-orange__badge pm-tin__badge" aria-hidden="true">
                {badge}
              </span>
            )}
          </button>
        );
      })}

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
