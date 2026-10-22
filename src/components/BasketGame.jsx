import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { BASKET, CRATE, ORANGE } from "../data/market";
import Sparkles from "./Sparkles";
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

  In Chapter 1 there are also full crates on the table (`crates`), each
  ten oranges in two rows of five, stacked at the table's left end. When
  a full basket shuts, its crate flies up to join them and the basket is
  empty again (`emptied`).

  Stage B adds Grandma's order (`order`), on a cloth beside the basket,
  what it wants drawn as outlines until it comes. Oranges, from the table
  or the basket, and crates are dragged there instead. A tapped crate,
  once cracking is allowed (`canCrack`), splits open and its ten oranges
  spill into the basket.

  Stage C's counter (`order.mode` "counter") has no outlines at all: the
  basket is put away and the counter stands alone, crates in a column on
  the left, loose oranges on the right. Anything on it can be taken back
  (dragged off it, or tapped). In the reading round two slots, tens under
  the crates and ones under the loose oranges, take the number.

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
function measure(stall, orderMode = null, reserve = 0) {
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
  if (orderMode === "alone") {
    // Stage C: the counter stands on its own in the middle, with room
    // kept under it for the number slots (`reserve`).
    geo.basket = { left: Math.min(Math.max(geo.cx - w / 2, 8), vw - w - 8), top: bottom - h, width: w, height: h };
    geo.order = {
      mode: "alone",
      center: geo.cx,
      width: Math.min(vw - 24, 440),
      bottom: bottom - reserve,
      maxHeight: Math.max(100, bottom - reserve - geo.face + 12),
    };
    return geo;
  }
  if (orderMode === "beside") {
    // Stage B: the basket steps left, and a little smaller, to make room
    // for the customer's order on its right.
    const scale = Math.min(0.85, (vw * 0.46) / w);
    const bw = w * scale;
    const ow = Math.min(vw * 0.46, 280);
    const whole = bw + ORDER_GAP + ow;
    const left = Math.max(8, Math.min(geo.cx - whole / 2, vw - 8 - whole));
    geo.basket = { left, top: bottom - h * scale, width: bw, height: h * scale };
    // The order stays on the ground, below the table's front edge.
    geo.order = { mode: "beside", left: left + bw + ORDER_GAP, width: ow, bottom, maxHeight: Math.max(110, bottom - geo.face + 12) };
    return geo;
  }
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

/*
  Full crates on the table: stacked at its left end, two to a row, the
  second row sitting on the first, so the loose oranges keep the rest of
  the table. Room is kept for `room` crates, the most the round will have,
  so nothing shifts when a new one arrives.
*/
const CRATE_GAP = 4;

function crateStack(geo, room) {
  const width = Math.round(Math.min(geo.stallH * 0.24, (geo.right - geo.left) * 0.22, 130));
  const height = (width * CRATE.h) / CRATE.w;
  const across = Math.min(room, 2);
  return {
    width: across * width + (across - 1) * CRATE_GAP,
    spot: (i) => ({
      left: geo.left + (i % 2) * (width + CRATE_GAP),
      top: geo.rest - height * 0.92 - Math.floor(i / 2) * height * 0.57,
      width,
    }),
  };
}

/** Where a full basket's crate stands, over the basket (see `closed`). */
function closedCrate(b) {
  const width = b.width * 1.1;
  const height = width * (CRATE.h / CRATE.w);
  return { left: b.left + b.width / 2 - width / 2, top: b.top + b.height - height, width, height };
}

/*
  Stage B: the customer's order, on a cloth beside the basket. Crates
  along the top, loose oranges below, four to a row: outlines until they
  come, so the child can see what is still wanted without counting.
*/
const ORDER_GAP = 14;

function orderLayout(o, wants) {
  const pad = 14;
  const gap = 6;
  const perRow = 4;
  const room = o.width - pad * 2;
  const rows = Math.ceil(wants.loose / perRow);
  let crateWidth = wants.crates ? Math.min((room - (wants.crates - 1) * gap) / wants.crates, room * 0.62, 120) : 0;
  let size = Math.min((room - (perRow - 1) * gap) / perRow, 46);
  // Shrunk to fit the ground in front of the table, if it has to be.
  const fixed = pad * 2 + (wants.crates ? 10 : 0) + Math.max(rows - 1, 0) * gap;
  const grows = (crateWidth * CRATE.h) / CRATE.w + rows * size;
  const k = Math.min(1, Math.max(0.4, (o.maxHeight - fixed) / grows));
  crateWidth *= k;
  size *= k;
  const crateHeight = (crateWidth * CRATE.h) / CRATE.w;
  const looseTop = pad + (wants.crates ? crateHeight + 10 : 0);
  const height = looseTop + rows * size + Math.max(rows - 1, 0) * gap + pad;
  const cratesWidth = wants.crates * crateWidth + Math.max(wants.crates - 1, 0) * gap;
  const across = Math.min(wants.loose, perRow);
  const inner = Math.max(cratesWidth, across * size + Math.max(across - 1, 0) * gap);
  return {
    left: o.left,
    top: o.bottom - height,
    width: inner + pad * 2,
    height,
    // Both relative to the cloth.
    crate: (i) => ({ left: pad + (inner - cratesWidth) / 2 + i * (crateWidth + gap), top: pad, width: crateWidth }),
    orange: (i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, wants.loose - row * perRow);
      const start = pad + (inner - (inRow * size + (inRow - 1) * gap)) / 2;
      return { left: start + (i % perRow) * (size + gap), top: looseTop + row * (size + gap), width: size, height: size };
    },
  };
}

