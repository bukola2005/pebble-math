import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import BasketAward from "../components/BasketAward";
import BasketGame from "../components/BasketGame";
import CoachMark from "../components/CoachMark";
import DialogueBox from "../components/DialogueBox";
import PlayHud from "../components/PlayHud";
import StallBackdrop from "../components/StallBackdrop";
import { FRUIT_STALL, SPEAKERS, TUTORIAL, fillLine } from "../data/dialogue";
import { BASKET_HOLDS, makeRound } from "../data/fruitStall";
import { ORANGE } from "../data/market";
import { getZiziLook } from "../data/zizi";
import "./PlayStall.css";

/*
  /play/:playerId/stall/fruit: the Fruit Stall, round one only.

  A child who has just come from Scene 1 is new here:
    award     the basket, their first thing
    tutorial  four beats, one highlight each, tap anywhere to move on;
              the last one lets them try a drag
    practised that orange hops back out of the basket
  Then, and straight away for a returning child:
    ask       the seller asks for N oranges (N from data/fruitStall.js)
    play      drag them in; the basket counts each drop
    won       Blob: "You did it! Look, the first lock is open!"
              "Play again" starts a fresh round one.

  Nothing here is saved yet: no stall_progress, no reward screen.
*/

export default function PlayStall() {
  const { player, newcomer } = useOutletContext();
  const [round, setRound] = useState(() => makeRound(player.age_band));
  const [inBasket, setInBasket] = useState([]);
  const [counted, setCounted] = useState([]);
  const [phase, setPhase] = useState(newcomer ? "award" : "ask");
  const [beat, setBeat] = useState(0);
  const gameRef = useRef(null);
  const stallRef = useRef(null);
  const timers = useRef([]);
  const zizi = getZiziLook(player.character);
  const values = { name: player.game_name, n: round.target };

  const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  // The tutorial's beats point at things on screen, found when they show.
  const beats = [
    // (The stage is in the DOM before the tutorial starts, so these refs
    // are always filled by the time a beat shows.)
    { text: TUTORIAL.stall, shape: "box", target: () => stallRef.current },
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

  const startRound = (fresh) => {
    if (fresh) setRound(makeRound(player.age_band));
    setInBasket([]);
    setCounted([]);
    setPhase("ask");
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
    else startRound(false);
  };

  // --- what the child does -------------------------------------------------------
  const tap = (id) => {
    if (!id) return;
    setCounted((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  };

  const drop = (id) => {
    if (inBasket.includes(id) || inBasket.length >= BASKET_HOLDS) return false;
    setInBasket((list) => [...list, id]);
    setCounted((list) => list.filter((x) => x !== id));
    if (phase === "tutorial") {
      // They tried it. The tutorial ends, that orange hops back out, and
      // the real round starts.
      setPhase("practised");
      later(() => gameRef.current?.flyBack(id), 900);
      later(() => startRound(false), 1350);
    }
    return true;
  };

  const leave = (id) => setInBasket((list) => list.filter((x) => x !== id));

  // The round is won the moment the basket holds the right number.
  useEffect(() => {
    if (phase !== "play" || inBasket.length !== round.target) return undefined;
    const id = window.setTimeout(() => setPhase("won"), 550);
    return () => window.clearTimeout(id);
  }, [phase, inBasket.length, round.target]);

  return (
    <div
      className="pm-stall"
      onClick={(event) => {
        // In the "try it" beat, a tap anywhere but an orange moves on too.
        if (trying && !event.target.closest(".pm-orange, .pm-hud, .pm-coach__bubble")) advanceTutorial(null);
      }}
    >
      <StallBackdrop stallRef={stallRef} />
      <PlayHud player={player} />

      <main id="main" className="pm-stall__stage">
        <h1 className="pm-sr-only">The Fruit Stall</h1>

        <BasketGame
          ref={gameRef}
          seed={round.seed}
          oranges={round.oranges}
          inBasket={inBasket}
          counted={counted}
          enabled={phase === "play" || trying}
          // The basket appears when the tutorial introduces it.
          basketHidden={phase === "award" || (phase === "tutorial" && beat < 2)}
          dim={phase === "tutorial" && beat === 0}
          onTap={tap}
          onDrop={drop}
          onLeave={leave}
        />

        {phase === "play" && (
          <p className="pm-stall__goal" role="status">
            <span className="pm-stall__goal-number">{round.target}</span>
            <span className="pm-stall__goal-oranges" aria-hidden="true">
              {Array.from({ length: round.target }, (_, i) => (
                <img key={i} src={ORANGE.src} alt="" draggable={false} />
              ))}
            </span>
            <span className="pm-stall__goal-words">{fillLine(FRUIT_STALL.goal, values)}</span>
          </p>
        )}

        {phase === "won" && (
          <div className="pm-stall__blob" aria-hidden="true">
            <img src={SPEAKERS.blob.portrait} width={736} height={900} alt="" draggable={false} />
          </div>
        )}

        {(phase === "ask" || phase === "won") && (
          <div className="pm-stall__dialogue">
            <DialogueBox
              line={phase === "ask" ? FRUIT_STALL.ask : FRUIT_STALL.won}
              values={values}
              ziziPortrait={zizi}
              buttonLabel={phase === "won" ? FRUIT_STALL.again : "Next"}
              onNext={phase === "ask" ? () => setPhase("play") : () => startRound(true)}
            />
          </div>
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
