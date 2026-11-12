// The reload tests' cases. Each one puts a child somewhere, plays on from
// there with the mouse, reloads the page as the browser's own button
// does, and says where the child must be afterwards. What is saved at
// the moment of the reload was saved by the game itself.
//
//   t.seed(player, rows, missing)  the child's row (over the defaults), the
//                                  stall_progress ids they have, and any
//                                  columns to treat as not added yet
//   t.open()                       into the game; returns where they land
//   t.reload()                     reloads the page; returns where they land
//   t.child                        the child's hands (play.mjs)
//   t.saved()                      { player, rows }: the database, now
//   t.at(where, expected, when)    fails unless `where` has all of `expected`
//   t.is(actual, expected, what)   fails unless they are equal

import { sleep } from "./browser.mjs";

const FRUIT = "fruit-stall";
const CHAPTER_1 = "fruit-stall-chapter-1";
const SHOP = "provision-store";
const CHAPTER_2 = "provision-store-chapter-2";

// A child who has finished the tutorial, and one who has finished Chapter 1.
const afterTutorial = { tutorial_done: true, tutorial_round: 5 };

export const cases = [
  {
    id: "first-play",
    title: "A new child: the film, the look, the name and Scene 1 each come back after a reload",
    async run(t) {
      t.seed({ first_play_done: false, character: null, game_name: null, scene1_done: false });
      t.at(await t.open(), { step: "intro" }, "opening the game");
      t.at(await t.reload(), { step: "intro" }, "reloading during the film");
      await t.child.playUntil((w) => w.step === "avatar", "choosing a look");
      t.is(t.saved().player.first_play_done, true, "first_play_done, once the film is skipped");
      t.at(await t.reload(), { step: "avatar" }, "reloading while choosing a look");
      await t.child.playUntil((w) => w.step === "name", "choosing a name");
      t.at(await t.reload(), { step: "name" }, "reloading while choosing a name");
      const first = await t.child.playUntil((w) => w.step === "story" && w.line, "Scene 1");
      await t.child.move(first);
      await t.child.move(first);
      t.at(await t.reload(), { step: "story", line: first.line }, "reloading part way through Scene 1");
      t.is(t.saved().player.scene1_done, false, "scene1_done, before Scene 1 is finished");
      const stall = await t.child.playUntil((w) => w.part, "the Fruit Stall");
      t.at(stall, { step: "stall/fruit", part: "tutorial", round: 1, phase: "award" }, "after Scene 1");
      t.is(t.saved().player.scene1_done, true, "scene1_done, after Scene 1");
      t.is(t.saved().player.tutorial_done, false, "tutorial_done, after Scene 1");
    },
  },
  {
    id: "tutorial-opening",
    title: "The tutorial's opening: a reload at the basket, or in Blob's beats, shows the opening again",
    async run(t) {
      t.seed({ scene1_done: false });
      await t.open();
      t.at(await t.child.playUntil((w) => w.part, "the Fruit Stall"), { part: "tutorial", phase: "award" }, "straight after Scene 1");
      t.at(await t.reload(), { step: "stall/fruit", part: "tutorial", round: 1, phase: "award", award: true }, "reloading at the basket");
      const beats = await t.child.playUntil((w) => w.phase === "tutorial", "Blob's beats");
      await t.child.move(beats);
      await t.child.move(beats);
      t.is(t.saved().player.tutorial_round, 0, "tutorial_round, part way through Blob's beats");
      t.at(await t.reload(), { part: "tutorial", round: 1, phase: "award", award: true }, "reloading part way through Blob's beats");
    },
  },
  {
    id: "tutorial-round-1",
    title: "The tutorial's round 1: after the opening, a reload goes to the seller's ask, not the opening",
    async run(t) {
      t.seed({});
      t.at(await t.open(), { part: "tutorial", round: 1, phase: "award" }, "a child who has only played Scene 1");
      await t.child.playUntil((w, s) => s.player.tutorial_round === 1, "the end of the opening", { during: { part: "tutorial", round: 1 } });
      t.at(await t.reload(), { part: "tutorial", round: 1, phase: "ask", award: false, meter: 5 }, "reloading once the opening is done");
      const playing = await t.child.playUntil((w) => w.phase === "play", "round 1 to play");
      await t.child.move(playing);
      t.at(await t.reload(), { part: "tutorial", round: 1, phase: "ask", award: false }, "reloading part way through round 1");
    },
  },
  {
    id: "tutorial-answered",
    title: "The tutorial: round 1 answered, Next not pressed, a reload goes to round 2",
    async run(t) {
      t.seed({ tutorial_round: 1 });
      t.at(await t.open(), { part: "tutorial", round: 1, phase: "ask" }, "coming back to round 1");
      const answered = await t.child.playUntil((w, s) => s.player.tutorial_round === 2, "round 1 answered", { during: { part: "tutorial", round: 1 } });
      t.at(answered, { part: "tutorial", round: 1 }, "the moment round 1 is answered");
      t.at(await t.reload(), { part: "tutorial", round: 2, phase: "question", meter: 4 }, "reloading before Next");
    },
  },
  {
    id: "tutorial-round-3",
    title: "The tutorial: two rounds played, a reload in round 3 stays in round 3",
    async run(t) {
      t.seed({ tutorial_round: 1 });
      await t.open();
      const playing = await t.child.playUntil((w) => w.round === 3 && w.phase === "play", "round 3 to play");
      await t.child.move(playing);
      t.is(t.saved().player.tutorial_round, 3, "tutorial_round, in round 3");
      t.at(await t.reload(), { step: "stall/fruit", part: "tutorial", round: 3, phase: "question", meter: 3 }, "reloading in round 3");
    },
  },
  {
    id: "tutorial-finished",
    title: "The tutorial's last round answered: a reload goes to Chapter 1's start, and so does playing on",
    async run(t) {
      t.seed({ tutorial_round: 4 });
      t.at(await t.open(), { part: "tutorial", round: 4, phase: "play", meter: 2 }, "coming back to round 4");
      const answered = await t.child.playUntil((w, s) => s.player.tutorial_done, "the last round answered", { during: { part: "tutorial" } });
      t.at(answered, { part: "tutorial", round: 5 }, "the moment the last round is answered");
      t.is(t.saved().rows.includes(FRUIT), true, "the Fruit Stall's row, for the profile");
      t.at(await t.reload(), { step: "stall/fruit", part: "chapter-1", round: 1, phase: "ask", meter: 9 }, "reloading while Blob explains");

      t.seed({ tutorial_round: 5 });
      await t.open();
      const on = await t.child.playUntil((w) => w.part === "chapter-1", "Chapter 1, playing on");
      t.at(on, { part: "chapter-1", round: 1, phase: "ask" }, "playing on from the last round");
    },
  },
  {
    id: "tutorial-leftover-rows",
    title: "A child reset by hand, with old stall_progress rows left: still in the tutorial after a reload",
    async run(t) {
      t.seed({ tutorial_round: 2, round_reached: 4 }, [FRUIT, CHAPTER_1, SHOP]);
      t.at(await t.open(), { step: "stall/fruit", part: "tutorial", round: 2 }, "opening the game");
      await t.child.playUntil((w, s) => s.player.tutorial_round === 3, "round 2 answered", { during: { part: "tutorial", round: 2 } });
      t.at(await t.reload(), { step: "stall/fruit", part: "tutorial", round: 3 }, "reloading in the tutorial");
    },
  },
  {
    id: "chapter-1-start",
    title: "Chapter 1's start: a reload during Grandma's lines starts them again",
    async run(t) {
      t.seed(afterTutorial, [FRUIT]);
      const start = await t.open();
      t.at(start, { step: "stall/fruit", part: "chapter-1", round: 1, phase: "ask", meter: 9 }, "coming back after the tutorial");
      await t.child.move(start);
      t.at(await t.reload(), { part: "chapter-1", round: 1, phase: "ask", line: start.line }, "reloading during Grandma's lines");
    },
  },
  {
    id: "chapter-1-round-3",
    title: "Chapter 1: two rounds played, a reload in round 3 stays in round 3",
    async run(t) {
      t.seed(afterTutorial, [FRUIT]);
      await t.open();
      const playing = await t.child.playUntil((w) => w.round === 3 && w.phase === "play", "round 3");
      await t.child.move(playing);
      t.is(t.saved().player.round_reached, 2, "round_reached, in round 3");
      t.at(await t.reload(), { part: "chapter-1", round: 3, phase: "play", meter: 7 }, "reloading in round 3");
    },
  },
  {
    id: "chapter-1-answered",
    title: "Chapter 1: a round answered, Next not pressed, a reload goes to the next round",
    async run(t) {
      t.seed({ ...afterTutorial, round_reached: 1 }, [FRUIT]);
      t.at(await t.open(), { part: "chapter-1", round: 2, phase: "play", meter: 8 }, "coming back to round 2");
      const answered = await t.child.playUntil((w, s) => s.player.round_reached === 2, "round 2 answered", { during: { part: "chapter-1", round: 2 } });
      t.at(answered, { part: "chapter-1", round: 2, phase: "summary" }, "the moment round 2 is answered");
      t.at(await t.reload(), { part: "chapter-1", round: 3, phase: "play" }, "reloading before Next");
    },
  },
  {
    id: "chapter-1-order",
    title: "Chapter 1: a customer's order answered, a reload goes to the next order",
    async run(t) {
      t.seed({ ...afterTutorial, round_reached: 3 }, [FRUIT]);
      t.at(await t.open(), { part: "chapter-1", round: 4, phase: "play" }, "coming back to the first order");
      const answered = await t.child.playUntil((w, s) => s.player.round_reached === 4, "the first order answered", { during: { part: "chapter-1", round: 4 } });
      t.at(answered, { part: "chapter-1", round: 4 }, "the moment the order is answered");
      t.at(await t.reload(), { part: "chapter-1", round: 5, phase: "play" }, "reloading before Next");
    },
  },
  {
    id: "carry-together",
    title: "Blob finds out that several can be carried at once: at the first order, and never again after a reload",
    async run(t) {
      t.seed({ ...afterTutorial, round_reached: 3, group_drag_known: false }, [FRUIT]);
      t.at(await t.open(), { part: "chapter-1", round: 4, phase: "play" }, "coming back to the first order");
      await t.child.waitUntil((w, s) => s.player.group_drag_known === true, "Blob tapping two oranges");
      await sleep(300);
      t.is(await t.page.count(".pm-orange.is-chosen"), 2, "the oranges Blob tapped");
      t.at(await t.reload(), { part: "chapter-1", round: 4, phase: "play" }, "reloading at the same order");
      await sleep(7000);
      t.is(await t.page.count(".pm-orange.is-chosen"), 0, "oranges tapped after the reload");
      t.is((await t.child.waitUntil(() => true, "the order")).line, null, "Blob's line after the reload");
    },
  },
  {
    id: "chapter-1-test",
    title: "Chapter 1: a test handed over right, a reload goes to the next test",
    async run(t) {
      t.seed({ ...afterTutorial, round_reached: 6 }, [FRUIT]);
      t.at(await t.open(), { part: "chapter-1", round: 7, phase: "play" }, "coming back to the first test");
      await t.child.playUntil((w, s) => s.player.round_reached === 7, "the first test answered", { during: { part: "chapter-1", round: 7 } });
      t.at(await t.reload(), { part: "chapter-1", round: 8, phase: "play" }, "reloading straight after");
    },
  },
  {
    id: "chapter-1-ending",
    title: "Chapter 1 finished: a reload before the map shows Grandma's return; after it, the map",
    async run(t) {
      t.seed({ ...afterTutorial, round_reached: 7 }, [FRUIT]);
      await t.open();
      await t.child.playUntil((w, s) => s.rows.includes(CHAPTER_1), "the last test answered", { limit: 80 });
      t.at(await t.reload(), { step: "stall/fruit", part: "chapter-1", phase: "back" }, "reloading before the map");
      await t.child.playUntil((w) => w.map, "the map");
      t.is(t.saved().player.round_reached, 0, "round_reached, once the map is seen");
      t.at(await t.reload(), { step: "stall/fruit", part: "chapter-1", phase: "map", map: true }, "reloading on the map");
    },
  },
  {
    id: "chapter-1-again",
    title: "Chapter 1 played again from the map: nothing is saved, and a reload goes back to the map",
    async run(t) {
      t.seed(afterTutorial, [FRUIT, CHAPTER_1]);
      t.at(await t.open(), { phase: "map", map: true }, "coming back with Chapter 1 finished");
      await t.child.goTo(/fruit/i);
      const playing = await t.child.playUntil((w) => w.round === 2 && w.phase === "play", "round 2, again");
      await t.child.move(playing);
      t.is(t.saved().player.round_reached, 0, "round_reached, playing again");
      t.at(await t.reload(), { step: "stall/fruit", phase: "map", map: true }, "reloading while playing again");
    },
  },
  {
    id: "shop-start",
    title: "The Provision Store: stepped into from the map, a reload starts there",
    async run(t) {
      t.seed(afterTutorial, [FRUIT, CHAPTER_1]);
      await t.open();
      await t.child.goTo(/provision/i);
      const start = await t.child.waitUntil((w, s) => w.part === "chapter-2" && s.rows.includes(SHOP), "the Provision Store");
      t.at(start, { step: "stall/provision", part: "chapter-2", round: 1, phase: "ask" }, "stepping in");
      t.at(await t.reload(), { step: "stall/provision", part: "chapter-2", round: 1, phase: "ask", line: start.line }, "reloading during Baba's lines");
    },
  },
  {
    id: "shop-answered",
    title: "The Provision Store: a round answered, Next not pressed, a reload goes to the next round",
    async run(t) {
      t.seed(afterTutorial, [FRUIT, CHAPTER_1, SHOP]);
      t.at(await t.open(), { step: "stall/provision", part: "chapter-2", round: 1, phase: "ask" }, "coming back to the shop");
      const answered = await t.child.playUntil((w, s) => s.player.round_reached === 1, "round 1 answered", { during: { part: "chapter-2", round: 1 } });
      t.at(answered, { part: "chapter-2", round: 1, phase: "summary" }, "the moment round 1 is answered");
      t.at(await t.reload(), { step: "stall/provision", part: "chapter-2", round: 2, phase: "play" }, "reloading before Next");
    },
  },
  {
    id: "shop-ending",
    title: "The Provision Store finished: a reload before the map shows Baba's return; after it, the map",
    async run(t) {
      t.seed({ ...afterTutorial, round_reached: 9 }, [FRUIT, CHAPTER_1, SHOP]);
      t.at(await t.open(), { part: "chapter-2", round: 10, phase: "play" }, "coming back to the last test");
      await t.child.playUntil((w, s) => s.rows.includes(CHAPTER_2), "the last test answered", { limit: 80 });
      t.at(await t.reload(), { step: "stall/provision", part: "chapter-2", phase: "back" }, "reloading before the map");
      await t.child.playUntil((w) => w.map, "the map");
      t.at(await t.reload(), { step: "stall/provision", part: "chapter-2", phase: "map", map: true }, "reloading on the map");
    },
  },
  {
    id: "columns-missing",
    title: "The tutorial's columns not added yet: the Fruit Stall's row stands in, and the game still starts",
    async run(t) {
      const missing = ["tutorial_round", "tutorial_done"];
      t.seed({}, [FRUIT], missing);
      t.at(await t.open(), { step: "stall/fruit", part: "chapter-1", round: 1, phase: "ask" }, "a child with the row");
      t.seed({}, [], missing);
      t.at(await t.open(), { step: "stall/fruit", part: "tutorial", round: 1, phase: "award" }, "a child without it");
    },
  },
];