/*
  Stage C: the counter. Crates in a column on the left, two to a row and
  stacked like the table's; loose oranges on the right, three to a row.
  Room for as many as the stock holds; no outlines. The crates on it sit
  in the middle of their column (one alone, two side by side), so the tens
  slot under the column is under them. `columns` is where each column's
  middle is on the page, for the number slots.
*/
function counterLayout(o, room, crateCount) {
  const pad = 14;
  const gap = 6;
  const middle = 22;
  const crateCols = Math.min(2, Math.max(room.crates, 1));
  const crateRows = Math.max(1, Math.ceil(room.crates / 2));
  const looseCols = 3;
  const looseRows = Math.max(1, Math.ceil(room.loose / looseCols));
  const sizes = (crateWidth, size) => {
    const crateHeight = (crateWidth * CRATE.h) / CRATE.w;
    const cratesWidth = crateCols * crateWidth + (crateCols - 1) * gap;
    const cratesHeight = crateHeight * (1 + (crateRows - 1) * 0.62);
    const looseWidth = looseCols * size + (looseCols - 1) * gap;
    const looseHeight = looseRows * size + (looseRows - 1) * gap;
    return {
      crateWidth,
      size,
      crateHeight,
      cratesWidth,
      cratesHeight,
      looseWidth,
      looseHeight,
      width: pad * 2 + cratesWidth + middle + looseWidth,
      height: pad * 2 + Math.max(cratesHeight, looseHeight),
    };
  };
  let m = sizes(96, 44);
  const k = Math.min(1, o.width / m.width, o.maxHeight / m.height);
  m = sizes(96 * k, 44 * k);
  const left = Math.max(8, Math.min(o.center - m.width / 2, window.innerWidth - 8 - m.width));
  const top = o.bottom - m.height;
  const cratesTop = pad + Math.max(m.cratesHeight, m.looseHeight) - m.cratesHeight;
  const looseLeft = pad + m.cratesWidth + middle;
  return {
    left,
    top,
    width: m.width,
    height: m.height,
    // Both relative to the counter. Crates stack up from the bottom row.
    crate: (i) => ({
      left:
        pad +
        (m.cratesWidth - (Math.min(2, crateCount - Math.floor(i / 2) * 2) * (m.crateWidth + gap) - gap)) / 2 +
        (i % 2) * (m.crateWidth + gap),
      top: cratesTop + (crateRows - 1 - Math.floor(i / 2)) * m.crateHeight * 0.62,
      width: m.crateWidth,
    }),
    orange: (i) => ({
      left: looseLeft + (i % looseCols) * (m.size + gap),
      top: pad + Math.floor(i / looseCols) * (m.size + gap),
      width: m.size,
      height: m.size,
    }),
    columns: { crates: left + pad + m.cratesWidth / 2, loose: left + looseLeft + m.looseWidth / 2 },
  };
}

