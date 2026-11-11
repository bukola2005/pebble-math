import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CARRY_TOGETHER } from "../data/dialogue";
import { after, cancel } from "./pause";
import { saveGroupDragKnown } from "./players";

/*
  Blob finds out, once, that several can be carried at once (tap them,
  drag one, and they all go). Almost no child finds it by accident, and
  it is what saves dragging fifteen oranges one at a time. He doesn't
  teach it: he is lost too, and finds it out loud, at the first customer's
  order a child plays (Chapter 1's Stage B; or the Provision Store's,
  if they never saw it at the Fruit Stall):

    Blob   "Wait. Watch this…"
           he taps two oranges (or tins): they lift and show 1 and 2
    Blob   "Oh! I can carry both at once."

  and the child carries on. Nothing waits for it: no button, no arrow,
  no "now you try", and the round plays on underneath. The two he tapped
  stay chosen, for the child to carry, put down, or leave. The second
  line goes at the child's next touch, or after a few seconds.

  Once per child, ever: players.group_drag_known, saved as he taps. A
  child who carries several at once themselves, anywhere (the tutorial
  included), never sees it: that is saved the first time they do. If
  it can't be read (the column not added yet), he never does it, rather
  than do it on every visit.

  It needs two loose ones on the table to tap, and none chosen by the
  child already beyond one; otherwise it waits for a later order. If the
  child carries several at once while he is at it, he stops.
*/

// He starts once the customer has asked (their line is said first), and
// taps a moment after his own line.
const START_MS = 2600;
const FIRST_TAP_MS = 1800;
const SECOND_TAP_MS = 700;
const SECOND_LINE_MS = 800;
const SECOND_LINE_STAYS_MS = 5000;

// Left to right on screen, as the child reads: he taps 1, then 2.
const leftToRight = (ids) =>
  ids
    .map((id) => ({ id, x: document.querySelector(`[data-id="${CSS.escape(id)}"]`)?.getBoundingClientRect().left ?? Infinity }))
    .sort((a, b) => a.x - b.x)
    .map((item) => item.id);

/**
 *   player     the child (player.group_drag_known)
 *   ready      a key for the order round being played (its index), or
 *              null when Blob shouldn't start: a new key, a new chance
 *   loose      the ids of the loose ones he could tap, as they are now
 *   chosen     what the child has chosen, as it is now
 *   setChosen  the game's own
 * Returns `line`, what Blob is saying (or null), and `carried(count)`, to
 * call whenever something is put somewhere, with how many went together.
 */
export function useCarryTogether({ player, ready, loose, chosen, setChosen }) {
  const { remember } = useOutletContext();
  const [line, setLine] = useState(null);
  const known = useRef(Boolean(player.group_drag_known));
  const didIt = useRef(false);
  const now = useRef({ loose, chosen });
  now.current = { loose, chosen };

  const learn = () => {
    if (known.current) return;
    known.current = true;
    remember({ group_drag_known: true });
    saveGroupDragKnown(player.id)
      .then(({ error }) => {
        if (error) console.warn("Couldn't save that carrying several at once is known.", error);
      })
      .catch((error) => console.warn("Couldn't save that carrying several at once is known.", error));
  };

  const carried = (count) => {
    if (count < 2) return;
    didIt.current = true;
    // Before he has found it out: he stops, rather than show them what
    // they just did.
    if (line === CARRY_TOGETHER.watch) setLine(null);
    learn();
  };

  useEffect(() => {
    if (ready == null || known.current) return undefined;
    const timers = [];
    const wait = (fn, ms) => timers.push(after(fn, ms));
    const stop = () => setLine(null);
    wait(() => {
      if (known.current || now.current.loose.length < 2 || now.current.chosen.length > 1) return;
      setLine(CARRY_TOGETHER.watch);
      wait(() => {
        // The child is already choosing several, or there aren't two left.
        const two = leftToRight(now.current.loose).slice(0, 2);
        if (didIt.current || two.length < 2 || now.current.chosen.length > 1) return stop();
        setChosen([two[0]]);
        wait(() => {
          if (didIt.current || !two.every((id) => now.current.loose.includes(id))) return stop();
          setChosen(two);
          learn();
          wait(() => (didIt.current ? stop() : setLine(CARRY_TOGETHER.both)), SECOND_LINE_MS);
        }, SECOND_TAP_MS);
      }, FIRST_TAP_MS);
    }, START_MS);
    return () => {
      timers.forEach(cancel);
      setLine(null);
    };
  }, [ready]);

  // "Oh! I can carry both at once." stays until the child touches anything
  // (but the corners), or a few seconds.
  useEffect(() => {
    if (line !== CARRY_TOGETHER.both) return undefined;
    const go = (event) => {
      if (!event?.target?.closest?.(".pm-hud")) setLine(null);
    };
    const id = after(go, SECOND_LINE_STAYS_MS);
    window.addEventListener("pointerdown", go, { capture: true });
    return () => {
      cancel(id);
      window.removeEventListener("pointerdown", go, { capture: true });
    };
  }, [line]);

  return { line, carried };
}
