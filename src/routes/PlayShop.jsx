import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import DialogueBox from "../components/DialogueBox";
import HintButton from "../components/HintButton";
import MarketMap from "../components/MarketMap";
import PlayHud from "../components/PlayHud";
import ShelfGame from "../components/ShelfGame";
import Sparkles, { SPARKLES_LAND_MS } from "../components/Sparkles";
import StallBackdrop from "../components/StallBackdrop";
import { EndForNow, FriendCard, OrderStrip, TraderBack } from "../components/StallCards";
import { CHAPTER_TWO, ERRANDS, FRUIT_STALL, SPEAKERS, fillLine } from "../data/dialogue";
import { FRIENDS } from "../data/friends";
import { totalChoices } from "../data/fruitStall";
import { MAP_ART, PLACES } from "../data/places";
import {
  CHAPTER_TWO_ID,
  CHAPTER_TWO_ROUNDS,
  SHOPKEEPER_PORTRAIT,
  SHOP_ART,
  SHOP_ID,
  TINS_PER_CARTON,
  moreChoices,
  setUpShopRound,
} from "../data/provisionStore";
import { getZiziLook } from "../data/zizi";
import { recordAttempt } from "../lib/attempts";
import { earnLantern } from "../lib/lanterns";
import { after, cancel, isPaused, usePaused } from "../lib/pause";
import { saveRoundReached } from "../lib/players";
import { prefetchStep } from "../lib/playFlow";
import { clearStall } from "../lib/progress";
import { playCorrect, playCrack, playMeterFull, primeSound } from "../lib/sound";
import { speak } from "../lib/speech";
import { recordRound } from "../lib/stallLog";
import "./PlayStall.css";

// How long the full meter glows before the end.
const GLOW_MS = 800;

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// Each stage's first round, for numbering rounds within a stage (1, 2, 3).
const STAGE_START = Object.fromEntries(
  ["A", "B", "C"].map((stage) => [stage, CHAPTER_TWO_ROUNDS.findIndex((round) => round.stage === stage)])
);

/*
  /play/:playerId/stall/provision: the Provision Store, Chapter 2
  (data/provisionStore.js). Chapter 1's shape exactly, with tins, cartons
  of ten and shelves, and one new idea: difference, "how many more fit?".
  From here, as at the Fruit Stall, the game never states a number the
  child could state (docs/learning-rules.md). Numbers are digits.

    ask       (once) Baba asks the child to fill his shelves and mind the
              shop, and goes along the row to ask. He has no figure in the
              scene: he is the voice in the box, and his face on it.
  Stage A, difference inside ten, and Stage B's shelves:
    play      a shelf unit, part full, and a strip that stays up: "This
              shelf holds 30 tins". The child carries cartons and loose
              tins from the delivery onto it; a carton fills an empty
              shelf, a tin the first gap; what doesn't fit springs back.
              The shelf's tag counts tins (24, 25, 26...).
    full      it glows, and its segment of the meter fills
    summary   Blob: "It had 24… and it holds 30. How many more did it
              need?" one step at a time, the tins that were there
              lighting, then the whole shelf with each shelf's 10. The
              child taps one of three numbers (moreChoices); a wrong one
              gets "Hmm, let me count these again." Only after the right
              one does Blob say it after them ("6 more!").
  Stage B's order round: a customer wants 15 tins, and there are 3
  cartons and 2 loose. Cracking a carton is not taught again: no demo, no
  warning, nothing greyed out; a tapped carton opens, any time. If the
  child gets stuck (no loose tins, and a carton won't do), Blob wonders
  out loud after a touch or two seconds, as he did with crates.
    play      tins and cartons go onto the shop's counter; anything over
              springs back; anything on it can be taken back. The counter
              counts tins. Done, once something is on it: the customer
              checks it.
    done      the customer takes it
    summary   Blob: "1 carton… and 7 loose. How many is that?", as in
              Chapter 1, about what is left.
  Stage C, three tests, nothing but the hint button: no Blob, no
  counting aloud. Shelf rounds ask "This shelf holds 30 tins. How many
  more fit?": the child puts that many on the counter (its count hidden:
  it would be the answer), Done checks the cartons then the loose tins,
  and if it's right they go up onto the shelf and fill it. The order
  round is a customer's order, and needs a carton opened. Wrong answers
  get "Hmm, let me count these again." Every answer is saved
  (lib/attempts.js), with the shelf's size (`holds`).
  At the end:
    back      Baba comes back, with news: someone thinks they saw a woman
              asking after a child. His lantern, and the first time one
              more, for minding the shop alone; after that, one for coming
              back.
    friend    the first time only: Chapter 2 is saved (a
              "provision-store-chapter-2" row), and Blob's next friend
              joins the search (data/friends.js). No keepsakes.
    map       the map: the child's pin on the Provision Store, and the
              first time the haze lifts off the place after it. "Carry
              on here" on a place they have finished plays it again.
    end       as they leave the map, Blob's errand

  Coming back, a child starts at the furthest point they reached here,
  as at the Fruit Stall: the round they were on (players.round_reached,
  which is this chapter's once they have stepped in: the
  "provision-store" row), Baba already gone; with Chapter 2 finished, the
  map; if they left before they saw it, Baba's return and the cards
  first. Playing it again is only ever their choice, from the map.

  Blob's hint button is there in every round, the tests too: for a few
  seconds every carton shows its 10, and each shelf what it holds.
  Whether it was used goes into the round's answers.
*/

