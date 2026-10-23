# Learning rules

How Pebble Math teaches, as an addition to the game handoff. Each rule
applies to every chapter. The examples say which chapter they belong to.

## Plant a pattern, then break it

In each chapter, three or four rounds where a pattern holds, then one where
it does not, so the child has to ask why rather than repeat a trick.

**The break gets a sentence, not a silence.** Once the child has done the
round, Blob notices out loud what happened, in a line or two. He notices;
he doesn't instruct, and he never lectures on why the trick failed. The
child is left with the surprise and a sentence to hold, not a shrug. (An earlier version had
Blob only ask "what happened there?" and stop. A child waiting for an
answer that never comes thinks the game has frozen.)

### The tutorial (built): the Fruit Stall

Rounds 1 to 5 at the Fruit Stall are the tutorial, not a chapter.

The basket holds exactly ten. When it fills, it closes into a crate of
ten, which stays on screen, and the rest stay on the stall.

| Round | In the basket | On the stall | What happens |
|---|---|---|---|
| 2 | 8 | 5 | Blob wonders "Hmm. How many MORE to fill the basket?" The empty spaces are outlined. Two go in, the basket becomes a crate of ten, three are left: "Ten and three. Thirteen." |
| 3 | 7 | 6 | The same question, no outlines. |
| 4 | 9 | 7 | Blob asks nothing. The child does it. |
| 5 | 6 | 3 | **The break.** Six and three is nine, so the basket never fills and the trained move doesn't apply. The child puts all nine in, then Blob says, a line at a time: "Hmm. The basket didn't fill this time." "Nine. One short of ten." (the one empty space lights up) "Oh. Not every pile makes a ten." |

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

## Don't answer for the child

The tutorial is the teaching stage. After it, the game never breaks a
number down for the child, and never says a total the child could say.
The customer names a quantity ("15 oranges, please.", in digits, never
"fifteen": the two digits are the lesson); the child decides what that is
in crates and loose. The child names the total; the game only confirms.

So Blob doesn't announce totals. He says what is there and asks: "Three
crates and four loose. How many is that?", and the child taps one of three
numbers. The wrong two are chosen to diagnose, not to be near misses:

- **the digits swapped** (43): a place-value problem;
- **the digits added** (7): the child doesn't see a crate as ten.

Near misses like 32 and 33 can't tell those apart. Which one was tapped is
saved, not just right or wrong. (Where swapping changes nothing, as in 22,
the place-value one is the tens and ones side by side as they are said,
202.)

The order never disappears. The customer's number stays on screen the
whole round, and the only way on is Done, once something has been placed.
What the child places is counted for them as they place it, in oranges,
not things: a crate adds ten, so two crates and three loose go 10, 20,
21, 22, 23. That rising count is the lesson, counting on in tens and then
ones, and it lets the child check their own work before Done, as a trader
would. It shows what they placed; it never says what to place. (Not in
the reading round, where it would be the answer.)

When Blob asks about crates and loose oranges, the loose ones are one
group, and each group is labelled with its number as he names it: 10 on
each crate, 8 on the loose pile. The child counts what is in front of
them instead of holding it in their head.

Hints are on request, never on screen waiting: nothing is always on,
everything is asked for, and the test rounds have nothing. In practice, a
tapped crate shows a quiet 10 for a moment, and that is all it does: it
never says what to do next and never adds up. Blob's hint button is there
for a child who is stuck. A hint a child chooses to tap is a different
thing from a hint sitting on screen answering before they've thought.

## Bring every idea back with different objects

Every chapter must bring an earlier chapter's idea back with different
objects. Making ten with oranges must reappear with coins, with buns, with
passengers. If an idea only ever appears with one object, the child learns
the object, not the idea.

When a chapter is planned, list which earlier ideas it brings back, and
with what.

## A bridge out of the screen

At the end of a session Blob says something he is going to try himself,
away from the screen, and asks the child to try it too: "I'm going to
count out ten of anything at home, and see what's left over. You try it
too?" It is his own idea, not homework: Blob is a friend, not a teacher. A
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
  "how many **more** do you need?" A wrong tap gets "Hmm, let me count
  these again." (Blob, counting again himself), never "wrong".
- **Hints fade.** Round 2 outlines the basket's empty spaces, round 3
  doesn't, round 4 asks nothing. Blob's hint button gives one step per
  tap, and Blob doesn't know the answer either: he wonders aloud ("How
  many does the basket still need?"), then wonders about the empty spaces
  as they light up ("Hmm. What about those empty spaces?"), then tries one
  himself, slowly ("Let me try one…"). Never the answer. It resets each
  round, and how many hints a child used is noted per round, ready to be
  saved.
- **Objects first, the numeral second.** The basket's count is on a tag on
  its rim and follows each drop; it is the basket's, not a score.
- **How many oranges are asked for**, by age band: under 7 asks for 2–5,
  7–8 asks for 3–10, 9 and over asks for 5–10. The game covers
  kindergarten to Primary 3, and the dashboard now offers only Under 7 and
  7–8; the 9-and-over range is kept for children added before that.
- **No money as a reward currency.** Places open when the child has
  helped enough to see further into the haze: a lantern is what lets them
  see, and two lanterns open the next place on the main path
  ([story.md](story.md)). Lanterns are light, not money: nothing is bought
  with them. Money is a subject this game teaches, so it is never also the
  reward. There are no locks and no levels, only places in one market.
  Money arrives at the Money Corner, designed alongside the naira wallet.
