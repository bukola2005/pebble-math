import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import BasketAward from "../components/BasketAward";
import BasketGame from "../components/BasketGame";
import CoachMark from "../components/CoachMark";
import DialogueBox from "../components/DialogueBox";
import HintButton from "../components/HintButton";
import MarketMap from "../components/MarketMap";
import PlayHud from "../components/PlayHud";
import RewardItems from "../components/RewardItems";
import Sparkles, { SPARKLES_LAND_MS } from "../components/Sparkles";
import StallBackdrop from "../components/StallBackdrop";
import { EndForNow, OrderStrip, TraderBack } from "../components/StallCards";
import {
  ERRANDS,
  FRUIT_STALL,
  HINTS,
  NUMBER_WORDS,
  SPEAKERS,
  TUTORIAL,
  CHAPTER_ONE,
  capitalise,
  fillLine,
  numberName,
  readOrderWords,
} from "../data/dialogue";
import {
  BASKET_HOLDS,
  CHAPTER_ONE_ID,
  CHAPTER_ONE_ROUNDS,
  FIRST_ORDER_ROUND,
  FIRST_TEST_ROUND,
  ROUND_COUNT,
  setUpChapterRound,
  setUpRound,
  totalChoices,
} from "../data/fruitStall";
import { ORANGE, SELLER_PORTRAIT } from "../data/market";
import { MAP_ART, PLACES } from "../data/places";
import { SHOP_ID } from "../data/provisionStore";
import { REWARDS } from "../data/rewards";
import { getZiziLook } from "../data/zizi";
import { recordAttempt } from "../lib/attempts";
import { earnLantern } from "../lib/lanterns";
import { after, cancel, isPaused, usePaused } from "../lib/pause";
import { saveRoundReached } from "../lib/players";
import { prefetchStep } from "../lib/playFlow";
import { clearStall } from "../lib/progress";
import { playCorrect, playCrack, playMeterFull, primeSound } from "../lib/sound";
import { speak, useReadAloud } from "../lib/speech";
import { recordRound } from "../lib/stallLog";
import "./PlayStall.css";

const STALL_ID = "fruit-stall";

// The numeral tray for Stage C's reading round.
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

// How long the full meter glows before the end.
const GLOW_MS = 800;

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/*
  /play/:playerId/stall/fruit: the Fruit Stall, rounds 1 to 5
  (data/fruitStall.js). Oranges sit on the stall's table; the basket
  stands in front of it.

  Round 1 is practice, labelled so:
    award     a child new here (just come from Scene 1) is given the basket
    tutorial  four beats, one highlight each, tap anywhere to move on;
              the last one lets them try a drag
    practised that orange hops back out of the basket
    ask       the seller asks for N oranges
    play      drag them in; the basket counts each drop
    won       Blob: "You did it!"
  Rounds 2 to 5 fill the basket to ten:
    question  (rounds 2 and 3) Blob asks how many MORE; a wrong number
              gets "Count again…"
    play      drag oranges in
    closing   the full basket closes into a crate of ten
    summary   the leftovers move onto a cloth beside the crate, and Blob
              says "Ten… and three. Thirteen." one step at a time, each
              step lighting up what it names
    puzzled   (round 5) every orange is in and the basket isn't full.
              Blob says what happened, one line at a time: "Hmm. The
              basket didn't fill this time." "Nine. One short of ten."
              (the empty space lights up) "Not every pile makes a ten.
              That's fine." The tutorial is done, and the stall cleared:
              stall_progress gets its row now.
    finishing after round 5's Next: its segment of the meter fills and the
              whole meter glows
  And then straight into Chapter 1, the same stall, as if the child had
  just come back.

  A child who has finished the tutorial plays Chapter 1 instead: the same
  stall, with full crates on the table. From here the game never breaks a
  number down for the child and never says a total they could say: a
  customer asks for a number, the child decides what that is in crates
  and loose, and the child says how many (docs/learning-rules.md). Nothing
  is outlined; a tapped crate shows a quiet 10 for a moment, in practice
  only. Stage A adds past ten (data/fruitStall.js, CHAPTER_ONE_ROUNDS):
    ask       Grandma asks the child to pack the new oranges and mind the
              stall, and goes along the row to ask about their mother
              (once): she walks out of the picture. From here the child
              serves the customers alone.
    play      fill the basket (Blob's hint button can show its empty
              spaces, if the child asks)
    closing   it shuts into a crate, which goes up onto the table with
              the others (the basket is empty again)
    summary   Blob: "Three crates… and four loose. How many is that?" one
              step at a time, the crates lighting, then the loose oranges,
              then both. The child taps one of three numbers (the right
              one, its digits swapped, its digits added); a wrong one gets
              "Hmm, let me count these again." Each tap is saved
              (lib/attempts.js). Only after the right one does Blob say it,
              and the number shows.
  Stage B takes away, cracking a crate open when there aren't enough
  loose oranges:
    play      a customer asks for a number ("15 oranges, please."), and it
              stays up all round, as a small strip: "15 oranges". The
              child carries crates and loose oranges to a plain cloth
              beside the basket, any mix; anything that would go over
              springs back, and anything on the cloth can be taken back.
              The cloth counts in oranges, a crate as 10 (10, 20, 21…).
              Done, once something is on it: the customer checks ("Hmm,
              let me count these again." if it isn't right). In the first round
              there aren't enough loose ones, and nothing says so: the
              child runs out, reaches for another, and only then does
              Blob ask "What's inside a crate?" From then on a tapped crate
              splits open, with a wooden crack, and its ten oranges spill
              into the basket. (In the next rounds a crate can be opened
              whenever the child likes.)
    done      it glows and the customer takes it; the loose oranges left
              on the table go into the basket, so they are one group
    summary   Blob: "One crate… and seven loose. How many is that?", and
              the child taps it, as in Stage A. As he names them, each
              crate shows its 10 and the loose ones their number.
  Stage C is three test rounds, with nothing to help: no outlines, no
  hint, no Blob, no counting aloud, and the basket put away. The
  customer's order stays up with a Done button; the counter starts empty.
    play      carry crates and loose oranges from the stall to the
              counter (anything can be taken back). Done checks it: the
              crates, then the loose ones. Wrong: "Count again…", and they
              try again, as often as they like. Every answer is saved
              (lib/attempts.js) with the step that broke.
              In the reading round, once the right oranges are handed
              over, the customer asks how many that is, and the child taps
              numerals into two slots under the counter: tens under the
              crates, ones under the loose oranges.
    done      the counter glows and the customer takes it
  At the end of Chapter 1:
    back      Grandma comes back (into the picture, and on a card): no
              news yet. Her lantern arrives, and the first time one more,
              for serving the customers alone; after that, one for coming
              back (data/lanterns.js). She points at the next part of the
              market.
    opening   the first time only: Chapter 1 is saved (a
              "fruit-stall-chapter-1" row), which earns the straw hat and
              the tally stick (data/rewards.js); a card says Grandma gives
              them, and that the market is opening up: the map is next.
    end       Blob's errand, and then
    map       the market map (components/MarketMap.jsx): the Fruit Stall
              clear, the child's pin on it, and, the first time, the two
              lanterns floating to the Provision Store as its haze pulls
              back. "Carry on here" on the Fruit Stall plays Chapter 1
              again; "Let's go" on the Provision Store goes there
              (routes/PlayShop.jsx).

  Coming back, a child starts at the furthest point they reached. Part
  way through Chapter 1 the first time, that is the round they were on
  (players.round_reached, saved as each round is reached), with Grandma
  already gone along the row. With Chapter 1 finished, it is the map, with
  nothing opening; if they left before they saw it, Grandma's return and
  the cards first, then the map, opening. Playing it again is only ever
  the child's choice: "Carry on here", on the map. Once they have stepped
  into the Provision Store, a visit starts there instead, and
  round_reached is its chapter's (routes/PlayShop.jsx).

  Blob's hint button gives one step of help per tap, and how many a
  child used is noted for each round (lib/stallLog.js, in memory only).

  The progress meter, beside the child's name, has a segment for each
  round they play today (four for a child who starts at round 2). When a
  round is answered (the order in round 1, a full basket in rounds 2 to 4,
  and round 5 once Blob has explained it), sparkles fly from the basket's
  count into the next segment, which lights as they land, with a soft
  rising "yes". The last one makes the meter glow, with a warmer sound,
  and then the end comes. A right answer to "How many MORE?" gets the
  "yes" too. It is not a score: no number, nothing to compare, and it
  starts empty each time.
*/