/** A crate of ten, as drawn on the table and in an order. */
function CrateOfTen() {
  return (
    <>
      <img className="pm-crate__art" src={CRATE.src} width={CRATE.w} height={CRATE.h} alt="" draggable={false} />
      {CRATE_SLOTS.map((slot, k) => (
        <span key={k} className="pm-stack-crate__orange" style={{ left: `${slot.x - 8}%`, top: `${slot.y - 12}%` }}>
          <img src={ORANGE.src} width={ORANGE.w} height={ORANGE.h} alt="" draggable={false} />
        </span>
      ))}
      <span className="pm-stack-crate__tag" aria-hidden="true">
        10
      </span>
    </>
  );
}

// Room under the counter for the reading round's two number slots.
const SLOT_ROOM = 76;

/** Plays an element's move from where it was (`from`) to where it is now. */
function flyIn(el, from, duration, delay = 0) {
  if (!from || !el || reducedMotion()) return;
  const to = el.getBoundingClientRect();
  if (!to.width) return;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const scale = from.width / to.width;
  el.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: "translate(0, 0) scale(1)" }],
    { duration, delay, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "backwards" }
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
  crates = [],
  crateRoom = 0,
  emptied = false,
  away = [],
  order = null,
  canCrack = false,
  inviteCrack = false,
  spotlight = null,
  total = 0,
  demoKey = 0,
  onTap,
  onDrop,
  onLeave,
  onDeliver,
  onCrack,
  onReturn,
  onSlot,
}) {
  const basketRef = useRef(null);
  const [geo, setGeo] = useState(null);
  const [demo, setDemo] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const justPlaced = useRef(null); // the orange that just went in, for its sparkles
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const flights = useRef(new Map()); // id → { from: the rect it is flying from, duration, delay }
  const tableEls = useRef(new Map());
  const basketEls = useRef(new Map());
  const crateEls = useRef(new Map());
  const crateSpots = useRef(new Map()); // where each crate was last drawn
  const orderRef = useRef(null);
  const orderEls = useRef(new Map());
  const [breaking, setBreaking] = useState(null); // a crate splitting open
  const counter = order?.mode === "counter";
  const orderMode = order ? (counter ? "alone" : "beside") : null;
  // The reading round keeps room under the counter for the number slots.
  const reserve = counter && order.slots ? SLOT_ROOM : 0;

  // Follow the stall picture as the screen changes.
  useLayoutEffect(() => {
    if (!stall) return undefined;
    const update = () => setGeo(measure(stall, orderMode, reserve));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stall);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [stall, orderMode, reserve]);

  const stack = geo && crateRoom ? crateStack(geo, crateRoom) : null;
  const layout = geo ? arrange(oranges, seed, stack ? { ...geo, left: geo.left + stack.width + 12 } : geo) : null;
  const spotsNow = new Map(stack ? crates.map((id, i) => [id, stack.spot(i)]) : []);
  // (Only once the screen has been measured for this kind of order.)
  const box =
    geo?.order && order && geo.order.mode === orderMode
      ? counter
        ? counterLayout(geo.order, order.room, order.deliveredCrates.length)
        : orderLayout(geo.order, order)
      : null;

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
    order: () => orderRef.current,
    nearestOrange,
    // Sends an orange from the basket back to its place on the table.
    flyBack: (id) => {
      const el = basketEls.current.get(id);
      if (el) flights.current.set(id, { from: el.getBoundingClientRect() });
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
  const start = (event, id, kind = "orange") => {
    suppressClick.current = false;
    if (!canDrag || drag.current) return; // one orange at a time
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const el = event.currentTarget;
    el.setPointerCapture?.(event.pointerId);
    drag.current = {
      id,
      kind,
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
      // An orange taken out of the basket, or anything taken off the
      // counter, rides above everything else.
      if (d.el.closest(".pm-basket")) basketRef.current.classList.add("is-carrying");
      d.fromCounter = Boolean(d.el.closest(".pm-order"));
      if (d.fromCounter) orderRef.current.classList.add("is-carrying");
      // Generous: anywhere over the basket (in Stage B, the order), a
      // little beside it, or just above its mouth counts.
      d.target = order ? orderRef.current : basketRef.current;
      const b = d.target.getBoundingClientRect();
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
      // (Taking something back off the counter doesn't light it.)
      if (!d.fromCounter) d.target.classList.toggle("is-ready", over);
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
    d.target?.classList.remove("is-ready");
    basketRef.current?.classList.remove("is-carrying");
    orderRef.current?.classList.remove("is-carrying");
    if (!d.dragging) return; // a tap: the click that follows counts it (or opens a crate)

    // Stage C: something taken off the counter goes back to the stall;
    // let go over the counter, it stays where it was.
    if (d.fromCounter) {
      if (!cancelled && !d.over) {
        const body = d.el.querySelector(".pm-crate__art, img") ?? d.el;
        flights.current.set(d.id, { from: body.getBoundingClientRect() });
        suppressClick.current = false;
        if (onReturn(d.id, d.kind)) return;
        flights.current.delete(d.id);
      }
      suppressClick.current = true;
      springHome(d.el);
      return;
    }

    if (!cancelled && d.over) {
      const body = d.el.querySelector(".pm-orange__body, .pm-crate__art") ?? d.el;
      flights.current.set(d.id, { from: body.getBoundingClientRect() });
      suppressClick.current = false; // it is about to leave; no click follows
      if (order ? onDeliver(d.id, d.kind) : onDrop(d.id)) {
        if (!order) justPlaced.current = d.id;
        return;
      }
      flights.current.delete(d.id);
      // Not wanted there: it springs back, and the click that follows the
      // drag is not a tap (it would count an orange, or open a crate).
      suppressClick.current = true;
    }
    springHome(d.el);
  };

  const dropByKey = (id, el, kind = "orange") => {
    if (!canDrag) return;
    flights.current.set(id, { from: el.getBoundingClientRect() });
    if (order ? onDeliver(id, kind) : onDrop(id)) {
      if (!order) justPlaced.current = id;
    } else flights.current.delete(id);
  };

  // Stage C: back from the counter to the stall, by tap or key.
  const takeBack = (id, el, kind) => {
    flights.current.set(id, { from: el.getBoundingClientRect() });
    if (!onReturn(id, kind)) flights.current.delete(id);
  };

  // Stage B: a crate splits open. Its two halves fall apart while its ten
  // oranges spill, one after another, into the basket's ten spaces.
  const crack = (id) => {
    const el = crateEls.current.get(id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ids = CRATE_SLOTS.map((_, k) => `${id}-loose-${k}`);
    ids.forEach((orangeId, k) => {
      const slot = CRATE_SLOTS[k];
      const width = r.width * 0.16;
      flights.current.set(orangeId, {
        from: {
          left: r.left + (r.width * (slot.x - 8)) / 100,
          top: r.top + (r.height * (slot.y - 12)) / 100,
          width,
          height: (width * ORANGE.h) / ORANGE.w,
        },
        duration: 420,
        delay: 120 + k * 35,
      });
    });
    setBreaking({ key: id, left: r.left, top: r.top, width: r.width });
    window.setTimeout(() => setBreaking((now) => (now?.key === id ? null : now)), 700);
    onCrack(id, ids);
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
    for (const [id, flight] of flights.current) {
      const el = basketEls.current.get(id) ?? tableEls.current.get(id) ?? orderEls.current.get(id) ?? crateEls.current.get(id);
      if (!el) continue;
      flyIn(el, flight.from, flight.duration ?? 300, flight.delay ?? 0);
      flights.current.delete(id);
    }
    // Crates: a full basket's goes up onto the table with the others, and
    // when one leaves the stack the rest settle into their new places.
    for (const [id, at] of spotsNow) {
      const was = crateSpots.current.get(id);
      const el = crateEls.current.get(id);
      if (!was) {
        if (id.startsWith("packed") && geo) flyIn(el, closedCrate(geo.basket), 650);
      } else if (was.left !== at.left || was.top !== at.top) {
        flyIn(el, { ...was, height: (was.width * CRATE.h) / CRATE.w }, 350);
      }
    }
    crateSpots.current = spotsNow;
  });

  if (!layout) return <div className="pm-game" />;

  const onTable = oranges.filter((id) => !inBasket.includes(id) && !away.includes(id));
  const asideAt = new Map(onTable.map((id, i) => [id, i]));
  const aside = trayed && onTable.length ? setAside(geo, onTable.length, layout.size) : null;
  // Rows further back first, so the front row is drawn over them.
  onTable.sort((a, b) => layout.spots[b].row - layout.spots[a].row);

  // Each orange keeps its space in the basket, so taking one out (Stage B)
  // doesn't move the others.
  const inSlots = emptied
    ? []
    : inBasket
        .slice(0, SLOTS.length)
        .map((id, i) => ({ id, ...SLOTS[i] }))
        .filter((slot) => !away.includes(slot.id));
  const held = inSlots.length;
  inSlots.sort((a, b) => a.layer - b.layer);
  const gaps = SLOTS.slice(inBasket.length, Math.min(gapsUpTo, SLOTS.length));
  const b = geo.basket;

  return (
    <div className={`pm-game${dim ? " is-dim" : ""}${spotlight ? ` pm-game--spot-${spotlight}` : ""}`}>
      <p id="pm-orange-help" className="pm-sr-only">
        {order ? "Press B to put it in the order." : "Press Enter to count it. Press B to put it in the basket."}
      </p>
      {order && (
        <p id="pm-crate-help" className="pm-sr-only">
          Press B to put it in the order. Press Enter to open it.
        </p>
      )}

      {/* Everything but what Blob is naming goes dim. */}
      {spotlight && <div className="pm-game__dim" aria-hidden="true" />}

      {/* Chapter 1: the full crates on the table, the tens. In Stage B
          they can be carried to the order, or tapped open. */}
      {stack &&
        crates.map((id) => {
          const at = spotsNow.get(id);
          const style = { left: at.left, top: at.top, width: at.width };
          if (!order) {
            return (
              <div key={id} ref={keep(crateEls, id)} className="pm-stack-crate" style={style} role="img" aria-label="A crate of ten oranges">
                <CrateOfTen />
              </div>
            );
          }
          return (
            <button
              key={id}
              ref={keep(crateEls, id)}
              type="button"
              className={`pm-stack-crate is-movable${inviteCrack ? " is-inviting" : ""}`}
              style={style}
              data-id={id}
              aria-label="A crate of ten oranges"
              aria-describedby="pm-crate-help"
              onPointerDown={(event) => start(event, id, "crate")}
              onPointerMove={move}
              onPointerUp={(event) => end(event)}
              onPointerCancel={(event) => end(event, true)}
              onLostPointerCapture={(event) => end(event, true)}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                if (canCrack) crack(id);
              }}
              onKeyDown={(event) => {
                if (event.key === "b" || event.key === "B") {
                  event.preventDefault();
                  dropByKey(id, event.currentTarget, "crate");
                }
              }}
            >
              <CrateOfTen />
            </button>
          );
        })}

      {/* Stage C: the counter, nothing on it but what the child puts there. */}
      {box && counter && (
        <div
          ref={orderRef}
          className={`pm-order pm-order--counter${order.done ? " is-done" : ""}${order.taken ? " is-taken" : ""}`}
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          role="group"
          aria-label="The counter"
        >
          {order.deliveredCrates.map((id, i) => (
            <div
              key={id}
              ref={keep(orderEls, id)}
              className="pm-order__crate is-movable"
              style={box.crate(i)}
              role="button"
              tabIndex={0}
              aria-label="A crate of ten oranges, on the counter"
              aria-describedby="pm-counter-help"
              onPointerDown={(event) => start(event, id, "crate")}
              onPointerMove={move}
              onPointerUp={(event) => end(event)}
              onPointerCancel={(event) => end(event, true)}
              onLostPointerCapture={(event) => end(event, true)}
              onClick={(event) => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                takeBack(id, event.currentTarget, "crate");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " " || event.key === "b" || event.key === "B") {
                  event.preventDefault();
                  takeBack(id, event.currentTarget, "crate");
                }
              }}
            >
              <CrateOfTen />
            </div>
          ))}
          {order.deliveredLoose.map((id, i) => (
            <span
              key={id}
              ref={keep(orderEls, id)}
              className="pm-order__orange is-movable"
              style={box.orange(i)}
              role="button"
              tabIndex={0}
              aria-label="An orange, on the counter"
              aria-describedby="pm-counter-help"
              onPointerDown={(event) => start(event, id)}
              onPointerMove={move}
              onPointerUp={(event) => end(event)}
              onPointerCancel={(event) => end(event, true)}
              onLostPointerCapture={(event) => end(event, true)}
              onClick={(event) => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                takeBack(id, event.currentTarget, "orange");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " " || event.key === "b" || event.key === "B") {
                  event.preventDefault();
                  takeBack(id, event.currentTarget, "orange");
                }
              }}
            >
              <img src={ORANGE.src} width={ORANGE.w} height={ORANGE.h} alt="" draggable={false} />
            </span>
          ))}
          <p id="pm-counter-help" className="pm-sr-only">
            Press Enter to put it back on the stall.
          </p>
        </div>
      )}

      {/* The reading round: two slots for the number, tens under the crates,
          ones under the loose oranges. */}
      {box && counter && order.entry && (
        <div className="pm-slots" aria-label="The number">
          {[
            ["tens", box.columns.crates],
            ["ones", box.columns.loose],
          ].map(([place, x]) => (
            <button
              key={place}
              type="button"
              className={`pm-slot${order.entry.active === place ? " is-active" : ""}`}
              style={{ left: x, top: box.top + box.height + 12 }}
              aria-label={`${place === "tens" ? "Tens" : "Ones"}${order.entry[place] == null ? ", empty" : `, ${order.entry[place]}`}`}
              aria-pressed={order.entry.active === place}
              onClick={() => onSlot(place)}
            >
              {order.entry[place] ?? ""}
            </button>
          ))}
        </div>
      )}

      {/* Stage B: Grandma's order, on a cloth. What it still wants is an
          outline; what has come is the real thing. */}
      {box && !counter && (
        <div
          ref={orderRef}
          className={`pm-order${order.done ? " is-done" : ""}${order.taken ? " is-taken" : ""}`}
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          role="group"
          aria-label="The customer's order"
        >
          {Array.from({ length: order.crates }, (_, i) => {
            const at = box.crate(i);
            const id = order.deliveredCrates[i];
            return id ? (
              <div key={id} ref={keep(orderEls, id)} className="pm-order__crate" style={at}>
                <CrateOfTen />
              </div>
            ) : (
              <span key={`crate-gap-${i}`} className="pm-order__crate-gap" style={at} aria-hidden="true" />
            );
          })}
          {Array.from({ length: order.loose }, (_, i) => {
            const at = box.orange(i);
            const id = order.deliveredLoose[i];
            return id ? (
              <span key={id} ref={keep(orderEls, id)} className="pm-order__orange" style={at}>
                <img src={ORANGE.src} width={ORANGE.w} height={ORANGE.h} alt="" draggable={false} />
              </span>
            ) : (
              <span key={`gap-${i}`} className="pm-order__gap" style={at} aria-hidden="true" />
            );
          })}
          <p className="pm-sr-only" aria-live="polite">
            {`In the order: ${order.deliveredCrates.length} of ${order.crates} crates, ${order.deliveredLoose.length} of ${order.loose} loose oranges.`}
          </p>
        </div>
      )}

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
        className={`pm-basket${basketHidden ? " is-hidden" : ""}${closed ? " is-closed" : ""}${order && held ? " has-loose" : ""}`}
        ref={basketRef}
        style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
      >
        <img className="pm-basket__art" src={BASKET.src} width={BASKET.w} height={BASKET.h} alt="" draggable={false} />
        {inSlots.map((slot) =>
          order ? (
            // Stage B: oranges can be taken back out, to the order.
            <span
              key={slot.id}
              ref={keep(basketEls, slot.id)}
              className="pm-basket__orange is-movable"
              style={{ left: `${slot.x - 11}%`, top: `${slot.y - 13}%` }}
              role="button"
              tabIndex={0}
              aria-label="Orange in the basket"
              aria-describedby="pm-orange-help"
              onPointerDown={(event) => start(event, slot.id)}
              onPointerMove={move}
              onPointerUp={(event) => end(event)}
              onPointerCancel={(event) => end(event, true)}
              onLostPointerCapture={(event) => end(event, true)}
              onKeyDown={(event) => {
                if (event.key === "b" || event.key === "B") {
                  event.preventDefault();
                  dropByKey(slot.id, event.currentTarget);
                }
              }}
            >
              <img src={ORANGE.src} width={ORANGE.w} height={ORANGE.h} alt="" draggable={false} />
            </span>
          ) : (
            <span
              key={slot.id}
              ref={keep(basketEls, slot.id)}
              className="pm-basket__orange"
              style={{ left: `${slot.x - 11}%`, top: `${slot.y - 13}%` }}
            >
              <img src={ORANGE.src} width={ORANGE.w} height={ORANGE.h} alt="" draggable={false} />
            </span>
          )
        )}
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
        <span key={held} className="pm-basket__tag" aria-hidden="true">
          {held}
        </span>
        <p className="pm-sr-only" aria-live="polite">
          {held === 1 ? "1 orange in the basket" : `${held} oranges in the basket`}
        </p>
      </div>

      {/* A full basket closes into a crate of ten, which stays. */}
      {closed && (
        <div
          className="pm-crate"
          style={aside ? aside.crate : closedCrate(b)}
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

      {/* A crate splitting open: its two halves fall apart. */}
      {breaking && (
        <div
          key={breaking.key}
          className="pm-crack"
          style={{ left: breaking.left, top: breaking.top, width: breaking.width }}
          aria-hidden="true"
        >
          <img className="pm-crack__half pm-crack__half--left" src={CRATE.src} width={CRATE.w} height={CRATE.h} alt="" draggable={false} />
          <img className="pm-crack__half pm-crack__half--right" src={CRATE.src} width={CRATE.w} height={CRATE.h} alt="" draggable={false} />
        </div>
      )}

      {/* Chapter 1: the crates and the loose oranges together, and how many. */}
      {stack && spotlight === "both" && (
        <span
          className="pm-game__total"
          style={{
            left: geo.left + stack.width + 6,
            top: (crates.length ? Math.min(...crates.map((id) => spotsNow.get(id).top)) : geo.rest - 60) - 8,
          }}
          aria-hidden="true"
        >
          {total}
        </span>
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
