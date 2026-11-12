// How a child plays, for the reload tests: one move at a time, chosen
// from what is on the screen, with the mouse. The tests say how far to
// play; this knows what to do next at each point.
import { CHAPTER_ONE_ROUNDS } from "../../src/data/fruitStall.js";
import { sleep } from "./browser.mjs";

/** A case that didn't go as it should: reported as it reads, with no stack. */
export class Failed extends Error {}

/**
 * Where the child is: the step (from the address), and at a stall its
 * part ("tutorial", "chapter-1", "chapter-2"), round (from 1) and phase,
 * which the stalls put on their outermost element for these tests.
 */
export const where = (page) =>
  page.eval(`(() => {
    const stall = document.querySelector('.pm-stall');
    return {
      step: location.pathname.replace(/^\\/play\\/[^/]+\\/?/, '') || 'loading',
      part: stall?.dataset.part ?? null,
      round: stall ? Number(stall.dataset.round) : null,
      phase: stall?.dataset.phase ?? null,
      award: Boolean(document.querySelector('.pm-award')),
      map: Boolean(document.querySelector('.pm-map')),
      meter: document.querySelectorAll('[data-segment]').length,
      line: document.querySelector('.pm-dialogue__line')?.textContent.trim() ?? null,
    };
  })()`);

/**
 * A child at `page`. `saved()` gives what the database holds now, for
 * `playUntil` to stop on.
 *   move(w)                 the one thing a child would do next, at `w`
 *   playUntil(until, what)  moves until `until(where, saved)` is true.
 *                           `{ during: { part, round } }` fails it as soon
 *                           as the child is anywhere else: for something
 *                           that must be saved before they move on
 *   waitUntil(until, what)  the same, touching nothing
 *   goTo(/place/)           on the map: taps a place, then its card's button
 */