/*
  The stall starts afresh (a new `run`) when the tutorial ends, as
  Chapter 1, and again from the map's "Carry on here" (a `replay`, from
  Chapter 1's start), with what the child has done today added to what was
  loaded. "Carry on here" on the Provision Store's map comes here as a
  replay too, with what was done there today (the route's state), and the
  map's "Let's go" takes all of it to the Provision Store.
*/
export default function PlayStall() {
  const { player, newcomer } = useOutletContext();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [run, setRun] = useState(() => ({
    n: 0,
    cleared: state?.cleared ?? [],
    lanterns: state?.lanterns ?? 0,
    replay: Boolean(state?.replay),
  }));
  const now = {
    ...player,
    cleared_stalls: [...new Set([...(player.cleared_stalls ?? []), ...run.cleared])],
    lanterns: player.lanterns == null ? null : player.lanterns + run.lanterns,
  };
  return (
    <FruitStall
      key={run.n}
      player={now}
      newcomer={run.n ? false : newcomer}
      replay={run.replay}
      onAgain={({ cleared, lanterns, replay = false }) =>
        setRun((r) => ({ n: r.n + 1, cleared: [...r.cleared, ...cleared], lanterns: r.lanterns + lanterns, replay }))
      }
      onShop={({ cleared, lanterns }) =>
        navigate(`/play/${player.id}/stall/provision`, {
          replace: true,
          state: { cleared: [...run.cleared, ...cleared], lanterns: run.lanterns + lanterns },
        })
      }
    />
  );
}

