# Learning rules

How Pebble Math teaches, as an addition to the game handoff. Each rule
applies to every chapter. The examples say which chapter they belong to.

## Plant a pattern, then break it

In each chapter, three or four rounds where a pattern holds, then one where
it does not, so the child has to ask why rather than repeat a trick.

**The break gets a sentence, not a silence.** Once the child has done the
round, Blob says plainly what happened, in a line or two, and that it's
fine. He never lectures on why the trick failed; the child is left with
the surprise and a sentence to hold, not a shrug. (An earlier version had
Blob only ask "what happened there?" and stop. A child waiting for an
answer that never comes thinks the game has frozen.)

### The tutorial (built): the Fruit Stall

Rounds 1 to 5 at the Fruit Stall are the tutorial, not a chapter.

The basket holds exactly ten. When it fills, it closes into a crate of
ten, which stays on screen, and the rest stay on the stall.

| Round | In the basket | On the stall | What happens |
|---|---|---|---|
| 2 | 8 | 5 | Blob asks "How many MORE to fill the basket?" The empty spaces are outlined. Two go in, the basket becomes a crate of ten, three are left: "Ten and three. Thirteen." |
| 3 | 7 | 6 | The same question, no outlines. |
| 4 | 9 | 7 | Blob asks nothing. The child does it. |
| 5 | 6 | 3 | **The break.** Six and three is nine, so the basket never fills and the trained move doesn't apply. The child puts all nine in, then Blob says, a line at a time: "Hmm. The basket didn't fill this time." "Nine. One short of ten." (the one empty space lights up) "Not every pile makes a ten. That's fine." |

The child breaks 5 into 2 and 3 with their hands, for the same reason the
division example below breaks 91 into 70 and 21: to make the first number
friendly. Nobody says "decomposition" and nobody writes a sum. The number
always comes after what the child did, never before.

### Later-chapter examples. Not for the tutorial or the addition stalls.

> These belong to the **multiplication** and **division** chapters. They
> are well beyond the addition stalls and their ages. Don't use them there.
> They are written down here so the rule's intent isn't lost.

- **Multiplication chapter.** 11 × 32 and 11 × 44 work by the digit
  pattern: write the two digits with their sum between them, so 32 gives
  352 and 44 gives 484. 11 × 46 carries (4 + 6 = 10) and breaks it: the
  answer is 506, not 4106.
- **Division chapter: 91 ÷ 7.** Split 91 as 90 and 1 and it fails, because
  neither part shares into sevens. Split it as 70 and 21 and it works:
  10 + 3 = 13. The child chooses the split themselves, by dragging batches.

## Bring every idea back with different objects

Every chapter must bring an earlier chapter's idea back with different
objects. Making ten with oranges must reappear with coins, with buns, with
passengers. If an idea only ever appears with one object, the child learns
the object, not the idea.

When a chapter is planned, list which earlier ideas it brings back, and
with what.

## A bridge out of the screen

At the end of a session Blob gives the child one small thing to try away
from the screen: "Count out ten of anything at home. What's left over?" A
child who can only do this inside the game has not learned anything
portable; this line is the bridge out.

Plain words, no mechanics, and nothing checks whether they did it. The
lines live in `ERRANDS` in `src/data/dialogue.js`, a list per stall, one
picked at random.

## The Fruit Stall

Built. Clearing the stall (finishing round 5) is saved in `stall_progress`;
the per-round record of hints isn't saved yet.

- **Round one is practice**, and says so on screen. The seller asks for N
  oranges, the child drags them into the basket one at a time, and the
  count follows each drop. Its goal shows the oranges as pictures beside
  the number; from round two the pictures go, because there they would
  hand over the answer before the child has thought.
- **From round two** the basket already holds some, and the question is
  "how many **more** do you need?" A wrong tap gets "Count again…", never
  "wrong".
- **Hints fade.** Round 2 outlines the basket's empty spaces, round 3
  doesn't, round 4 asks nothing. Blob's hint button gives one step per tap:
  a question that points at the thinking, then the empty spaces, then the
  move shown slowly once. Never the answer. It resets each round, and how
  many hints a child used is noted per round, ready to be saved.
- **Objects first, the numeral second.** The basket's count is on a tag on
  its rim and follows each drop; it is the basket's, not a score.
- **How many oranges are asked for**, by age band: under 7 asks for 2–5,
  7–8 asks for 3–10, 9 and over asks for 5–10. The game covers
  kindergarten to Primary 3, and the dashboard now offers only Under 7 and
  7–8; the 9-and-over range is kept for children added before that.
- **No coins or currency.** Things unlock through locks and levels. Money
  arrives with the money chapter, designed alongside the naira wallet.