/*
  The shop starts afresh (a new `run`) from the map's "Carry on here", as
  a replay from Chapter 2's start, with what the child has done today
  added to what was loaded. Coming from the Fruit Stall's map, what was
  done there today comes with them (the route's state).
*/
export default function PlayShop() {
  const { player } = useOutletContext();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [run, setRun] = useState(() => ({ n: 0, cleared: state?.cleared ?? [], lanterns: state?.lanterns ?? 0 }));
  const now = {
    ...player,
    cleared_stalls: [...new Set([...(player.cleared_stalls ?? []), ...run.cleared])],
    lanterns: player.lanterns == null ? null : player.lanterns + run.lanterns,
  };
  return (
    <ProvisionStore
      key={run.n}
      player={now}
      replay={run.n > 0}
      onAgain={({ cleared, lanterns }) =>
        setRun((r) => ({ n: r.n + 1, cleared: [...r.cleared, ...cleared], lanterns: r.lanterns + lanterns }))
      }
      onFruitStall={({ cleared, lanterns }) =>
        navigate(`/play/${player.id}/stall/fruit`, {
          replace: true,
          state: { replay: true, cleared: [...run.cleared, ...cleared], lanterns: run.lanterns + lanterns },
        })
      }
    />
  );
}

function ProvisionStore({ player, replay, onAgain, onFruitStall }) {
  const roundCount = CHAPTER_TWO_ROUNDS.length;
  const enteredBefore = (player.cleared_stalls ?? []).includes(SHOP_ID);
  const chapterDoneBefore = (player.cleared_stalls ?? []).includes(CHAPTER_TWO_ID);
  // Where this visit starts, the furthest point they reached (see above):
  //   start   Chapter 2's beginning, with Baba's lines (and so the first
  //           time, and from "Carry on here")
  //   round   part way through: the round they were on
  //   ending  finished, but they left before the map
  //   map     finished, and the map seen
  const reached = enteredBefore && !replay ? Math.min(player.round_reached ?? 0, roundCount - 1) : 0;
  let resume = "start";
  if (!replay && chapterDoneBefore) resume = reached > 0 ? "ending" : "map";
  else if (reached > 0) resume = "round";

  const [round, setRound] = useState(() => setUpShopRound(resume === "round" ? reached : resume === "ending" ? roundCount - 1 : 0));
  const [cartons, setCartons] = useState(() => round.cartonIds); // in the delivery
  const [tins, setTins] = useState(() => round.tinIds); // loose, in the delivery
  const [placed, setPlaced] = useState([]); // on the shelf: { id, kind, level } or { id, kind, slot }
  const [delivered, setDelivered] = useState({ cartons: [], tins: [] }); // on the counter
  const [counted, setCounted] = useState([]);
  const [wall, setWall] = useState(false);
  const [orderReady, setOrderReady] = useState(false);
  const [orderTaken, setOrderTaken] = useState(false);
  // Chapter 2 finished the first time: today, or last time, if they left
  // before its ending.
  const [chapterJustCleared, setChapterJustCleared] = useState(resume === "ending");
  const [lanternsToday, setLanternsToday] = useState(0);
  const [introStep, setIntroStep] = useState(0);
  const [said, setSaid] = useState(null); // the number the child has said for Blob's question
  const [mapReached, setMapReached] = useState(resume === "map");
  const [tensKey, setTensKey] = useState(null);
  const [phase, setPhase] = useState({ round: "play", ending: "back", map: "map" }[resume] ?? "ask");
  const [wrongTaps, setWrongTaps] = useState(0);
  const [lineStep, setLineStep] = useState(0);
  const [stall, setStall] = useState(null); // the shop picture, once it's in the page
  // Whether their "been here" row is saved: only then are rounds saved.
  const [entered, setEntered] = useState(enteredBefore);
  const paused = usePaused();
  const navigate = useNavigate();
  const gameRef = useRef(null);
  const tally = useRef({ hints: 0, wrong: 0 });
  const timers = useRef([]);
  const zizi = getZiziLook(player.character);

  // Every wait here holds while the game is paused (lib/pause.js).
  const later = (fn, ms) => timers.current.push(after(fn, ms));
  useEffect(() => () => timers.current.forEach(cancel), []);

  // The first time a child steps in: from now on a visit starts here, and
  // round_reached is this chapter's, from 0. The round is reset first, so
  // a "been here" row never sits beside another chapter's round.
  useEffect(() => {
    if (enteredBefore) return;
    const warn = (error) => console.warn("Couldn't save that they have been to the Provision Store.", error);
    saveRoundReached(player.id, 0)
      .then(({ error }) => (error ? { error } : clearStall(player.id, SHOP_ID)))
      .then(({ error }) => {
        if (error) warn(error);
        else setEntered(true);
      })
      .catch(warn);
  }, []);

  // --- the progress meter -----------------------------------------------------
  const [meterTotal] = useState(() => (resume === "ending" || resume === "map" ? 0 : roundCount - round.index));
  const [meterFilled, setMeterFilled] = useState(0);
  const [meterGlow, setMeterGlow] = useState(false);
  const [bursts, setBursts] = useState([]);
  const filledRef = useRef(0);
  const meterRef = useRef(null);

  // A round answered: sparkles from the shelf's count (or `origin`, the
  // counter) into the next segment, which lights, with the "yes", as they
  // land. The last one glows, with the warmer sound; `then` runs after.
  const fillMeter = (then, origin = null) => {
    const i = filledRef.current;
    if (i >= meterTotal) {
      then?.();
      return;
    }
    filledRef.current = i + 1;
    const last = i + 1 === meterTotal;
    const land = () => {
      setMeterFilled(i + 1);
      if (last) {
        playMeterFull();
        setMeterGlow(true);
        later(() => setMeterGlow(false), GLOW_MS);
        if (then) later(then, GLOW_MS);
      } else {
        playCorrect();
        then?.();
      }
    };
    const from = (origin ?? gameRef.current?.shelfTag() ?? gameRef.current?.counter())?.getBoundingClientRect();
    const to = meterRef.current?.querySelector(`[data-segment="${i}"]`)?.getBoundingClientRect();
    if (!from || !to || reducedMotion()) {
      land();
      return;
    }
    const key = `${i}-${Date.now()}`;
    const x = from.left + from.width / 2;
    const y = from.top + from.height / 2;
    setBursts((list) => [...list, { key, x, y, dx: to.left + to.width / 2 - x, dy: to.top + to.height / 2 - y }]);
    later(land, SPARKLES_LAND_MS);
    later(() => setBursts((list) => list.filter((b) => b.key !== key)), 700);
  };

  const shelfRound = round.kind === "shelf";
  const stageB = round.stage === "B";
  const stageC = round.stage === "C";
  const stageRound = round.index - STAGE_START[round.stage] + 1;
  const levels = round.levels;

  // The shelf, slot by slot: what was there, and what the child put on it.
  const taken = new Set(Array.from({ length: round.had }, (_, slot) => slot));
  for (const item of placed) {
    if (item.kind === "carton") for (let k = 0; k < TINS_PER_CARTON; k++) taken.add(item.level * TINS_PER_CARTON + k);
    else taken.add(item.slot);
  }
  const room = shelfRound ? round.holds - taken.size : 0;
  const emptyLevel = Array.from({ length: levels }, (_, level) => level).find((level) =>
    Array.from({ length: TINS_PER_CARTON }, (_, k) => level * TINS_PER_CARTON + k).every((slot) => !taken.has(slot))
  );
  const handedOver = delivered.cartons.length * TINS_PER_CARTON + delivered.tins.length;
  const stillWanted = round.kind === "order" ? round.want - handedOver : 0;
  const target = phase !== "play" ? null : stageC || round.kind === "order" ? "counter" : "shelf";

  const values = {
    name: player.game_name,
    holds: round.holds,
    had: round.had,
    want: round.want,
    more: round.want,
    cartons: `${cartons.length} ${cartons.length === 1 ? "carton" : "cartons"}`,
    loose: tins.length,
    sum: cartons.length * TINS_PER_CARTON + tins.length,
  };
  // Blob's steps once a shelf is full, or after an order, and his question.
  const stepped = phase === "summary" ? (shelfRound ? CHAPTER_TWO.shelfAsk : CHAPTER_TWO.cartonsAsk) : null;
  const askingTotal = stepped && lineStep >= stepped.length && said == null;
  const options =
    phase === "summary"
      ? shelfRound
        ? moreChoices(round.holds, round.had, round.seed)
        : totalChoices(cartons.length, tins.length, round.seed)
      : null;

  const startRound = (index) => {
    const next = setUpShopRound(index);
    setRound(next);
    setCartons(next.cartonIds);
    setTins(next.tinIds);
    setPlaced([]);
    setDelivered({ cartons: [], tins: [] });
    setCounted([]);
    setWall(false);
    setOrderReady(false);
    setOrderTaken(false);
    setSaid(null);
    setWrongTaps(0);
    setLineStep(0);
    tally.current = { hints: 0, wrong: 0 };
    setPhase("play");
    // The map comes at the end: fetch it while the child does the tests.
    if (next.stage === "C") new Image().src = MAP_ART.src;
  };

  // Part way through, the first time: the round they are on, saved as
  // they reach it, so a child who leaves comes back to it. Back to 0 once
  // they have seen the map. A replay saves nothing.
  const saveWhereTheyAre = (index) => {
    saveRoundReached(player.id, index)
      .then(({ error }) => {
        if (error) console.warn("Couldn't save where they got to.", error);
      })
      .catch((error) => console.warn("Couldn't save where they got to.", error));
  };

  // After a round: on to the next. After the last: the meter glows, and
  // Baba comes back with his lantern.
  const afterRound = () => {
    if (round.index + 1 < roundCount) {
      if (entered && !chapterDoneBefore) saveWhereTheyAre(round.index + 1);
      startRound(round.index + 1);
    } else {
      primeSound(); // from this tap, so the sounds may play
      setPhase("finishing");
      fillMeter(() => setPhase("back"));
    }
  };

  // --- what the child does ----------------------------------------------------------
  const tap = (id) => setCounted((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  // Onto the shelf: a carton to the first shelf with nothing on it, a tin
  // to the first gap. What doesn't fit springs back.
  const placeOnShelf = (id, kind) => {
    if (phase !== "play" || !shelfRound || stageC) return false;
    let item = null;
    if (kind === "carton") {
      if (emptyLevel == null) return false;
      item = { id, kind, level: emptyLevel };
    } else {
      const slot = Array.from({ length: round.holds }, (_, s) => s).find((s) => !taken.has(s));
      if (slot == null) return false;
      item = { id, kind, slot };
    }
    primeSound(); // from this drop, for the "yes" when the shelf is full
    setPlaced((list) => [...list, item]);
    if (kind === "carton") setCartons((list) => list.filter((x) => x !== id));
    else {
      setTins((list) => list.filter((x) => x !== id));
      setCounted((list) => list.filter((x) => x !== id));
    }
    return true;
  };

  // Onto the counter: an order's tins, or a test's answer. In Stage B
  // anything that would make more than the order springs back; Stage C's
  // counter takes anything.
  const deliver = (id, kind) => {
    if (phase !== "play" || orderReady) return false;
    if (stageB && handedOver + (kind === "carton" ? TINS_PER_CARTON : 1) > round.want) return false;
    if (kind === "carton") {
      setCartons((list) => list.filter((x) => x !== id));
      setDelivered((now) => ({ ...now, cartons: [...now.cartons, id] }));
    } else {
      setTins((list) => list.filter((x) => x !== id));
      setDelivered((now) => ({ ...now, tins: [...now.tins, id] }));
      setCounted((list) => list.filter((x) => x !== id));
    }
    primeSound();
    return true;
  };

  // Back off the counter, to the delivery.
  const takeBack = (id, kind) => {
    if (phase !== "play" || orderReady) return false;
    if (kind === "carton") {
      setDelivered((now) => ({ ...now, cartons: now.cartons.filter((x) => x !== id) }));
      setCartons((list) => [...list, id]);
    } else {
      setDelivered((now) => ({ ...now, tins: now.tins.filter((x) => x !== id) }));
      setTins((list) => [...list, id]);
    }
    return true;
  };

  // A carton split open: its ten tins join the loose ones.
  const crackOpen = (id, ids) => {
    playCrack();
    setCartons((list) => list.filter((x) => x !== id));
    setTins((list) => [...list, ...ids]);
    setWall(false);
  };

  const canCrack = phase === "play" && (stageB || stageC);

  const attempt = (fields) =>
    recordAttempt({
      playerId: player.id,
      stallId: CHAPTER_TWO_ID,
      round: stageRound,
      usedHint: tally.current.hints > 0,
      holds: round.holds ?? undefined,
      ...fields,
    })
      .then(({ error }) => {
        if (error) console.warn("Couldn't save that answer.", error);
      })
      .catch((error) => console.warn("Couldn't save that answer.", error));

  // Wrong: "Hmm, let me count these again.", and nothing else.
  const tryAgain = () => {
    tally.current.wrong += 1;
    setWrongTaps((n) => n + 1);
  };

  // Blob's question: how many more a shelf needed, or how many are left.
  // Every tap is saved, with the number picked. Right: the "yes", and Blob
  // says it after them.
  const chooseTotal = (value) => {
    const right = options.right;
    const onShelf = placed.filter((item) => item.kind === "carton").length;
    attempt({
      stage: `${round.stage}-ask`,
      asked: right,
      crates: shelfRound ? onShelf : cartons.length,
      loose: shelfRound ? placed.length - onShelf : tins.length,
      total: value,
      failedStep: value === right ? null : "total",
    });
    if (value === right) {
      playCorrect();
      setWrongTaps(0);
      setSaid(value);
    } else tryAgain();
  };

  // Stage B: Done. The customer counts it.
  const checkOrder = () => {
    if (!stageB || round.kind !== "order" || phase !== "play" || orderReady || handedOver === 0) return;
    primeSound();
    attempt({
      stage: "B",
      asked: round.want,
      crates: delivered.cartons.length,
      loose: delivered.tins.length,
      total: handedOver,
      failedStep: handedOver === round.want ? null : "total",
    });
    if (handedOver === round.want) {
      setWrongTaps(0);
      setOrderReady(true);
    } else tryAgain();
  };

  // Chapter 2 cleared: saved the moment it happens.
  const clearChapter = () => {
    if (chapterDoneBefore || chapterJustCleared) return;
    setChapterJustCleared(true);
    clearStall(player.id, CHAPTER_TWO_ID)
      .then(({ error }) => {
        if (error) console.warn("Couldn't save that Chapter 2 was cleared.", error);
      })
      .catch((error) => console.warn("Couldn't save that Chapter 2 was cleared.", error));
  };

  const earnChapterLantern = (reason) => {
    earnLantern(player.id, CHAPTER_TWO_ID, reason)
      .then(({ earned, error }) => {
        if (error) console.warn("Couldn't save the lantern.", error);
        if (earned) setLanternsToday((n) => n + 1);
      })
      .catch((error) => console.warn("Couldn't save the lantern.", error));
  };

  const finishTest = () => {
    recordRound({ playerId: player.id, stallId: CHAPTER_TWO_ID, round: round.number, hintsUsed: tally.current.hints, wrongAnswers: tally.current.wrong });
    setPhase("done");
    fillMeter(null, shelfRound ? gameRef.current?.shelf() : gameRef.current?.counter());
    if (round.index === roundCount - 1) {
      clearChapter();
      earnChapterLantern("teaching");
      earnChapterLantern(chapterDoneBefore ? "replay" : "test");
    }
  };

  // Stage C: Done. The cartons, then the loose tins, against the number.
  // A shelf's right answer goes up onto it, a carton to an empty shelf and
  // each tin to a gap.
  const handOver = () => {
    if (!stageC || phase !== "play") return;
    primeSound();
    const tens = Math.floor(round.want / TINS_PER_CARTON);
    const ones = round.want % TINS_PER_CARTON;
    const failedStep = delivered.cartons.length !== tens ? "crates" : delivered.tins.length !== ones ? "loose" : null;
    attempt({ stage: "C", asked: round.want, crates: delivered.cartons.length, loose: delivered.tins.length, total: handedOver, failedStep });
    if (failedStep) {
      tryAgain();
      return;
    }
    setWrongTaps(0);
    if (shelfRound) {
      gameRef.current?.noteWhere([...delivered.cartons, ...delivered.tins]);
      const free = new Set(taken);
      const up = [];
      for (const id of delivered.cartons) {
        const level = Array.from({ length: levels }, (_, l) => l).find((l) =>
          Array.from({ length: TINS_PER_CARTON }, (_, k) => l * TINS_PER_CARTON + k).every((slot) => !free.has(slot))
        );
        for (let k = 0; k < TINS_PER_CARTON; k++) free.add(level * TINS_PER_CARTON + k);
        up.push({ id, kind: "carton", level });
      }
      for (const id of delivered.tins) {
        const slot = Array.from({ length: round.holds }, (_, s) => s).find((s) => !free.has(s));
        free.add(slot);
        up.push({ id, kind: "tin", slot });
      }
      setPlaced(up);
      setDelivered({ cartons: [], tins: [] });
    }
    finishTest();
  };

  // --- stuck: Blob wonders --------------------------------------------------------
  // In Stage B, when there are no loose tins left and a whole carton
  // won't do: he waits for the child to reach for something (any touch
  // but the corners) or sit still two seconds, then wonders out loud.
  const need = shelfRound ? room : stillWanted;
  const stuck =
    stageB &&
    phase === "play" &&
    need > 0 &&
    tins.length === 0 &&
    !(cartons.length > 0 && (shelfRound ? emptyLevel != null : need >= TINS_PER_CARTON));
  const wallLine = wall && stuck;

  useEffect(() => {
    if (!stuck || wall) return undefined;
    const ask = (event) => {
      if (!event?.target?.closest?.(".pm-hud")) setWall(true);
    };
    const id = after(ask, 2000);
    window.addEventListener("pointerdown", ask, { capture: true });
    return () => {
      cancel(id);
      window.removeEventListener("pointerdown", ask, { capture: true });
    };
  }, [stuck, wall]);

  // Blob's hint, in every round, the tests too: every carton's 10 and
  // each shelf's, for a few seconds. Whether it was used is saved.
  const hintTens = () => {
    tally.current.hints += 1;
    const key = Date.now();
    setTensKey(key);
    later(() => setTensKey((now) => (now === key ? null : now)), 3200);
  };

  // --- the end of a round -------------------------------------------------------------
  useEffect(() => {
    if (phase !== "play") return undefined;
    let next = null;
    if (shelfRound && !stageC) {
      if (room === 0) next = "full";
    } else if (round.kind === "order" && stageB) {
      if (orderReady) next = "done";
    }
    if (!next) return undefined;
    const id = after(() => {
      recordRound({ playerId: player.id, stallId: CHAPTER_TWO_ID, round: round.number, hintsUsed: tally.current.hints, wrongAnswers: null });
      setPhase(next);
      fillMeter(null, next === "done" ? gameRef.current?.counter() : null);
    }, 500);
    return () => cancel(id);
  }, [phase, room, orderReady, round]);

  // A full shelf glows; then Blob says what is there.
  useEffect(() => {
    if (phase !== "full") return undefined;
    const say = after(() => {
      setLineStep(1);
      setPhase("summary");
    }, 1000);
    return () => cancel(say);
  }, [phase]);

  // An order glows and the customer takes it. In Stage B Blob then says
  // what is left; Stage C just goes on.
  useEffect(() => {
    if (phase !== "done") return undefined;
    const take = after(() => setOrderTaken(true), 900);
    const go = after(() => {
      if (stageC) {
        afterRound();
        return;
      }
      setLineStep(1);
      setPhase("summary");
    }, 1600);
    return () => {
      cancel(take);
      cancel(go);
    };
  }, [phase]);

  // Blob's steps, one at a time, each paced by the voice (about a second
  // apart); with nothing to hear, the child taps through them. While the
  // game is paused nothing is said; when it goes on, the line is said again.
  useEffect(() => {
    if (!stepped || lineStep < 1 || paused) return undefined;
    const words = fillLine(stepped[lineStep - 1].say, values);
    const last = lineStep >= stepped.length;
    let gone = false;
    let moved = false;
    const waits = [];
    const startedAt = performance.now();
    const moveOn = () => {
      if (gone || moved || last || isPaused()) return;
      moved = true;
      const wait = Math.max(250, 1000 - (performance.now() - startedAt));
      waits.push(after(() => !gone && setLineStep((n) => n + 1), wait));
    };
    if (speak(words, SPEAKERS.blob.voice, { onEnd: moveOn })) waits.push(after(moveOn, 4000));
    return () => {
      gone = true;
      waits.forEach(cancel);
    };
    // `values` belongs to the round, which doesn't change during it.
  }, [phase, lineStep, paused]);

  // On the map, the Fruit Stall is fetched in the background, for "Carry on here".
  useEffect(() => {
    if (phase === "map") prefetchStep("stall/fruit", player);
  }, [phase]);

  // --- what is on screen ---------------------------------------------------------------
  const playing = phase === "play";
  const steppedLine = stepped && lineStep > 0 ? { speaker: "blob", text: stepped[Math.min(lineStep, stepped.length) - 1].show } : null;
  const blobSays = wallLine
    ? CHAPTER_TWO.wall
    : said != null
      ? shelfRound
        ? CHAPTER_TWO.shelfSaid
        : CHAPTER_TWO.cartonsSaid
      : steppedLine;
  const spotlight =
    phase !== "summary"
      ? null
      : said != null
        ? shelfRound
          ? "added"
          : "both"
        : (shelfRound ? [null, "had", "holds", "holds"] : [null, "cartons", "tins", "both"])[Math.min(lineStep, 3)];
  const nextStep = () => {
    if (stepped && lineStep < stepped.length) setLineStep((n) => n + 1);
    else afterRound();
  };
  // What the child has: what was saved before, and what they did today.
  const earned = [
    ...(player.cleared_stalls ?? []),
    ...(entered ? [SHOP_ID] : []),
    ...(chapterJustCleared ? [CHAPTER_TWO_ID] : []),
  ];
  const friend = FRIENDS.find((f) => f.place === CHAPTER_TWO_ID);
  const opening = chapterJustCleared ? PLACES.find((place) => place.opensAfter === CHAPTER_TWO_ID)?.id ?? null : null;
  const toTheMap = () => {
    setMapReached(true);
    setPhase("map");
  };

  return (
    <div
      className="pm-stall pm-shop-screen"
      onClick={(event) => {
        // While Blob says what is there, a tap anywhere moves to the next
        // step: that's how a child with the sound off goes through it.
        if (stepped && lineStep < stepped.length && !event.target.closest(".pm-tin, .pm-carton, .pm-hud, .pm-dialogue")) {
          setLineStep((n) => n + 1);
        }
      }}
    >
      <StallBackdrop close stall={SHOP_ART} stallRef={setStall} />
      <PlayHud
        player={player}
        earned={earned}
        lanterns={player.lanterns == null ? null : player.lanterns + lanternsToday}
        onHome={phase === "map" ? () => setPhase("end") : undefined}
        meter={meterTotal ? { total: meterTotal, filled: meterFilled, glow: meterGlow, ref: meterRef } : null}
      />

      <main id="main" className="pm-stall__stage">
        <h1 className="pm-sr-only">The Provision Store</h1>

        <ShelfGame
          ref={gameRef}
          stall={stall}
          seed={round.seed}
          cartons={cartons}
          tins={tins}
          counted={counted}
          shelf={shelfRound ? { holds: round.holds, had: round.had, placed, done: phase === "full" || (stageC && phase === "done") } : null}
          counter={
            round.kind === "order" || stageC
              ? {
                  cartons: delivered.cartons,
                  tins: delivered.tins,
                  // Not in a shelf test, where it would be the answer.
                  counts: !(stageC && shelfRound),
                  done: phase === "done" && !shelfRound,
                  taken: orderTaken && !shelfRound,
                }
              : null
          }
          target={target}
          canDrag={playing}
          canTap={playing && !stageC}
          canCrack={canCrack}
          inviteCrack={wallLine}
          hintKey={tensKey}
          spotlight={spotlight}
          answer={said}
          onTap={tap}
          onPlace={target === "shelf" ? placeOnShelf : deliver}
          onReturn={takeBack}
          onCrack={crackOpen}
        />

        {blobSays && (
          <div className="pm-stall__blob" aria-hidden="true">
            <img src={SPEAKERS.blob.portrait} width={736} height={900} alt="" draggable={false} />
          </div>
        )}

        <div className="pm-stall__top">
          {/* Stage A and B's shelves: what the shelf holds, up all round. */}
          {shelfRound && !stageC && (phase === "play" || phase === "full") && (
            <OrderStrip
              who={CHAPTER_TWO.shelfStrip.who}
              text={fillLine(CHAPTER_TWO.shelfStrip.text, values)}
              say={fillLine(CHAPTER_TWO.shelfStrip.say, values)}
              voice="narrator"
            />
          )}

          {/* Stage B's order, up all round, and Done once something is on the counter. */}
          {round.kind === "order" && stageB && (phase === "play" || phase === "done") && (
            <OrderStrip
              who={SPEAKERS.customer.label}
              text={fillLine(CHAPTER_TWO.orderStrip, values)}
              say={fillLine(CHAPTER_TWO.order.text, values)}
              onDone={phase === "play" && !orderReady && handedOver > 0 ? checkOrder : null}
              doneLabel={CHAPTER_TWO.test.done}
              note={wrongTaps > 0 ? FRUIT_STALL.countAgain : null}
              noteKey={wrongTaps}
            />
          )}

          {phase === "ask" && (
            <DialogueBox
              line={CHAPTER_TWO.intro[introStep]}
              values={values}
              ziziPortrait={zizi}
              onNext={() => {
                // Baba's two lines, then he goes.
                if (introStep < CHAPTER_TWO.intro.length - 1) setIntroStep((n) => n + 1);
                else setPhase("play");
              }}
            />
          )}

          {/* Stage C: the question, and Done once something is on the counter. */}
          {stageC && phase === "play" && (
            <DialogueBox
              line={shelfRound ? CHAPTER_TWO.test.shelf : CHAPTER_TWO.test.order}
              values={values}
              ziziPortrait={zizi}
              note={wrongTaps > 0 ? FRUIT_STALL.countAgain : null}
              noteKey={wrongTaps}
              buttonLabel={CHAPTER_TWO.test.done}
              onNext={handedOver === 0 ? null : handOver}
            />
          )}

          {blobSays && (
            <DialogueBox
              line={blobSays}
              values={values}
              ziziPortrait={zizi}
              choices={askingTotal ? options.choices : null}
              onChoose={chooseTotal}
              note={askingTotal && wrongTaps > 0 ? FRUIT_STALL.countAgain : null}
              noteKey={wrongTaps}
              silent={Boolean(stepped) && said == null}
              buttonLabel={FRUIT_STALL.next}
              onNext={wallLine ? null : nextStep}
            />
          )}
        </div>

        {/* Help is always there, in every round. */}
        {playing && <HintButton message={null} shownKey={0} onHint={hintTens} />}
      </main>

      {bursts.map((burst) => (
        <Sparkles key={burst.key} x={burst.x} y={burst.y} dx={burst.dx} dy={burst.dy} />
      ))}

      {phase === "back" && (
        <TraderBack
          words={CHAPTER_TWO.back}
          portrait={SHOPKEEPER_PORTRAIT}
          voice={SPEAKERS.shopkeeper.voice}
          first={chapterJustCleared}
          values={values}
          onDone={() => (chapterJustCleared ? setPhase("friend") : toTheMap())}
        />
      )}
      {phase === "friend" && (
        <FriendCard
          friend={friend}
          words={CHAPTER_TWO.friend}
          onDone={() => {
            saveWhereTheyAre(0);
            toTheMap();
          }}
        />
      )}
      {/* The map is where the chapter ends. The errand is the sign-off as
          the child leaves it (the corner's home button), over the map. */}
      {phase === "end" && (
        <EndForNow
          errands={ERRANDS[SHOP_ID]}
          labels={FRUIT_STALL.endForNow}
          sayEnd={!chapterJustCleared}
          endLine={CHAPTER_TWO.endLine}
          onDone={() => navigate("/play")}
        />
      )}
      {(phase === "map" || (phase === "end" && mapReached)) && (
        <MarketMap
          zizi={zizi}
          cleared={earned}
          opening={opening}
          onGo={(place) => {
            const today = { cleared: [SHOP_ID, ...(chapterJustCleared ? [CHAPTER_TWO_ID] : [])], lanterns: lanternsToday };
            if (place.id === "shop") onAgain(today);
            // The Fruit Stall, again: what was done here today goes too.
            else onFruitStall(today);
          }}
        />
      )}
    </div>
  );
}