function FruitStall({ player, newcomer, replay, onAgain, onShop }) {
  const clearedBefore = !newcomer && (player.cleared_stalls ?? []).includes(STALL_ID);
  // Once the tutorial is done, the stall is Chapter 1.
  const chapterOne = clearedBefore;
  const roundCount = chapterOne ? CHAPTER_ONE_ROUNDS.length : ROUND_COUNT;
  const setUp = (index) => (chapterOne ? setUpChapterRound(index) : setUpRound(index, player.age_band));
  const chapterDoneBefore = (player.cleared_stalls ?? []).includes(CHAPTER_ONE_ID);
  // Where this visit starts, the furthest point they reached (see above):
  //   start   the beginning: the tutorial's, or Chapter 1's, with Grandma's
  //           lines (and so from "Carry on here")
  //   round   part way through Chapter 1: the round they were on
  //   ending  Chapter 1 finished, but they left before the map
  //   map     Chapter 1 finished, and the map seen
  // (Once they have stepped into the Provision Store, round_reached is its
  // chapter's, not this one's.)
  const reached = (player.cleared_stalls ?? []).includes(SHOP_ID) ? 0 : Math.min(player.round_reached ?? 0, roundCount - 1);
  let resume = "start";
  if (chapterOne && !replay && chapterDoneBefore) resume = reached > 0 ? "ending" : "map";
  else if (chapterOne && !replay && reached > 0) resume = "round";
  const [round, setRound] = useState(() =>
    setUp(resume === "round" ? reached : resume === "ending" ? roundCount - 1 : 0)
  );
  const [crates, setCrates] = useState(() => round.crateIds ?? []); // the full crates on the table (Chapter 1)
  const [packed, setPacked] = useState(false); // this round's full basket is now one of them
  // Stage B: what has gone into the customer's order, whether a crate has
  // been cracked open, and whether Blob has said there aren't enough loose
  // ones (and so, in its first round, whether a crate will open yet).
  const [delivered, setDelivered] = useState({ crates: [], loose: [] });
  const [cracked, setCracked] = useState(false);
  const [wall, setWall] = useState(false);
  const [crackReady, setCrackReady] = useState(false);
  const [orderTaken, setOrderTaken] = useState(false);
  // Chapter 1 finished the first time: today, or last time, if they left
  // before its ending.
  const [chapterJustCleared, setChapterJustCleared] = useState(resume === "ending");
  const [lanternsToday, setLanternsToday] = useState(0); // earned this visit (data/lanterns.js)
  // Chapter 1: Grandma's two lines, then she goes along the row to ask,
  // and comes back at the end. (Coming back part way through, she has
  // already gone.)
  const [introStep, setIntroStep] = useState(0);
  const [grandmaAway, setGrandmaAway] = useState(resume === "round");
  // Chapter 1: the number the child has said for "How many is that?"
  const [said, setSaid] = useState(null);
  // Stage B: Done, and the customer found it right.
  const [orderReady, setOrderReady] = useState(false);
  // The map, at the end: once reached, the errand comes as the child
  // leaves it, over it.
  const [mapReached, setMapReached] = useState(resume === "map");
  // Chapter 1's hint: every crate shows its 10 for a few seconds.
  const [tensKey, setTensKey] = useState(null);
  // Stage C's reading round: handed over, and the number going in.
  const [handed, setHanded] = useState(false);
  const [entry, setEntry] = useState(null); // { tens, ones, active }
  const [inBasket, setInBasket] = useState(() => round.prefilled);
  const [chosen, setChosen] = useState([]); // oranges tapped, in order: what a drag carries
  const [phase, setPhase] = useState(
    newcomer ? "award" : ({ round: "play", ending: "back", map: "map" }[resume] ?? "ask")
  );
  const [cleared, setCleared] = useState(clearedBefore);
  const [beat, setBeat] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [hintTaps, setHintTaps] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [demoKey, setDemoKey] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [trayed, setTrayed] = useState(false);
  const [lineStep, setLineStep] = useState(0);
  const [stall, setStall] = useState(null); // the stall picture, once it's in the page
  const paused = usePaused(); // the child's profile is open over the game
  const navigate = useNavigate();
  const gameRef = useRef(null);
  const tally = useRef({ hints: 0, wrong: 0 });
  const timers = useRef([]);
  const zizi = getZiziLook(player.character);

  // Every wait here holds while the game is paused (lib/pause.js).
  const later = (fn, ms) => timers.current.push(after(fn, ms));
  useEffect(() => () => timers.current.forEach(cancel), []);

  // The progress meter (see above): none on a visit that starts after the
  // last round.
  const [meterTotal] = useState(() => (resume === "ending" || resume === "map" ? 0 : roundCount - round.index));
  const [meterFilled, setMeterFilled] = useState(0);
  const [meterGlow, setMeterGlow] = useState(false);
  const [bursts, setBursts] = useState([]); // sparkles on their way to it
  const filledRef = useRef(0);
  const meterRef = useRef(null);

  // A round answered: sparkles from the basket's count (or from `origin`,
  // the customer's order in Stage B) into the next segment, which lights,
  // with the "yes", as they land. The last one glows with the warmer
  // sound. `then` runs after (for the last, after the glow). Without
  // motion the segment simply lights.
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
    const from = (origin ?? gameRef.current?.basket()?.querySelector(".pm-basket__tag"))?.getBoundingClientRect();
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

  const placed = inBasket.length - round.prefilled.length;
  const onTable = round.oranges.length - placed;
  const stageB = round.stage === "B";
  const stageC = round.stage === "C";
  // Stage B: the loose oranges still here (on the table or, once a crate
  // is cracked, in the basket), and how many more the order wants.
  const looseHere = new Set([...round.oranges, ...inBasket].filter((id) => !delivered.loose.includes(id))).size;
  const handedOver = delivered.crates.length * BASKET_HOLDS + delivered.loose.length;
  const stillWanted = stageB ? round.want - handedOver : 0;
  const loose = stageB ? looseHere : onTable;
  const values = {
    name: player.game_name,
    n: round.target,
    left: NUMBER_WORDS[onTable],
    total: capitalise(NUMBER_WORDS[BASKET_HOLDS + onTable] ?? ""),
    count: capitalise(NUMBER_WORDS[inBasket.length] ?? ""),
    short: capitalise(NUMBER_WORDS[BASKET_HOLDS - inBasket.length] ?? ""),
    crates: `${capitalise(NUMBER_WORDS[crates.length] ?? String(crates.length))} ${crates.length === 1 ? "crate" : "crates"}`,
    loose: NUMBER_WORDS[loose],
    sum: capitalise(numberName(crates.length * BASKET_HOLDS + loose) ?? ""),
    want: round.want ?? "",
    readOrder: round.read ? readOrderWords({ crates: Math.floor(round.want / 10), loose: round.want % 10 }) : "",
  };
  // The lines Blob says one step at a time, by phase.
  const stepped =
    { summary: chapterOne ? CHAPTER_ONE.cratesAsk : FRUIT_STALL.tenAnd, puzzled: FRUIT_STALL.shortOfTen }[phase] ?? null;
  // Chapter 1: Blob's question at the end of the steps, and its three numbers.
  const askingTotal = chapterOne && phase === "summary" && stepped && lineStep >= stepped.length && said == null;
  const totalOptions = chapterOne && phase === "summary" ? totalChoices(crates.length, loose, round.seed) : null;

  // --- the tutorial ---------------------------------------------------------------
  const beats = [
    { text: TUTORIAL.stall, shape: "box", target: () => stall },
    { text: TUTORIAL.orange, shape: "round", target: () => gameRef.current?.nearestOrange() },
    { text: TUTORIAL.basket, shape: "box", target: () => gameRef.current?.basket() },
    {
      text: TUTORIAL.drag,
      shape: "round",
      target: () => gameRef.current?.nearestOrange(),
      dragTo: () => gameRef.current?.basket(),
    },
  ];
  const tutorial = phase === "tutorial" ? beats[beat] : null;
  const trying = Boolean(tutorial?.dragTo);

  const clearRoundState = () => {
    setChosen([]);
    setHintStep(0);
    setHintTaps(0);
    setHintShown(false);
    setDemoKey(0);
    setWrongTaps(0);
    setSaid(null);
    tally.current = { hints: 0, wrong: 0 };
  };

  // After the tutorial: the same round 1, from an empty basket.
  const toTheSeller = () => {
    setInBasket([]);
    clearRoundState();
    setPhase("ask");
  };

  const startRound = (index) => {
    const next = setUp(index);
    setRound(next);
    setInBasket(next.prefilled);
    setCrates(next.crateIds ?? []);
    setPacked(false);
    setDelivered({ crates: [], loose: [] });
    setCracked(false);
    setWall(false);
    setCrackReady(false);
    setOrderTaken(false);
    setHanded(false);
    setEntry(null);
    setOrderReady(false);
    clearRoundState();
    setTrayed(false);
    setLineStep(0);
    setPhase(chapterOne ? "play" : index === 0 ? "ask" : next.ask ? "question" : "play");
    // The map comes at the end: fetch it in the background while the
    // child does the tests.
    if (chapterOne && next.stage === "C") new Image().src = MAP_ART.src;
  };

  // After a round: on to the next. After the last: its segment of the
  // meter fills and the meter glows, then (in Chapter 1) Grandma comes
  // back with her lantern, and then the end.
  const afterRound = () => {
    if (round.index + 1 < roundCount) {
      if (chapterOne && !chapterDoneBefore) saveWhereTheyAre(round.index + 1);
      startRound(round.index + 1);
    } else {
      primeSound(); // from this tap, so the sounds may play
      setPhase("finishing");
      fillMeter(() => {
        if (!chapterOne) {
          onAgain({ cleared: [STALL_ID], lanterns: 0 });
          return;
        }
        setGrandmaAway(false);
        setPhase("back");
      });
    }
  };

  const advanceTutorial = (point) => {
    // "Tap one to count it": a tap on the highlighted orange counts it (it
    // is chosen, with its 1).
    if (beat === 1 && point) {
      const el = gameRef.current?.nearestOrange();
      const r = el?.getBoundingClientRect();
      if (r && point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom) {
        chooseOrange(el.dataset.id);
      }
    }
    if (beat < beats.length - 1) setBeat((b) => b + 1);
    else toTheSeller();
  };

  // --- what the child does ----------------------------------------------------------
  // A tap on an orange chooses it (the next number), or puts it down (and
  // the rest renumber). Dragging any chosen one carries them all.
  const chooseOrange = (id) => {
    if (!id) return;
    setHintShown(false);
    setChosen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  };

  // Into the basket: all of them, or none. It holds ten, and in round 1
  // it takes what the seller asked for, no more.
  const drop = (ids) => {
    if (!(phase === "play" || trying)) return false;
    const room = (round.practice ? round.target : BASKET_HOLDS) - inBasket.length;
    if (ids.some((id) => inBasket.includes(id)) || ids.length > room) return false;
    primeSound(); // from this drop, for the "yes" when the round is answered
    setInBasket((list) => [...list, ...ids]);
    setChosen((list) => list.filter((x) => !ids.includes(x)));
    setHintShown(false);
    if (phase === "tutorial") {
      // They tried it. The tutorial ends, that orange hops back out, and
      // round 1 starts properly.
      setPhase("practised");
      later(() => gameRef.current?.flyBack(ids[0]), 900);
      later(toTheSeller, 1350);
    }
    return true;
  };

  const leave = (id) => setInBasket((list) => list.filter((x) => x !== id));

  const choose = (value) => {
    if (value === round.answer) {
      playCorrect();
      setWrongTaps(0);
      setPhase("play");
    } else {
      tally.current.wrong += 1;
      setWrongTaps((n) => n + 1);
    }
  };

  // Chapter 1: the child's answer to Blob's "How many is that?" Every tap
  // is saved, with the number picked (which wrong one tells a teacher what
  // went wrong: see totalChoices). Right: the "yes", and Blob says it after
  // them. Wrong: "Hmm, let me count these again.", as often as it takes.
  const chooseTotal = (value) => {
    const right = totalOptions.right;
    recordAttempt({
      playerId: player.id,
      stallId: CHAPTER_ONE_ID,
      stage: `${round.stage}-ask`,
      round: round.index - (stageB ? FIRST_ORDER_ROUND : 0) + 1,
      asked: right,
      crates: crates.length,
      loose,
      total: value,
      failedStep: value === right ? null : "total",
      usedHint: tally.current.hints > 0,
    })
      .then(({ error }) => {
        if (error) console.warn("Couldn't save that answer.", error);
      })
      .catch((error) => console.warn("Couldn't save that answer.", error));
    if (value === right) {
      playCorrect();
      setWrongTaps(0);
      setSaid(value);
    } else {
      tally.current.wrong += 1;
      setWrongTaps((n) => n + 1);
    }
  };

  // Stage B: Done. The customer counts it: right, and the round goes on;
  // not right, "Hmm, let me count these again.", as often as it takes.
  const checkOrder = () => {
    if (!stageB || phase !== "play" || orderReady || handedOver === 0) return;
    primeSound(); // from this tap, for the "yes"
    recordAttempt({
      playerId: player.id,
      stallId: CHAPTER_ONE_ID,
      stage: "B",
      round: round.index - FIRST_ORDER_ROUND + 1,
      asked: round.want,
      crates: delivered.crates.length,
      loose: delivered.loose.length,
      total: handedOver,
      failedStep: handedOver === round.want ? null : "total",
      usedHint: tally.current.hints > 0,
    })
      .then(({ error }) => {
        if (error) console.warn("Couldn't save that answer.", error);
      })
      .catch((error) => console.warn("Couldn't save that answer.", error));
    if (handedOver === round.want) {
      setWrongTaps(0);
      setOrderReady(true);
    } else tryAgain();
  };

  // Stage B: what was carried to the customer's cloth (a crate, or one or
  // more loose oranges). It goes on, in any mix of crates and loose
  // oranges, unless it would make more than the number asked for; then
  // it all springs back. Stage C's counter takes anything.
  const deliver = (items) => {
    if (!(stageB || stageC) || phase !== "play" || handed || orderReady) return false;
    const adding = items.reduce((n, item) => n + (item.kind === "crate" ? BASKET_HOLDS : 1), 0);
    if (stageB && handedOver + adding > round.want) return false;
    const crateIds = items.filter((item) => item.kind === "crate").map((item) => item.id);
    const looseIds = items.filter((item) => item.kind !== "crate").map((item) => item.id);
    if (crateIds.length) setCrates((list) => list.filter((x) => !crateIds.includes(x)));
    setDelivered((now) => ({ crates: [...now.crates, ...crateIds], loose: [...now.loose, ...looseIds] }));
    setChosen((list) => list.filter((x) => !looseIds.includes(x)));
    primeSound(); // from this drop, for the "yes" when the order is complete
    return true;
  };

  // Stage C: something taken back off the counter, to the stall.
  // Anything on Stage B's cloth or Stage C's counter can be taken back.
  const takeBack = (id, kind) => {
    if (!(stageB || stageC) || phase !== "play" || handed || orderReady) return false;
    if (kind === "crate") {
      setDelivered((now) => ({ ...now, crates: now.crates.filter((x) => x !== id) }));
      setCrates((list) => [...list, id]);
    } else {
      setDelivered((now) => ({ ...now, loose: now.loose.filter((x) => x !== id) }));
    }
    return true;
  };

  // Chapter 1, the first time through: the round they are on, saved as
  // they reach it, so a child who leaves comes back to it. Back to 0 once
  // they have seen the map (OpeningCard). A replay saves nothing: coming
  // back from one, they go to the map.
  const saveWhereTheyAre = (index) => {
    saveRoundReached(player.id, index)
      .then(({ error }) => {
        if (error) console.warn("Couldn't save where they got to.", error);
      })
      .catch((error) => console.warn("Couldn't save where they got to.", error));
  };

  // Chapter 1 cleared: saved the moment it happens, so a child who closes
  // the game now still has their rewards.
  const clearChapter = () => {
    if (chapterDoneBefore || chapterJustCleared) return;
    setChapterJustCleared(true);
    clearStall(player.id, CHAPTER_ONE_ID)
      .then(({ error }) => {
        if (error) console.warn("Couldn't save that Chapter 1 was cleared.", error);
      })
      .catch((error) => console.warn("Couldn't save that Chapter 1 was cleared.", error));
  };

  // A lantern (data/lanterns.js): for the teaching chapter (Stages A and
  // B, once), and for the test rounds (Stage C), again each time a child
  // comes back and does them. Both are given at the end of the chapter,
  // when Grandma is back to lend them. Counted once it is saved.
  const earnChapterLantern = (reason) => {
    earnLantern(player.id, CHAPTER_ONE_ID, reason)
      .then(({ earned, error }) => {
        if (error) console.warn("Couldn't save the lantern.", error);
        if (earned) setLanternsToday((n) => n + 1);
      })
      .catch((error) => console.warn("Couldn't save the lantern.", error));
  };

  // Stage C: every answer is saved, right or wrong, with the first step
  // that broke: the crates, then the loose ones, then the number.
  const logAttempt = (fields) => {
    recordAttempt({
      playerId: player.id,
      stallId: CHAPTER_ONE_ID,
      stage: "C",
      round: round.index - FIRST_TEST_ROUND + 1,
      asked: round.want,
      crates: delivered.crates.length,
      loose: delivered.loose.length,
      usedHint: tally.current.hints > 0,
      ...fields,
    })
      .then(({ error }) => {
        if (error) console.warn("Couldn't save that answer.", error);
      })
      .catch((error) => console.warn("Couldn't save that answer.", error));
  };

  // Wrong: "Count again…", and nothing else. No hint, nothing red.
  const tryAgain = () => {
    tally.current.wrong += 1;
    setWrongTaps((n) => n + 1);
  };

  const finishTest = () => {
    recordRound({
      playerId: player.id,
      stallId: CHAPTER_ONE_ID,
      round: round.number,
      hintsUsed: 0,
      wrongAnswers: tally.current.wrong,
    });
    setPhase("done");
    fillMeter(null, gameRef.current?.order());
    if (round.index === roundCount - 1) {
      clearChapter();
      earnChapterLantern("teaching");
      earnChapterLantern(chapterDoneBefore ? "replay" : "test");
    }
  };

  // Stage C: "Done". The crates, then the loose ones, against the order.
  const handOver = () => {
    if (!stageC || phase !== "play" || handed) return;
    primeSound(); // from this tap, for the "yes"
    const tens = Math.floor(round.want / 10);
    const ones = round.want % 10;
    const failedStep = delivered.crates.length !== tens ? "crates" : delivered.loose.length !== ones ? "loose" : null;
    logAttempt({ failedStep });
    if (failedStep) {
      tryAgain();
      return;
    }
    setWrongTaps(0);
    if (round.read) {
      setHanded(true);
      setEntry({ tens: null, ones: null, active: "tens" });
    } else finishTest();
  };

  // The reading round's number: a numeral goes into the slot being filled
  // (tens first, then ones); with both in, it is checked.
  const putDigit = (digit) => {
    if (!entry || !entry.active) return;
    const next = { ...entry, [entry.active]: digit };
    const other = entry.active === "tens" ? "ones" : "tens";
    if (next[other] == null) {
      setEntry({ ...next, active: other });
      return;
    }
    const total = next.tens * 10 + next.ones;
    logAttempt({ total, failedStep: total === round.want ? null : "total" });
    if (total === round.want) {
      setEntry({ ...next, active: null });
      finishTest();
    } else {
      setEntry({ tens: null, ones: null, active: "tens" });
      tryAgain();
    }
  };
  const pickSlot = (place) => setEntry((now) => (now && now.active ? { ...now, active: place } : now));

  // Stage B: a crate split open. Its ten oranges go into the basket, loose.
  const crackOpen = (id, ids) => {
    playCrack();
    setCrates((list) => list.filter((x) => x !== id));
    setInBasket((list) => [...list, ...ids]);
    setCracked(true);
    setWall(false);
  };

  // The wall: nothing loose left, and the order still wants some that a
  // whole crate can't give. In the first order a crate only opens after
  // the child has hit it and heard Blob; after that they know, and can
  // open one whenever they like.
  const atWall =
    stageB && phase === "play" && !cracked && looseHere === 0 && stillWanted > 0 && stillWanted % BASKET_HOLDS !== 0;
  const canCrack = stageB && phase === "play" && !cracked && (round.index > FIRST_ORDER_ROUND || crackReady);

  // Blob waits until the child reaches for another (any touch) or sits
  // still for two seconds (longer feels like the game has frozen), and
  // only then asks. A touch on the corners (the name, the sound, the
  // profile it opens) isn't reaching for one.
  useEffect(() => {
    if (!atWall || wall) return undefined;
    const ask = (event) => {
      if (!event?.target?.closest?.(".pm-hud")) setWall(true);
    };
    const id = after(ask, 2000);
    window.addEventListener("pointerdown", ask, { capture: true });
    return () => {
      cancel(id);
      window.removeEventListener("pointerdown", ask, { capture: true });
    };
  }, [atWall, wall]);

  // A crate opens a moment after he has asked, so the touch that made him
  // ask doesn't open one too.
  useEffect(() => {
    if (!wall) return undefined;
    const id = after(() => setCrackReady(true), 600);
    return () => cancel(id);
  }, [wall]);

  // One step of help per tap: a question, then the empty spaces, then
  // the move itself, slowly. Never the answer.
  // Chapter 1's hint, in every round, the tests too: every crate shows its
  // 10 for a few seconds. Nothing else: never what to do next, never a
  // total. Whether it was used goes into the round's attempts.
  const hintTens = () => {
    tally.current.hints += 1;
    setHintTaps((n) => n + 1);
    const key = Date.now();
    setTensKey(key);
    later(() => setTensKey((now) => (now === key ? null : now)), 3200);
  };

  const hint = () => {
    tally.current.hints += 1;
    setHintTaps((n) => n + 1);
    setHintShown(true);
    const next = Math.min(hintStep + 1, HINTS.length);
    setHintStep(next);
    if (next === HINTS.length) setDemoKey((k) => k + 1);
  };

  // --- the end of a round -------------------------------------------------------------
  useEffect(() => {
    if (phase !== "play") return undefined;
    let next = null;
    if (stageB) {
      if (orderReady) next = "done";
    } else if (stageC) {
      // Answered with "Done" (handOver), not by filling something.
    } else if (round.practice) {
      if (inBasket.length === round.target) next = "won";
    } else if (inBasket.length >= BASKET_HOLDS) next = "closing";
    else if (onTable === 0) next = "puzzled";
    if (!next) return undefined;

    const id = after(
      () => {
        recordRound({
          playerId: player.id,
          stallId: chapterOne ? CHAPTER_ONE_ID : STALL_ID,
          round: round.number,
          hintsUsed: tally.current.hints,
          wrongAnswers: round.ask ? tally.current.wrong : null,
        });
        setHintShown(false);
        if (next === "puzzled") setLineStep(1);
        setPhase(next);
        // The order filled, or the basket, or the customer's order: that
        // round's segment. (Round 5's fills once Blob has explained it: see
        // afterRound.)
        if (next === "done") fillMeter(null, gameRef.current?.order());
        else if (next !== "puzzled") fillMeter();
        // Chapter 1's last round: the chapter is cleared, and saved now.
        if (stageB && round.index === roundCount - 1) clearChapter();
        // Round 5 done: the stall is cleared. Saved the moment it happens,
        // so a child who closes the game now goes on to Chapter 1 next time.
        if (!chapterOne && round.index === ROUND_COUNT - 1 && !cleared) {
          setCleared(true);
          clearStall(player.id, STALL_ID)
            .then(({ error }) => {
              // If this didn't save, the child plays the tutorial again
              // next time.
              if (error) console.warn("Couldn't save that the Fruit Stall was cleared.", error);
            })
            .catch((error) => console.warn("Couldn't save that the Fruit Stall was cleared.", error));
        }
      },
      next === "puzzled" ? 900 : 500
    );
    return () => cancel(id);
  }, [phase, inBasket.length, onTable, round, player.id, cleared, delivered, orderReady]);

  // The crate closes; the leftovers move to their cloth; then Blob says
  // what is there.
  useEffect(() => {
    if (phase !== "closing") return undefined;
    const aside = after(() => {
      if (chapterOne) {
        // The new crate goes up onto the table with the others, and the
        // basket is empty again.
        setCrates((list) => [...list, `packed-${round.seed}`]);
        setPacked(true);
      } else setTrayed(true);
    }, 900);
    const say = after(() => {
      setLineStep(1);
      setPhase("summary");
    }, 1900);
    return () => {
      cancel(aside);
      cancel(say);
    };
  }, [phase]);

  // Stages B and C: the order glows and the customer takes it. In Stage B
  // Blob then says what is left; Stage C just goes on.
  useEffect(() => {
    if (phase !== "done") return undefined;
    const take = after(() => setOrderTaken(true), 900);
    const say = after(() => {
      if (stageC) {
        afterRound();
        return;
      }
      // The loose oranges still on the table go into the basket with the
      // rest, so "and seven loose" is one group of seven.
      const onStall = round.oranges.filter((id) => !inBasket.includes(id) && !delivered.loose.includes(id));
      if (onStall.length) {
        gameRef.current?.noteWhere(onStall);
        setInBasket((list) => [...list.filter((id) => !delivered.loose.includes(id)), ...onStall]);
      }
      setLineStep(1);
      setPhase("summary");
    }, 1600);
    return () => {
      cancel(take);
      cancel(say);
    };
  }, [phase]);

  // "Ten… and three. Thirteen." and round 5's lines, one step at a time,
  // each step paced by the voice: the next one comes about a second later,
  // or just after the words if they take longer. With nothing to hear
  // (muted, or no voice), the child taps their way through instead. While
  // the game is paused nothing is said; when it goes on, the line is said
  // again.
  useEffect(() => {
    if (!stepped || lineStep < 1 || paused) return undefined;
    const steps = stepped;
    const words = fillLine(steps[lineStep - 1].say, values);
    const last = lineStep >= steps.length;
    let gone = false;
    let moved = false;
    const timers = [];
    const startedAt = performance.now();
    const moveOn = () => {
      // (Cut off by the pause: not finished.)
      if (gone || moved || last || isPaused()) return;
      moved = true;
      const wait = Math.max(250, 1000 - (performance.now() - startedAt));
      timers.push(after(() => !gone && setLineStep((n) => n + 1), wait));
    };
    // In case a voice never says it has finished.
    if (speak(words, SPEAKERS.blob.voice, { onEnd: moveOn })) timers.push(after(moveOn, 4000));
    return () => {
      gone = true;
      timers.forEach(cancel);
    };
    // `values` belongs to the round, which doesn't change during it.
  }, [phase, lineStep, paused]);

  // On the map, the Provision Store is fetched in the background, for "Let's go".
  useEffect(() => {
    if (phase === "map") prefetchStep("stall/provision", player);
  }, [phase]);

  // --- what is on screen ---------------------------------------------------------------
  const playing = phase === "question" || phase === "play";
  // Round 5's second line lights the one empty space.
  const gapShown = phase === "puzzled" && lineStep >= 2;
  const showGaps = (playing && (round.outlines || hintStep >= 2)) || gapShown;
  const steppedLine =
    stepped && lineStep > 0 ? { speaker: "blob", text: stepped[Math.min(lineStep, stepped.length) - 1].show } : null;
  // Stage B: Blob's question at the wall stays up, with no button, until a
  // crate is opened.
  const wallLine = phase === "play" && wall && !cracked;
  const blobSays = wallLine
    ? CHAPTER_ONE.wall
    : phase === "question"
      ? FRUIT_STALL.howManyMore
      : phase === "won"
        ? FRUIT_STALL.practiceWon
        : said != null
          ? CHAPTER_ONE.cratesSaid
          : stepped
            ? steppedLine
            : null;
  const spotlight =
    phase === "summary"
      ? (chapterOne ? [null, "crates", "loose", "both"] : [null, "crate", "tray", "both"])[Math.min(lineStep, 3)]
      : phase === "puzzled" && lineStep === 2
        ? "gap"
        : null;
  const nextStep = () => {
    if (stepped && lineStep < stepped.length) setLineStep((n) => n + 1);
    else afterRound();
  };
  // What the child has earned, for their profile: what was saved before,
  // and what they have cleared today.
  const earned = [
    ...(player.cleared_stalls ?? []),
    ...(cleared ? [STALL_ID] : []),
    ...(chapterJustCleared ? [CHAPTER_ONE_ID] : []),
  ];
  // The place opening on the map now: the one Chapter 1 opens, the first time.
  const opening = chapterJustCleared ? PLACES.find((place) => place.opensAfter === CHAPTER_ONE_ID)?.id ?? null : null;

  return (
    <div
      className="pm-stall"
      onClick={(event) => {
        // In the "try it" beat, a tap anywhere but an orange moves on too.
        if (trying && !event.target.closest(".pm-orange, .pm-hud, .pm-coach__bubble")) advanceTutorial(null);
        // While Blob says what is there, a tap anywhere moves to the next
        // step: that's how a child with the sound off goes through it.
        if (stepped && lineStep < stepped.length && !event.target.closest(".pm-orange, .pm-hud, .pm-dialogue")) {
          setLineStep((n) => n + 1);
        }
      }}
    >
      <StallBackdrop close seller sellerAway={grandmaAway} stallRef={setStall} />
      <PlayHud
        player={player}
        earned={earned}
        lanterns={player.lanterns == null ? null : player.lanterns + lanternsToday}
        onHome={phase === "map" ? () => setPhase("end") : undefined}
        meter={meterTotal ? { total: meterTotal, filled: meterFilled, glow: meterGlow, ref: meterRef } : null}
      />

      <main id="main" className="pm-stall__stage">
        <h1 className="pm-sr-only">The Fruit Stall</h1>

        <BasketGame
          ref={gameRef}
          stall={stall}
          seed={round.seed}
          oranges={round.oranges}
          inBasket={inBasket}
          chosen={chosen}
          canDrag={phase === "play" || trying}
          canChoose={phase !== "award" && phase !== "tutorial"}
          // The basket appears when the tutorial introduces it, and is put
          // away for Stage C's tests.
          basketHidden={phase === "award" || (phase === "tutorial" && beat < 2) || stageC}
          dim={phase === "tutorial" && beat === 0}
          gapsUpTo={showGaps ? round.target : 0}
          gapsPulse={hintStep >= 2 && !gapShown}
          closed={(phase === "closing" && !packed) || (phase === "summary" && !round.practice && !chapterOne)}
          trayed={trayed}
          crates={crates}
          crateRoom={chapterOne ? (round.crateIds?.length ?? 0) + (round.stage === "A" ? 1 : 0) : 0}
          // A crate's 10: always in the tutorial; in Chapter 1 only when a
          // crate is tapped, and never in the test rounds.
          tens={!chapterOne ? "always" : stageC ? "never" : "tap"}
          hintTens={tensKey}
          emptied={packed}
          away={delivered.loose}
          order={
            stageB
              ? {
                  // Room on the cloth: the number as crates and loose, and
                  // more loose if the child brings them. Nothing drawn.
                  room: {
                    crates: Math.floor(round.want / BASKET_HOLDS),
                    loose: Math.max(round.want % BASKET_HOLDS, delivered.loose.length),
                  },
                  deliveredCrates: delivered.crates,
                  deliveredLoose: delivered.loose,
                  done: phase === "done",
                  taken: orderTaken,
                  counts: true,
                }
              : stageC
                ? {
                    mode: "counter",
                    room: { crates: round.crateIds.length, loose: round.oranges.length },
                    deliveredCrates: delivered.crates,
                    deliveredLoose: delivered.loose,
                    done: phase === "done",
                    taken: orderTaken,
                    slots: round.read,
                    // The counter's count, except in the reading round, where
                    // it would show the answer to its own question.
                    counts: !round.read,
                    entry,
                  }
                : null
          }
          canCrack={canCrack}
          inviteCrack={wallLine}
          spotlight={spotlight}
          total={chapterOne ? crates.length * BASKET_HOLDS + loose : BASKET_HOLDS + onTable}
          // In Chapter 1 the number only shows once the child has said it.
          showTotal={!chapterOne || said != null}
          demoKey={demoKey}
          onChoose={chooseOrange}
          onDrop={drop}
          onLeave={leave}
          onDeliver={deliver}
          onCrack={crackOpen}
          onReturn={takeBack}
          onSlot={pickSlot}
        />

        {blobSays && (
          <div className="pm-stall__blob" aria-hidden="true">
            <img src={SPEAKERS.blob.portrait} width={736} height={900} alt="" draggable={false} />
          </div>
        )}

        <div className="pm-stall__top">
          {round.practice && phase !== "award" && <p className="pm-stall__practice">{FRUIT_STALL.practice}</p>}

          {/* Stage B: the order, up all round, and Done once something is
              on the cloth. */}
          {stageB && (phase === "play" || phase === "done") && (
            <OrderStrip
              who={SPEAKERS.customer.label}
              text={fillLine(CHAPTER_ONE.orderStrip, values)}
              say={fillLine(CHAPTER_ONE.order.text, values)}
              onDone={phase === "play" && !orderReady && handedOver > 0 ? checkOrder : null}
              doneLabel={CHAPTER_ONE.test.done}
              note={wrongTaps > 0 ? FRUIT_STALL.countAgain : null}
              noteKey={wrongTaps}
            />
          )}

          {phase === "play" && !wallLine && !stageB && !stageC && (
            <p className="pm-stall__goal" role="status">
              {round.practice ? (
                <>
                  <span className="pm-stall__goal-number">{round.target}</span>
                  <span className="pm-stall__goal-oranges" aria-hidden="true">
                    {Array.from({ length: round.target }, (_, i) => (
                      <img key={i} src={ORANGE.src} alt="" draggable={false} />
                    ))}
                  </span>
                  <span className="pm-stall__goal-words">{fillLine(FRUIT_STALL.goal, values)}</span>
                </>
              ) : (
                <span className="pm-stall__goal-words">{FRUIT_STALL.fillGoal}</span>
              )}
            </p>
          )}

          {phase === "ask" && (
            <DialogueBox
              line={
                !chapterOne
                  ? FRUIT_STALL.ask
                  : !stageB
                    ? CHAPTER_ONE.intro[introStep]
                    : CHAPTER_ONE.order
              }
              values={values}
              ziziPortrait={zizi}
              onNext={() => {
                // Grandma's two lines, then she goes.
                if (chapterOne && !stageB && introStep < CHAPTER_ONE.intro.length - 1) {
                  setIntroStep((n) => n + 1);
                  return;
                }
                if (chapterOne && !stageB) setGrandmaAway(true);
                setPhase("play");
              }}
            />
          )}

          {/* Stage C: the customer's order, and Done. In the reading round,
              once it is handed over, the numerals for the two slots. */}
          {stageC && phase === "play" && (
            <DialogueBox
              line={entry ? CHAPTER_ONE.test.total : round.read ? CHAPTER_ONE.test.read : CHAPTER_ONE.test.build}
              values={values}
              ziziPortrait={zizi}
              choices={entry ? DIGITS : null}
              tray
              onChoose={putDigit}
              note={wrongTaps > 0 ? FRUIT_STALL.countAgain : null}
              noteKey={wrongTaps}
              buttonLabel={CHAPTER_ONE.test.done}
              onNext={entry || handedOver === 0 ? null : handOver}
            />
          )}

          {blobSays && (
            <DialogueBox
              line={blobSays}
              values={values}
              ziziPortrait={zizi}
              choices={phase === "question" ? round.choices : askingTotal ? totalOptions.choices : null}
              onChoose={askingTotal ? chooseTotal : choose}
              note={(phase === "question" || askingTotal) && wrongTaps > 0 ? FRUIT_STALL.countAgain : null}
              noteKey={wrongTaps}
              silent={Boolean(stepped) && said == null}
              buttonLabel={FRUIT_STALL.next}
              onNext={wallLine ? null : nextStep}
            />
          )}
        </div>

        {/* Help is always there, in every round: in the tutorial, its
            steps; in Chapter 1, the crates' 10s. */}
        {playing && (
          <HintButton
            message={!chapterOne && hintShown && hintStep > 0 ? HINTS[hintStep - 1] : null}
            shownKey={hintTaps}
            onHint={chapterOne ? hintTens : hint}
          />
        )}
      </main>

      {/* Sparkles from the basket's count into the meter. */}
      {bursts.map((burst) => (
        <Sparkles key={burst.key} x={burst.x} y={burst.y} dx={burst.dx} dy={burst.dy} />
      ))}

      {phase === "back" && (
        <TraderBack
          words={CHAPTER_ONE.back}
          portrait={SELLER_PORTRAIT}
          voice={SPEAKERS.seller.voice}
          first={chapterJustCleared}
          onDone={() => {
            if (chapterJustCleared) setPhase("opening");
            else {
              setMapReached(true);
              setPhase("map");
            }
          }}
        />
      )}
      {phase === "opening" && (
        <OpeningCard
          onDone={() => {
            saveWhereTheyAre(0);
            setMapReached(true);
            setPhase("map");
          }}
        />
      )}
      {/* The map is where the chapter ends. The errand is the sign-off as
          the child leaves it (the corner's home button), over the map. */}
      {phase === "end" && (
        <EndForNow
          errands={ERRANDS[STALL_ID]}
          labels={FRUIT_STALL.endForNow}
          sayEnd={!chapterJustCleared}
          endLine={chapterOne ? CHAPTER_ONE.endLine : undefined}
          onDone={() => navigate("/play")}
        />
      )}
      {(phase === "map" || (phase === "end" && mapReached)) && (
        <MarketMap
          zizi={zizi}
          cleared={earned}
          opening={opening}
          onGo={(place) => {
            const today = { cleared: [...(cleared ? [STALL_ID] : []), ...(chapterJustCleared ? [CHAPTER_ONE_ID] : [])], lanterns: lanternsToday };
            if (place.id === "fruit") onAgain({ ...today, replay: true });
            else onShop(today);
          }}
        />
      )}

      {phase === "award" && (
        <BasketAward
          onDone={() => {
            setBeat(0);
            setPhase("tutorial");
          }}
        />
      )}

      {tutorial && tutorial.target() && (
        <CoachMark
          key={beat}
          target={tutorial.target()}
          shape={tutorial.shape}
          text={tutorial.text}
          dragTo={tutorial.dragTo?.() ?? null}
          onAdvance={advanceTutorial}
        />
      )}
    </div>
  );
}

/**
 * The first time Chapter 1 is finished, after Grandma is back: what she
 * gives (the straw hat and the tally stick, from the fruit stall), and
 * that the market is opening up. The map comes next; for now, this card
 * says so.
 */
function OpeningCard({ onDone }) {
  const buttonRef = useRef(null);
  const { title, gift, text, button } = CHAPTER_ONE.opening;

  useReadAloud(`${title} ${gift} ${text}`, SPEAKERS.blob.voice);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pm-stall__end" role="dialog" aria-modal="true" aria-labelledby="pm-opening-title">
      <div className="pm-stall__end-card">
        <h2 id="pm-opening-title" className="pm-stall__end-title">
          {title}
        </h2>
        <p className="pm-stall__end-text">{gift}</p>
        <RewardItems items={REWARDS} />
        <p className="pm-stall__end-quiet">{text}</p>
        <button ref={buttonRef} type="button" className="pm-stall__end-button" onClick={onDone}>
          {button}
        </button>
      </div>
    </div>
  );
}
