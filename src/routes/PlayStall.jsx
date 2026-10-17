import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import BasketAward from "../components/BasketAward";
import BasketGame from "../components/BasketGame";
import CoachMark from "../components/CoachMark";
import DialogueBox from "../components/DialogueBox";
import HintButton from "../components/HintButton";
import PlayHud from "../components/PlayHud";
import StallBackdrop from "../components/StallBackdrop";
import { FRUIT_STALL, HINTS, NUMBER_WORDS, SPEAKERS, TUTORIAL, capitalise, fillLine } from "../data/dialogue";
import { BASKET_HOLDS, ROUND_COUNT, setUpRound } from "../data/fruitStall";
import { ORANGE } from "../data/market";
import { getZiziLook } from "../data/zizi";
import { recordRound } from "../lib/stallLog";
import "./PlayStall.css";

const STALL_ID = "fruit-stall";

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
    summary   Blob: "Ten and three. Thirteen."
    puzzled   (round 5) the stall is empty and the basket isn't full.
              Blob: "Hmm. What happened there?", and nothing more.

  Blob's hint button gives one step of help per tap, and how many a
  child used is noted for each round (lib/stallLog.js, in memory only).
  Nothing is saved to the database yet.
*/

export default function PlayStall() {
  const { player, newcomer } = useOutletContext();
  const [round, setRound] = useState(() => setUpRound(0, player.age_band));
  const [inBasket, setInBasket] = useState([]);
  const [counted, setCounted] = useState([]);
  const [phase, setPhase] = useState(newcomer ? "award" : "ask");
  const [beat, setBeat] = useState(0);
  const [hintStep, setHintStep] = useState(0);
  const [hintTaps, setHintTaps] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [demoKey, setDemoKey] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [stall, setStall] = useState(null); // the stall picture, once it's in the page
  const gameRef = useRef(null);
  const tally = useRef({ hints: 0, wrong: 0 });
  const timers = useRef([]);
  const zizi = getZiziLook(player.character);

  const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const placed = inBasket.length - round.prefilled.length;
  const onTable = round.oranges.length - placed;
  const values = {
    name: player.game_name,
    n: round.target,
    left: NUMBER_WORDS[onTable],
    total: capitalise(NUMBER_WORDS[BASKET_HOLDS + onTable] ?? ""),
  };

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
    const next = setUpRound(index, player.age_band);
    setRound(next);
    setInBasket(next.prefilled);
    clearRoundState();
    setPhase(index === 0 ? "ask" : next.ask ? "question" : "play");
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
          stallId: STALL_ID,
          round: round.number,
          hintsUsed: tally.current.hints,
          wrongAnswers: round.ask ? tally.current.wrong : null,
        });
        setHintShown(false);
        setPhase(next);
      },
      next === "puzzled" ? 900 : 500
    );
    return () => window.clearTimeout(id);
  }, [phase, inBasket.length, onTable, round, player.id]);

  // The crate closes, then Blob says what is there.
  useEffect(() => {
    if (phase !== "closing") return undefined;
    const id = window.setTimeout(() => setPhase("summary"), 1600);
    return () => window.clearTimeout(id);
  }, [phase]);

  // --- what is on screen ---------------------------------------------------------------
  const playing = phase === "question" || phase === "play";
  const showGaps = playing && (round.outlines || hintStep >= 2);
  const blobSays =
    phase === "question"
      ? FRUIT_STALL.howManyMore
      : phase === "won"
        ? FRUIT_STALL.practiceWon
        : phase === "summary"
          ? FRUIT_STALL.tenAnd
          : phase === "puzzled"
            ? FRUIT_STALL.whatHappened
            : null;

  return (
    <div
      className="pm-stall"
      onClick={(event) => {
        // In the "try it" beat, a tap anywhere but an orange moves on too.
        if (trying && !event.target.closest(".pm-orange, .pm-hud, .pm-coach__bubble")) advanceTutorial(null);
      }}
    >
      <StallBackdrop close stallRef={setStall} />
      <PlayHud player={player} />

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
          gapsPulse={hintStep >= 2}
          closed={phase === "closing" || (phase === "summary" && !round.practice)}
          demoKey={demoKey}
          onTap={tap}
          onDrop={drop}
          onLeave={leave}
        />

        {blobSays && (
          <div className="pm-stall__blob" aria-hidden="true">
            <img src={SPEAKERS.blob.portrait} width={736} height={900} alt="" draggable={false} />
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
            <DialogueBox line={FRUIT_STALL.ask} values={values} ziziPortrait={zizi} onNext={() => setPhase("play")} />
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
              buttonLabel={phase === "puzzled" ? FRUIT_STALL.again : FRUIT_STALL.next}
              onNext={() => startRound((round.index + 1) % ROUND_COUNT)}
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
