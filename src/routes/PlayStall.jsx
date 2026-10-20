import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import BasketAward from "../components/BasketAward";
import BasketGame from "../components/BasketGame";
import CoachMark from "../components/CoachMark";
import DialogueBox from "../components/DialogueBox";
import HintButton from "../components/HintButton";
import LockChain from "../components/LockChain";
import PlayHud from "../components/PlayHud";
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
  lockWords,
  numberName,
} from "../data/dialogue";
import {
  BASKET_HOLDS,
  CHAPTER_ONE_ID,
  CHAPTER_ONE_ROUNDS,
  ROUND_COUNT,
  setUpChapterRound,
  setUpRound,
} from "../data/fruitStall";
import { LOCK_COUNT, MUM_FACE, ORANGE } from "../data/market";
import { getZiziLook } from "../data/zizi";
import { clearStall } from "../lib/progress";
import { playCorrect, playMeterFull, primeSound } from "../lib/sound";
import { speak, useReadAloud } from "../lib/speech";
import { recordRound } from "../lib/stallLog";
import "./PlayStall.css";

const STALL_ID = "fruit-stall";

// How long the full meter glows before the lock opens.
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
  The first time the stall is cleared:
    reward    Blob: "You did it! Look, the first lock is open!" One lock
              on Mum's chain turns, falls away, and a soft sound plays.
    locks     a card: how many of Mum's locks are open, how many closed,
              and that the tutorial is finished
  And always, last:
    end       Blob's errand, something to try away from the screen (and,
              if the locks card didn't just say so, that the tutorial is
              finished and more of the market is coming)

  A child who has finished the tutorial plays Chapter 1 instead, after
  the locks card ("welcome"): the same stall, with full crates on the
  table. Stage A adds past ten (data/fruitStall.js, CHAPTER_ONE_ROUNDS):
    ask       the seller asks the child to pack the new oranges (once)
    play      fill the basket; its empty spaces are outlined
    closing   it shuts into a crate, which goes up onto the table with
              the others (the basket is empty again)
    summary   Blob: "Three crates… and four loose. Thirty-four." one step
              at a time, the crates lighting, then the loose oranges, then
              both, and only then the number

  Blob's hint button gives one step of help per tap, and how many a
  child used is noted for each round (lib/stallLog.js, in memory only).

  The progress meter, beside the child's name, has a segment for each
  round they play today (four for a child who starts at round 2). When a
  round is answered (the order in round 1, a full basket in rounds 2 to 4,
  and round 5 once Blob has explained it), sparkles fly from the basket's
  count into the next segment, which lights as they land, with a soft
  rising "yes". The last one makes the meter glow, with a warmer sound,
  and then the lock opens. A right answer to "How many MORE?" gets the
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
  const [crates, setCrates] = useState(() => round.crates ?? 0); // full crates on the table (Chapter 1)
  const [packed, setPacked] = useState(false); // this round's full basket is now one of them
  const [inBasket, setInBasket] = useState(() => round.prefilled);
  const [counted, setCounted] = useState([]);
  const [phase, setPhase] = useState(newcomer ? "award" : clearedBefore ? "welcome" : "ask");
  const [cleared, setCleared] = useState(clearedBefore);
  const [justCleared, setJustCleared] = useState(false);
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
  const gameRef = useRef(null);
  const tally = useRef({ hints: 0, wrong: 0 });
  const timers = useRef([]);
  const zizi = getZiziLook(player.character);

  const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  // The progress meter (see above).
  const [meterTotal] = useState(() => roundCount);
  const [meterFilled, setMeterFilled] = useState(0);
  const [meterGlow, setMeterGlow] = useState(false);
  const [bursts, setBursts] = useState([]); // sparkles on their way to it
  const filledRef = useRef(0);
  const meterRef = useRef(null);

  // A round answered: sparkles from the basket's count into the next
  // segment, which lights, with the "yes", as they land. The last one
  // glows with the warmer sound. `then` runs after (for the last, after
  // the glow). Without motion the segment simply lights.
  const fillMeter = (then) => {
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
    const from = gameRef.current?.basket()?.querySelector(".pm-basket__tag")?.getBoundingClientRect();
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
  const values = {
    name: player.game_name,
    n: round.target,
    left: NUMBER_WORDS[onTable],
    total: capitalise(NUMBER_WORDS[BASKET_HOLDS + onTable] ?? ""),
    count: capitalise(NUMBER_WORDS[inBasket.length] ?? ""),
    short: capitalise(NUMBER_WORDS[BASKET_HOLDS - inBasket.length] ?? ""),
    crates: `${capitalise(NUMBER_WORDS[crates] ?? String(crates))} ${crates === 1 ? "crate" : "crates"}`,
    loose: NUMBER_WORDS[onTable],
    sum: capitalise(numberName(crates * BASKET_HOLDS + onTable) ?? ""),
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
    setCrates(next.crates ?? 0);
    setPacked(false);
    clearRoundState();
    setTrayed(false);
    setLineStep(0);
    setPhase(chapterOne ? "play" : index === 0 ? "ask" : next.ask ? "question" : "play");
  };

  // After a round: on to the next. After the last: its segment of the
  // meter fills and the meter glows, then the lock opens, if the stall has
  // only just been cleared, and then the end.
  const afterRound = () => {
    if (round.index + 1 < roundCount) startRound(round.index + 1);
    else {
      primeSound(); // from this tap, so the sounds may play
      setPhase("finishing");
      fillMeter(() => setPhase(justCleared ? "reward" : "end"));
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
    if (round.practice) {
      if (inBasket.length === round.target) next = "won";
    } else if (inBasket.length >= BASKET_HOLDS) next = "closing";
    else if (onTable === 0) next = "puzzled";
    if (!next) return undefined;

    const id = window.setTimeout(
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
        // The order filled, or the basket: that round's segment. (Round 5's
        // fills once Blob has explained it: see afterRound.)
        if (next !== "puzzled") fillMeter();
        // Round 5 done: the stall is cleared. Saved the moment it happens,
        // so a child who closes the game now still finds the lock open.
        if (!chapterOne && round.index === ROUND_COUNT - 1 && !cleared) {
          setCleared(true);
          setJustCleared(true);
          clearStall(player.id, STALL_ID)
            .then(({ error }) => {
              // The child sees the lock open either way; it opens again
              // next time if this didn't save.
              if (error) console.warn("Couldn't save that the Fruit Stall was cleared.", error);
            })
            .catch((error) => console.warn("Couldn't save that the Fruit Stall was cleared.", error));
        }
      },
      next === "puzzled" ? 900 : 500
    );
    return () => window.clearTimeout(id);
  }, [phase, inBasket.length, onTable, round, player.id, cleared]);

  // The crate closes; the leftovers move to their cloth; then Blob says
  // what is there.
  useEffect(() => {
    if (phase !== "closing") return undefined;
    const aside = window.setTimeout(() => {
      if (chapterOne) {
        // The new crate goes up onto the table with the others, and the
        // basket is empty again.
        setCrates((n) => n + 1);
        setPacked(true);
      } else setTrayed(true);
    }, 900);
    const say = window.setTimeout(() => {
      setLineStep(1);
      setPhase("summary");
    }, 1900);
    return () => {
      window.clearTimeout(aside);
      window.clearTimeout(say);
    };
  }, [phase]);

  // "Ten… and three. Thirteen." and round 5's lines, one step at a time,
  // each step paced by the voice: the next one comes about a second later,
  // or just after the words if they take longer. With nothing to hear
  // (muted, or no voice), the child taps their way through instead.
  useEffect(() => {
    if (!stepped || lineStep < 1) return undefined;
    const steps = stepped;
    const words = fillLine(steps[lineStep - 1].say, values);
    const last = lineStep >= steps.length;
    let gone = false;
    let moved = false;
    const timers = [];
    const startedAt = performance.now();
    const moveOn = () => {
      if (gone || moved || last) return;
      moved = true;
      const wait = Math.max(250, 1000 - (performance.now() - startedAt));
      timers.push(window.setTimeout(() => !gone && setLineStep((n) => n + 1), wait));
    };
    // In case a voice never says it has finished.
    if (speak(words, SPEAKERS.blob.voice, { onEnd: moveOn })) timers.push(window.setTimeout(moveOn, 4000));
    return () => {
      gone = true;
      timers.forEach(window.clearTimeout);
    };
    // `values` belongs to the round, which doesn't change during it.
  }, [phase, lineStep]);

  // --- what is on screen ---------------------------------------------------------------
  const playing = phase === "question" || phase === "play";
  // Round 5's second line lights the one empty space.
  const gapShown = phase === "puzzled" && lineStep >= 2;
  const showGaps = (playing && (round.outlines || hintStep >= 2)) || gapShown;
  const steppedLine =
    stepped && lineStep > 0 ? { speaker: "blob", text: stepped[Math.min(lineStep, stepped.length) - 1].show } : null;
  const blobSays =
    phase === "question"
      ? FRUIT_STALL.howManyMore
      : phase === "won"
        ? FRUIT_STALL.practiceWon
        : stepped
          ? steppedLine
          : phase === "reward"
            ? FRUIT_STALL.lockOpen
            : null;
  const spotlight =
    phase === "summary"
      ? (chapterOne ? [null, "crates", "loose", "both"] : [null, "crate", "tray", "both"])[Math.min(lineStep, 3)]
      : phase === "puzzled" && lineStep === 2
        ? "gap"
        : null;
  const nextStep = () => {
    if (stepped && lineStep < stepped.length) setLineStep((n) => n + 1);
    else if (phase === "reward") setPhase("locks");
    else afterRound();
  };
  // How many of Mum's locks are open: every stall cleared, this one included.
  const locksOpen = new Set([...(player.cleared_stalls ?? []), ...(cleared ? [STALL_ID] : [])]).size;

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
      <StallBackdrop close seller stallRef={setStall} />
      <PlayHud player={player} meter={{ total: meterTotal, filled: meterFilled, glow: meterGlow, ref: meterRef }} />

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
          canTap={phase !== "award" && phase !== "tutorial"}
          // The basket appears when the tutorial introduces it.
          basketHidden={phase === "award" || (phase === "tutorial" && beat < 2)}
          dim={phase === "tutorial" && beat === 0}
          gapsUpTo={showGaps ? round.target : 0}
          gapsPulse={hintStep >= 2 && !gapShown}
          closed={(phase === "closing" && !packed) || (phase === "summary" && !round.practice && !chapterOne)}
          trayed={trayed}
          crates={crates}
          crateRoom={chapterOne ? (round.crates ?? 0) + 1 : 0}
          emptied={packed}
          spotlight={spotlight}
          total={chapterOne ? crates * BASKET_HOLDS + onTable : BASKET_HOLDS + onTable}
          demoKey={demoKey}
          onTap={tap}
          onDrop={drop}
          onLeave={leave}
        />

        {blobSays && phase !== "reward" && (
          <div className="pm-stall__blob" aria-hidden="true">
            <img src={SPEAKERS.blob.portrait} width={736} height={900} alt="" draggable={false} />
          </div>
        )}

        {/* The first lock on Mum's chain opens. */}
        {phase === "reward" && (
          <div className="pm-stall__reward">
            <div className="pm-stall__mum">
              <img src={MUM_FACE.src} width={MUM_FACE.w} height={MUM_FACE.h} alt="Zizi's mum" draggable={false} />
            </div>
            <div className="pm-stall__chain">
              <LockChain total={LOCK_COUNT} open={locksOpen - 1} opening={locksOpen - 1} />
            </div>
          </div>
        )}

        <div className="pm-stall__top">
          {round.practice && phase !== "award" && <p className="pm-stall__practice">{FRUIT_STALL.practice}</p>}

          {phase === "play" && (
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
            <DialogueBox line={chapterOne ? CHAPTER_ONE.intro : FRUIT_STALL.ask} values={values} ziziPortrait={zizi} onNext={() => setPhase("play")} />
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
              onNext={nextStep}
            />
          )}
        </div>

        {playing && (
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

      {phase === "welcome" && (
        <LocksCard open={locksOpen} onDone={() => setPhase(chapterOne ? "ask" : round.ask ? "question" : "play")} />
      )}
      {phase === "locks" && <LocksCard open={locksOpen} finished onDone={() => setPhase("end")} />}
      {phase === "end" && (
        <EndForNow
          sayEnd={!justCleared}
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
 * Mum's locks: how many are open, how many still closed, so the child sees
 * the shape of what is ahead. After the first lock opens (`finished`: it
 * also says the tutorial is done), and first thing when a child who has
 * opened it comes back.
 */
function LocksCard({ open, finished = false, onDone }) {
  const buttonRef = useRef(null);
  const words = lockWords(open, LOCK_COUNT);
  const done = finished ? FRUIT_STALL.locks.finished : "";

  useReadAloud(`${words.open} ${words.closed} ${done}`.trim(), SPEAKERS.blob.voice);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pm-stall__end" role="dialog" aria-modal="true" aria-labelledby="pm-locks-title">
      <div className="pm-stall__end-card pm-stall__locks-card">
        <img className="pm-stall__locks-mum" src={MUM_FACE.src} width={MUM_FACE.w} height={MUM_FACE.h} alt="" draggable={false} />
        <div className="pm-stall__locks-row">
          <LockChain total={LOCK_COUNT} open={open} small />
        </div>
        <h2 id="pm-locks-title" className="pm-stall__end-title">
          {words.open}
        </h2>
        <p className="pm-stall__end-text">{words.closed}</p>
        {finished && <p className="pm-stall__end-quiet">{done}</p>}
        <button ref={buttonRef} type="button" className="pm-stall__end-button" onClick={onDone}>
          {FRUIT_STALL.locks.button}
        </button>
      </div>
    </div>
  );
}

/**
 * The end of a session: Blob's errand, one small thing to try away from
 * the screen, picked at random from data/dialogue.js. `sayEnd` adds that
 * the tutorial is finished, when the locks card hasn't just said so.
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
