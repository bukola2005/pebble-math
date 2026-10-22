import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import BasketAward from "../components/BasketAward";
import BasketGame from "../components/BasketGame";
import CoachMark from "../components/CoachMark";
import DialogueBox from "../components/DialogueBox";
import HintButton from "../components/HintButton";
import PlayHud from "../components/PlayHud";
import RewardItems from "../components/RewardItems";
import Sparkles, { SPARKLES_LAND_MS } from "../components/Sparkles";
import StallBackdrop from "../components/StallBackdrop";
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
  orderWords,
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
} from "../data/fruitStall";
import { LANTERN } from "../data/lanterns";
import { ORANGE, SELLER_PORTRAIT } from "../data/market";
import { REWARDS } from "../data/rewards";
import { getZiziLook } from "../data/zizi";
import { recordAttempt } from "../lib/attempts";
import { earnLantern } from "../lib/lanterns";
import { after, cancel, isPaused, usePaused } from "../lib/pause";
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
  And last:
    end       Blob's errand, something to try away from the screen, and
              that the tutorial is finished and more of the market is
              coming

  A child who has finished the tutorial plays Chapter 1 instead: the same
  stall, with full crates on the table. Stage A adds past ten
  (data/fruitStall.js, CHAPTER_ONE_ROUNDS):
    ask       Grandma asks the child to pack the new oranges and mind the
              stall, and goes along the row to ask about their mother
              (once): she walks out of the picture. From here the child
              serves the customers alone.
    play      fill the basket; its empty spaces are outlined
    closing   it shuts into a crate, which goes up onto the table with
              the others (the basket is empty again)
    summary   Blob: "Three crates… and four loose. Thirty-four." one step
              at a time, the crates lighting, then the loose oranges, then
              both, and only then the number
  Stage B takes away, cracking a crate open when there aren't enough
  loose oranges:
    ask       a customer gives their order ("one crate and five loose
              oranges"), which waits on a cloth beside the basket
    play      carry crates and loose oranges to it. In the first round
              there aren't enough loose ones, and nothing says so: the
              child runs out, reaches for another, and only then does
              Blob ask "What's inside a crate?" From then on a tapped crate
              splits open, with a wooden crack, and its ten oranges spill
              into the basket. (In the next rounds a crate can be opened
              whenever the child likes.)
    done      the order glows and the customer takes it
    summary   Blob: "One crate… and seven loose. Seventeen."
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
    end       Blob's errand

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

export default function PlayStall() {
  const { player, newcomer } = useOutletContext();
  const clearedBefore = !newcomer && (player.cleared_stalls ?? []).includes(STALL_ID);
  // Once the tutorial is done, the stall is Chapter 1.
  const chapterOne = clearedBefore;
  const roundCount = chapterOne ? CHAPTER_ONE_ROUNDS.length : ROUND_COUNT;
  const setUp = (index) => (chapterOne ? setUpChapterRound(index) : setUpRound(index, player.age_band));
  const [round, setRound] = useState(() => setUp(0));
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
  const chapterDoneBefore = (player.cleared_stalls ?? []).includes(CHAPTER_ONE_ID);
  const [chapterJustCleared, setChapterJustCleared] = useState(false);
  const [lanternsToday, setLanternsToday] = useState(0); // earned this visit (data/lanterns.js)
  // Chapter 1: Grandma's two lines, then she goes along the row to ask,
  // and comes back at the end.
  const [introStep, setIntroStep] = useState(0);
  const [grandmaAway, setGrandmaAway] = useState(false);
  // Stage C's reading round: handed over, and the number going in.
  const [handed, setHanded] = useState(false);
  const [entry, setEntry] = useState(null); // { tens, ones, active }
  const [inBasket, setInBasket] = useState(() => round.prefilled);
  const [counted, setCounted] = useState([]);
  const [phase, setPhase] = useState(newcomer ? "award" : "ask");
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
  const navigate = useNavigate();
  const paused = usePaused(); // the child's profile is open over the game
  const gameRef = useRef(null);
  const tally = useRef({ hints: 0, wrong: 0 });
  const timers = useRef([]);
  const zizi = getZiziLook(player.character);

  // Every wait here holds while the game is paused (lib/pause.js).
  const later = (fn, ms) => timers.current.push(after(fn, ms));
  useEffect(() => () => timers.current.forEach(cancel), []);

  // The progress meter (see above).
  const [meterTotal] = useState(() => roundCount);
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
  const looseHere = round.oranges.length + inBasket.length - delivered.loose.length;
  const looseWanted = stageB ? round.order.loose - delivered.loose.length : 0;
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
    order: stageB ? orderWords(round.order) : "",
    want: round.want ?? "",
    readOrder: round.read ? readOrderWords({ crates: Math.floor(round.want / 10), loose: round.want % 10 }) : "",
  };
  // The lines Blob says one step at a time, by phase.
  const stepped =
    { summary: chapterOne ? CHAPTER_ONE.cratesAnd : FRUIT_STALL.tenAnd, puzzled: FRUIT_STALL.shortOfTen }[phase] ?? null;

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
    setCounted([]);
    setHintStep(0);
    setHintTaps(0);
    setHintShown(false);
    setDemoKey(0);
    setWrongTaps(0);
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
    clearRoundState();
    setTrayed(false);
    setLineStep(0);
    setPhase(chapterOne ? (next.stage === "B" ? "ask" : "play") : index === 0 ? "ask" : next.ask ? "question" : "play");
  };

  // After a round: on to the next. After the last: its segment of the
  // meter fills and the meter glows, then (in Chapter 1) Grandma comes
  // back with her lantern, and then the end.
  const afterRound = () => {
    if (round.index + 1 < roundCount) startRound(round.index + 1);
    else {
      primeSound(); // from this tap, so the sounds may play
      setPhase("finishing");
      fillMeter(() => {
        if (!chapterOne) {
          setPhase("end");
          return;
        }
        setGrandmaAway(false);
        setPhase("back");
      });
    }
  };

  const advanceTutorial = (point) => {
    // "Tap one to count it": a tap on the highlighted orange counts it.
    if (beat === 1 && point) {
      const el = gameRef.current?.nearestOrange();
      const r = el?.getBoundingClientRect();
      if (r && point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom) {
        tap(el.dataset.id);
      }
    }
    if (beat < beats.length - 1) setBeat((b) => b + 1);
    else toTheSeller();
  };

  // --- what the child does ----------------------------------------------------------
  const tap = (id) => {
    if (!id) return;
    setHintShown(false);
    setCounted((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  };

  const drop = (id) => {
    if (!(phase === "play" || trying)) return false;
    if (inBasket.includes(id) || inBasket.length >= BASKET_HOLDS) return false;
    primeSound(); // from this drop, for the "yes" when the round is answered
    setInBasket((list) => [...list, id]);
    setCounted((list) => list.filter((x) => x !== id));
    setHintShown(false);
    if (phase === "tutorial") {
      // They tried it. The tutorial ends, that orange hops back out, and
      // round 1 starts properly.
      setPhase("practised");
      later(() => gameRef.current?.flyBack(id), 900);
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

  // Stage B: something carried to the customer's order. It goes in while
  // the order still wants one; otherwise it springs back.
  const deliver = (id, kind) => {
    if (!(stageB || stageC) || phase !== "play" || handed) return false;
    if (kind === "crate") {
      if (stageB && delivered.crates.length >= round.order.crates) return false;
      setCrates((list) => list.filter((x) => x !== id));
      setDelivered((now) => ({ ...now, crates: [...now.crates, id] }));
    } else {
      if (stageB && delivered.loose.length >= round.order.loose) return false;
      setDelivered((now) => ({ ...now, loose: [...now.loose, id] }));
      setCounted((list) => list.filter((x) => x !== id));
    }
    primeSound(); // from this drop, for the "yes" when the order is complete
    return true;
  };

  // Stage C: something taken back off the counter, to the stall.
  const takeBack = (id, kind) => {
    if (!stageC || phase !== "play" || handed) return false;
    if (kind === "crate") {
      setDelivered((now) => ({ ...now, crates: now.crates.filter((x) => x !== id) }));
      setCrates((list) => [...list, id]);
    } else {
      setDelivered((now) => ({ ...now, loose: now.loose.filter((x) => x !== id) }));
    }
    return true;
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

  // The wall: nothing loose left, and the order still wants more. In the
  // first order a crate only opens after the child has hit it and heard
  // Blob; after that they know, and can open one whenever they like.
  const atWall = stageB && phase === "play" && !cracked && looseHere === 0 && looseWanted > 0;
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
      if (delivered.crates.length === round.order.crates && delivered.loose.length === round.order.loose) next = "done";
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
  }, [phase, inBasket.length, onTable, round, player.id, cleared, delivered]);

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
        meter={{ total: meterTotal, filled: meterFilled, glow: meterGlow, ref: meterRef }}
      />

      <main id="main" className="pm-stall__stage">
        <h1 className="pm-sr-only">The Fruit Stall</h1>

        <BasketGame
          ref={gameRef}
          stall={stall}
          seed={round.seed}
          oranges={round.oranges}
          inBasket={inBasket}
          counted={counted}
          canDrag={phase === "play" || trying}
          canTap={phase !== "award" && phase !== "tutorial" && !stageC}
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
          emptied={packed}
          away={delivered.loose}
          order={
            stageB
              ? {
                  ...round.order,
                  deliveredCrates: delivered.crates,
                  deliveredLoose: delivered.loose,
                  done: phase === "done",
                  taken: orderTaken,
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
                    entry,
                  }
                : null
          }
          canCrack={canCrack}
          inviteCrack={wallLine}
          spotlight={spotlight}
          total={chapterOne ? crates.length * BASKET_HOLDS + loose : BASKET_HOLDS + onTable}
          demoKey={demoKey}
          onTap={tap}
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

          {phase === "play" && !wallLine && !stageC && (
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
                <span className="pm-stall__goal-words">{stageB ? CHAPTER_ONE.orderGoal : FRUIT_STALL.fillGoal}</span>
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
                    : round.index === FIRST_ORDER_ROUND
                      ? CHAPTER_ONE.orderFirst
                      : CHAPTER_ONE.orderNext
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
              onNext={entry ? null : handOver}
            />
          )}

          {blobSays && (
            <DialogueBox
              line={blobSays}
              values={values}
              ziziPortrait={zizi}
              choices={phase === "question" ? round.choices : null}
              onChoose={choose}
              note={phase === "question" && wrongTaps > 0 ? FRUIT_STALL.countAgain : null}
              noteKey={wrongTaps}
              silent={Boolean(stepped)}
              buttonLabel={FRUIT_STALL.next}
              onNext={wallLine ? null : nextStep}
            />
          )}
        </div>

        {playing && !stageB && !stageC && (
          <HintButton
            message={hintShown && hintStep > 0 ? HINTS[hintStep - 1] : null}
            shownKey={hintTaps}
            onHint={hint}
          />
        )}
      </main>

      {/* Sparkles from the basket's count into the meter. */}
      {bursts.map((burst) => (
        <Sparkles key={burst.key} x={burst.x} y={burst.y} dx={burst.dx} dy={burst.dy} />
      ))}

      {phase === "back" && (
        <GrandmaBack first={chapterJustCleared} onDone={() => setPhase(chapterJustCleared ? "opening" : "end")} />
      )}
      {phase === "opening" && <OpeningCard onDone={() => setPhase("end")} />}
      {phase === "end" && (
        <EndForNow
          sayEnd={!chapterJustCleared}
          endLine={chapterOne ? CHAPTER_ONE.endLine : undefined}
          onDone={() => navigate("/play")}
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
 * The end of Chapter 1: Grandma is back from asking along the row, with no
 * news yet. Her lantern arrives (and the first time one more, for serving
 * the customers alone; after that, one for coming back), each with the
 * line that brings it, and she points at the next part of the market.
 * In her voice. Without motion the lanterns are simply there.
 */
function GrandmaBack({ first, onDone }) {
  const buttonRef = useRef(null);
  const { title, point, button } = CHAPTER_ONE.back;
  const lines = first ? CHAPTER_ONE.back.first : CHAPTER_ONE.back.again;

  useReadAloud(`${title} ${lines.join(" ")} ${point}`, SPEAKERS.seller.voice);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pm-stall__end" role="dialog" aria-modal="true" aria-labelledby="pm-back-title">
      <div className="pm-stall__end-card pm-stall__back-card">
        <img
          className="pm-stall__back-grandma"
          src={SELLER_PORTRAIT.src}
          width={SELLER_PORTRAIT.w}
          height={SELLER_PORTRAIT.h}
          alt=""
          draggable={false}
        />
        <h2 id="pm-back-title" className="pm-stall__end-title">
          {title}
        </h2>
        <ul className="pm-stall__back-lanterns">
          {lines.map((text, i) => (
            <li key={text} className="pm-stall__back-beat" style={{ "--beat": i }}>
              <img
                className="pm-stall__back-lantern"
                src={LANTERN.lit.src}
                width={LANTERN.lit.w}
                height={LANTERN.lit.h}
                alt=""
                draggable={false}
              />
              <p className="pm-stall__end-text">{text}</p>
            </li>
          ))}
        </ul>
        <p className="pm-stall__back-point">
          {point}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
        <button ref={buttonRef} type="button" className="pm-stall__end-button" onClick={onDone}>
          {button}
        </button>
      </div>
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

/**
 * The end of a session: Blob's errand, one small thing to try away from
 * the screen, picked at random from data/dialogue.js. `sayEnd` adds that
 * this is as far as the market goes for now, unless the card before just
 * said so.
 */
function EndForNow({ sayEnd, endLine = FRUIT_STALL.endForNow.endLine, onDone }) {
  const buttonRef = useRef(null);
  const { errandLabel, button } = FRUIT_STALL.endForNow;
  const [errand] = useState(() => {
    const list = ERRANDS[STALL_ID];
    return list[Math.floor(Math.random() * list.length)];
  });

  useReadAloud(sayEnd ? `${errand} ${endLine}` : errand, SPEAKERS.blob.voice);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pm-stall__end" role="dialog" aria-modal="true" aria-labelledby="pm-end-errand">
      <div className="pm-stall__end-card">
        <div className="pm-stall__errand">
          <img className="pm-stall__errand-blob" src={SPEAKERS.blob.portrait} alt="" draggable={false} />
          <div>
            <p className="pm-stall__errand-label">{errandLabel}</p>
            <h2 id="pm-end-errand" className="pm-stall__errand-text">
              {errand}
            </h2>
          </div>
        </div>
        {sayEnd && <p className="pm-stall__end-quiet">{endLine}</p>}
        <button ref={buttonRef} type="button" className="pm-stall__end-button" onClick={onDone}>
          {button}
        </button>
      </div>
    </div>
  );
}