export function childAt(page, saved) {
  const tried = new Map(); // the numbers already tapped for a question
  const numerals = new Map(); // how many numerals have gone in, in a reading round

  const next = () => page.press(".pm-dialogue__next");

  const pressChoice = async (text) => {
    const point = await page.eval(`(() => {
      const button = [...document.querySelectorAll('.pm-dialogue__choice')].find((b) => b.textContent.trim() === ${JSON.stringify(text)});
      const r = button?.getBoundingClientRect();
      return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
    })()`);
    if (point) await page.pressAt(point);
    await sleep(400);
  };

  // A question with numbers to tap: each in turn, until one is right. (A
  // wrong one only gets "let me count these again".)
  const answer = async (w) => {
    const key = `${w.part} ${w.round} ${w.phase}`;
    const seen = tried.get(key) ?? [];
    const values = await page.eval(`[...document.querySelectorAll('.pm-dialogue__choice')].map((b) => b.textContent.trim())`);
    const pick = values.find((value) => !seen.includes(value));
    if (!pick) return sleep(300);
    tried.set(key, [...seen, pick]);
    return pressChoice(pick);
  };

  // Chapter 1, Stage B: a customer's order. The crates, then the loose
  // ones (from the table, or a cracked crate's from the basket); with no
  // loose ones left, a crate is tapped open. Then Done.
  const order = async (round) => {
    const want = round.order.crates * 10 + round.order.loose;
    const on = await page.eval(`({
      count: Number(document.querySelector('.pm-order__tag')?.textContent ?? 0),
      crates: document.querySelectorAll('.pm-order__crate').length,
    })`);
    if (on.count === want) return page.press(".pm-stall__order-done");
    if (on.crates < round.order.crates) return page.drag(".pm-stack-crate", ".pm-order");
    if (await page.drag(".pm-orange:not(.is-set-aside), .pm-basket__orange.is-movable", ".pm-order")) return undefined;
    return page.press(".pm-stack-crate");
  };

  // Chapter 1, Stage C: a test. The crates and loose ones to the counter,
  // Done, and in the reading round the number: tens, then ones.
  const test = async (w, round) => {
    const tens = Math.floor(round.want / 10);
    const ones = round.want % 10;
    if (await page.exists(".pm-dialogue__choice")) {
      const put = numerals.get(w.round) ?? 0;
      numerals.set(w.round, put + 1);
      return pressChoice(String(put % 2 === 0 ? tens : ones));
    }
    if ((await page.count(".pm-order__crate")) < tens) return page.drag(".pm-stack-crate", ".pm-order");
    if ((await page.count(".pm-order__orange")) < ones) return page.drag(".pm-orange:not(.is-set-aside)", ".pm-order");
    return next(); // Done
  };

  // The Provision Store, Stage C: a test. How many is in the question: a
  // shelf's ("This shelf holds 40 tins. How many more fit?", less what it
  // has), or a customer's number.
  const shopTest = async (w) => {
    const said = Number((w.line ?? "").match(/\d+/)?.[0]);
    const want = (await page.exists(".pm-shelf")) ? said - (await page.count(".pm-shelf__tin.is-had")) : said;
    const outside = { outside: ".pm-order" };
    if ((await page.count(".pm-order .pm-carton")) < Math.floor(want / 10)) return page.drag(".pm-carton", ".pm-order", outside);
    if ((await page.count(".pm-order .pm-tin")) < want % 10) {
      if (await page.drag(".pm-tin", ".pm-order", outside)) return undefined;
      return page.press(".pm-carton", outside); // no loose tins left: a carton is opened
    }
    return next(); // Done
  };

  async function move(w) {
    switch (w.step) {
      case "loading":
        return sleep(300);
      case "intro":
        return page.press(".pm-film__skip");
      case "avatar":
        if (!(await page.exists(".pm-look__input:checked"))) return page.press(".pm-look");
        return page.press(".pm-book__actions button");
      case "name":
        return page.press(".pm-name__actions button:last-child");
      case "story":
        return next();
      default:
    }
    if (!w.part) return sleep(300);
    // The basket, and the cards at a chapter's end: one button each.
    if (w.award) return page.press(".pm-award__button");
    if (await page.exists(".pm-stall__end-button")) return page.press(".pm-stall__end-button");

    if (w.part === "tutorial") {
      switch (w.phase) {
        case "tutorial":
          // Blob's beats: Next, and at the last one, a drag to try.
          return (await page.exists(".pm-coach__ghost")) ? page.drag(".pm-orange", ".pm-basket") : page.press(".pm-coach__next");
        case "question":
          return answer(w);
        case "play":
          return page.drag(".pm-orange:not(.is-set-aside)", ".pm-basket");
        case "ask":
        case "won":
        case "summary":
        case "puzzled":
          return next();
        default:
          return sleep(300); // the game's own moment
      }
    }

    if (w.part === "chapter-1") {
      const round = CHAPTER_ONE_ROUNDS[w.round - 1];
      switch (w.phase) {
        case "ask":
          return next();
        case "play":
          if (round.stage === "A") return page.drag(".pm-orange:not(.is-set-aside)", ".pm-basket");
          return round.stage === "B" ? order(round) : test(w, round);
        case "summary":
          return (await page.exists(".pm-dialogue__choice")) ? answer(w) : next();
        default:
          return sleep(300);
      }
    }

    if (w.part === "chapter-2") {
      switch (w.phase) {
        case "ask":
          return next();
        case "play":
          if (await page.exists(".pm-order--counter")) return shopTest(w);
          if (await page.exists(".pm-shelf")) return page.drag(".pm-tin", ".pm-shelf", { outside: ".pm-order" });
          throw new Error("these tests don't play the Provision Store's customer orders");
        case "summary":
          return (await page.exists(".pm-dialogue__choice")) ? answer(w) : next();
        default:
          return sleep(300);
      }
    }
    return sleep(300);
  }

  const place = (w) => `${w.part ?? w.step}${w.round ? `, round ${w.round}` : ""}${w.phase ? ` (${w.phase})` : ""}`;

  async function playUntil(until, what, { limit = 150, during = null } = {}) {
    for (let i = 0; i < limit; i++) {
      const w = await where(page);
      if (await until(w, saved())) return w;
      if (during && w.part && Object.keys(during).some((key) => w[key] !== during[key])) {
        throw new Failed(`played past ${what} without it happening: now at ${place(w)}`);
      }
      await move(w);
      await sleep(250);
    }
    throw new Failed(`never got to ${what}: after ${limit} moves, at ${place(await where(page))}`);
  }

  async function waitUntil(until, what, { timeout = 15000 } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const w = await where(page);
      if (await until(w, saved())) return w;
      await sleep(150);
    }
    throw new Failed(`never got to ${what}: at ${place(await where(page))}`);
  }

  async function goTo(place) {
    const point = await page.eval(`(() => {
      const spot = [...document.querySelectorAll('.pm-map__spot')].find((b) => ${place}.test(b.getAttribute('aria-label') ?? ''));
      if (!spot) return null;
      spot.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      const r = spot.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!point) throw new Error(`no place on the map like ${place}`);
    await page.pressAt(point);
    await page.waitFor(`document.querySelector('.pm-map__go')`, { what: "the place's card" });
    await sleep(300);
    if (!(await page.press(".pm-map__go"))) throw new Error("the card's button can't be reached");
    await sleep(600);
  }

  return { move, playUntil, waitUntil, goTo };
}
