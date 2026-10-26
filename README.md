# Pebble Math — website

Phase 1 (visual foundation + hero), Phase 2 (the landing page), Phase 4
(adult accounts: sign up, sign in, dashboard — see [Accounts](#accounts))
and Phase 5 (the way in: Get Started → sign-up, and a child's play session
— see [Getting in](#getting-in)). Phase 3's local-only Get Started flow is
retired. The first play follows the game handoff: loading → film → Zizi's
look → game name → Scene 1 → the Fruit Stall (round one).

## Run it

```bash
npm install
cp .env.local.example .env.local   # then fill in both values
npm run dev
```

The landing page needs nothing else. Sign-up, sign-in and the dashboard need
a Supabase project: without the two values in `.env.local` those pages say
accounts aren't available and the rest of the site works as normal. Setup
is under [Accounts](#accounts).

## What's here

```
index.html                  font links + mount point
supabase/schema.sql         tables, RLS and the sign-up trigger — paste into Supabase
.env.local.example          the two variables the app needs (copy to .env.local)
src/
  main.jsx                  BrowserRouter around the app
  App.jsx                   the route table, error boundary and scroll reset;
                            every page but the landing page is lazy-loaded
  routes/
    Home.jsx                the landing page
    AuthShell.jsx           wraps every account and play page in AuthProvider;
                            shows "accounts aren't available" if Supabase isn't set up
    SignUp.jsx              parent / teacher creates the account
    SignIn.jsx              sign in, then back to where they were going
    LegalPage.jsx           /privacy and /terms, straight from docs/privacy-and-terms-draft.md
    ForgotPassword.jsx      emails a reset link; never says whether an address exists
    EmailConfirmed.jsx      /confirmed, where the sign-up confirmation link lands
    ResetPassword.jsx       where the reset link lands: choose a new password
    Dashboard.jsx           greeting, email, the account's players: add, delete, Play
    Play.jsx                "Who's playing?" — the child picks their own card, which hops
    PlaySessionShell.jsx    /play/:id and below: fetches the player, hands it to each step
    PlayHub.jsx             /play/:id: the loading screen, then the next step
    PlayIntro.jsx           /play/:id/intro: the opening film
    PlayAvatar.jsx          /play/:id/avatar: choose Zizi's look, on the storybook
    PlayName.jsx            /play/:id/name: build a game name from two word lists
    PlayStory.jsx           /play/:id/story: Scene 1, the dim market, with Blob
    PlayStall.jsx           /play/:id/stall/fruit: the basket, the tutorial, Chapter 1
    PlayShop.jsx            /play/:id/stall/provision: the Provision Store, Chapter 2
    Protected*.jsx          each page above behind its sign-in check
  context/AuthContext.jsx   AuthProvider + useAuth: session, user, loading, signUp, signIn, signOut
  lib/
    supabase.js             the one Supabase client; null if the env is missing
    authRedirect.js         what an emailed link put in the address bar, read before supabase-js clears it
    players.js              every query on the players table, and its error messages
    playFlow.js             the order of the play steps, and what each one loads
    speech.js               reads lines aloud with on-device voices only, with the mute switch
    pause.js                pausing the game while the child's profile is open: waits,
                            movement and reading aloud all hold
    lanterns.js             lanterns: how many a child has, and saving one earned
    stallLog.js             how each stall round went (hints used), in memory for now
    progress.js             stall_progress: which stalls a child has cleared
    sound.js                the game's sounds, made in the browser (no files): the
                            a correct answer, the progress meter filling,
                            a crate cracking open, choosing who is playing
    preload.js              the loaders behind the loading bar (real progress only)
    authErrors.js           Supabase auth error → a sentence a parent can act on
    account.js              "Delete my account" (calls delete_my_account() in the database)
    validation.js           password length, email check, name limits
    useDocumentTitle.js     per-page browser-tab title
  styles/tokens.css         colour, type, space, depth, motion — edit here first
  styles/base.css           reset, focus ring, skip link, section rhythm
  components/
    ProtectedRoute.jsx      loading state, then redirect to /signin with the
                            attempted location in router state
    RouteErrorBoundary.jsx  a page that fails to load says so, with a reload
    PageLoading.jsx         the lavender "Loading…" page
    AuthLayout.jsx          the page sign-up and sign-in share
    AuthField.jsx           label + input + hint + inline error
    PlayerForm.jsx          add a player: name, age band, optional class, a monster
    PlayerCard.jsx          one player, with an inline "delete?" confirm
    DeleteAccount.jsx       the dashboard's "Delete my account", behind typing DELETE
    PlayerAvatar.jsx        the monster the grown-up picked, or a neutral circle
    PlayLoading.jsx         the loading screen: the art + a bar driven by real loading
    DialogueBox.jsx         the one dialogue box: speaker, portrait, line, big Next
    StallBackdrop.jsx       the stall's six painted layers, or the dim market
    PlayHud.jsx             the play screens' corners: a way out, game name, mute,
                            and at a stall the progress meter; the name opens the profile
    MarketMap.jsx           the market map: one clear picture, the haze over it in CSS
    ProfilePanel.jsx        the child's profile over the paused game: friends,
                            lanterns and keepsakes
    Sparkles.jsx            the small stars that fly to the basket's count and the meter
    BasketGame.jsx          oranges on the table, the basket and its crate of ten:
                            tap to count, drag to move
    ShelfGame.jsx           the Provision Store's delivery, shelf unit and counter:
                            tins and cartons of ten, dragged onto a shelf or the counter
    StallCards.jsx          what every stall shows around its rounds: the order
                            strip, the trader back with a lantern, a friend joining,
                            Blob's errand
    HintButton.jsx          Blob's face in the corner: one step of help per tap
    CoachMark.jsx           one tutorial beat: one highlight, an arrow, Blob's bubble
    BasketAward.jsx         the card that gives the child their basket
    Navbar.jsx              wordmark, links, Get Started, mobile menu
    Hero.jsx                eyebrow, headline, lead, CTAs, chapter line
    MarketScene.jsx         the SVG stall + the 3 → 5 loop
    InsideMarket.jsx        the three-line checklist
    BigIdea.jsx             the full-width statement
    HowItWorks.jsx          Explore / Interact / Think / Apply
    LearningJourney.jsx     five chapters on one path
    MathInteractionPreview  3 + 2 = 5, and ₦1,000 − ₦300
    MoneyPreview.jsx        the savings jar
    ParentSection.jsx       plain answers for parents
    CTASection.jsx          closing panel
    Footer.jsx
    SectionHeading.jsx      eyebrow + title + lead, used by every section
    VideoIntro.jsx          the opening film: tap to begin, with sound, Skip
    Character.jsx           any character, reusable anywhere
    Apple.jsx               one apple, for demonstrations
    CTAButton.jsx           the only button (primary / secondary)
    GlassPanel.jsx          the translucent surface
  data/characters.js        the eight monsters, with intrinsic sizes
  data/monsters.js          Blob, and the seven a grown-up can pick
  data/friends.js           Blob's seven friends, who join the search one place at a time
  data/lanterns.js          how lanterns are earned and spent, and their two pictures
  data/places.js            the market's places on the map: one row each, { id, name, x, y, r }
  data/zizi.js              Zizi's six looks and her original look
  data/gameNames.js         the two word lists game names are built from
  data/dialogue.js          every line in the game: Scene 1, the tutorial, the stall,
                            and Blob's errands for the end of a session
  data/fruitStall.js        the tutorial's five rounds (round 1's order by age band)
                            and Chapter 1's rounds
  data/provisionStore.js    Chapter 2's rounds, its art, and "How many more?"'s numbers
  data/market.js            the market's art: the six layers, basket, orange, crate,
                            and the seller
  styles/game.css           the game screens' own tokens (garden green, paper)
  data/players.js           age bands and class levels a player may hold
  data/media.js             the agreed paths for the loading art, storybook and film
docs/learning-rules.md      how the game teaches, with examples for later chapters
tools/og-image.mjs          regenerates the social card
public/characters/*.webp    the eight monsters, halos cleaned up
public/characters/mother-sheet.svg
                            Zizi's mother; story artwork only, never playable
public/characters/mum-face.webp
                            her face, smiling, from the opening film (2.5 s); not
                            used now, kept for when she is found
public/zizi/*.webp          Zizi: six looks (zizi-headband, -cornrows, -afro, -puffs,
                            -twists, -braids) and the original, zizi-default
public/video/pre-intro.*    the opening film (webm + mp4 + poster)
public/loading/hands-apart.webp
                            the loading screen: Zizi and her mother pulled apart
public/stall/*.webp         the Fruit Stall's six layers (sky, far, palms, ground,
                            fruit-stall, near), the basket, orange and crate, and
                            the seller (seller.webp, seller-portrait.webp)
public/ui/leaves-*.webp     two leaf sprigs from the near layer, for the dialogue box
public/ui/lantern-*.webp    the lantern, lit and unlit (the same lamp, cut to one box)
public/friends/*.webp       dark silhouettes of the six friends still to join, made
                            from their art (a few KB each instead of the full pictures)
public/art/*.webp           the market map, clear (market-map-day: the map screen; the
                            haze is drawn in CSS), a misty one not used, the blank
                            storybook behind the avatar screen, and the Provision
                            Store: the shop (stall-provision, in the fruit stall's
                            place), a tin, a carton of ten, the empty shelf unit and
                            Baba (portrait-shopkeeper)
source-art/                 full-size masters, kept out of git and out of the build
public/fonts/               Plus Jakarta Sans and Fredoka One, with their licences,
                            served from this site
public/favicon.svg          the app mark
public/og-image.png         the social sharing card
public/robots.txt           crawling rules + sitemap pointer
public/sitemap.xml          one URL, for now
```

Sections alternate white and `--pm-purple-50`, and every section headline
goes through `SectionHeading` so the vertical rhythm stays the same.

Each component keeps its CSS in a file next to it. No CSS framework, no
state library. The only thing that talks to a backend is the adult
account and the players under it (Supabase, below).

## Before you deploy

The domain is written as `https://pebblemath.com/` in three places —
the canonical and social tags in `index.html`, `robots.txt`, and
`sitemap.xml`. Change all three if the real domain differs, then
regenerate the social card:

```bash
node tools/og-image.mjs
```

It reads the fonts from `public/fonts/` and embeds them, so nothing is
fetched from a font service.

**Fonts.** Both typefaces are served from the site itself, so no visitor's
IP address goes to a font service. Both are under the SIL Open Font
License, which allows them in a public repository; the licences are next
to the files.

Three more things for the host. `/signup`, `/signin`, `/confirmed`,
`/dashboard`, `/play`, `/privacy` and `/terms` are client-side routes, so
the host must serve `index.html` for any path that isn't a file, or loading
one of those addresses directly (from a bookmark, a refresh, or an emailed
link) gives a 404. On Vercel, `vercel.json` does this with one rewrite;
files that exist, like `/assets/…` and `/fonts/…`, are still served as
themselves. On another host, set up the same rewrite there. And
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are read at build
time, so set them in the host's build environment. A build without them still
serves the landing page; sign-up, sign-in and the dashboard then say accounts
aren't available. And "Delete my account" needs `delete_my_account()` from
`supabase/schema.sql` in the database.

## The rules the design follows

**Type.** Two faces, both served from this site (`src/styles/fonts.css`,
preloaded in `index.html`):

- **Plus Jakarta Sans** (variable, every weight) — labels, instructions,
  body copy and small UI text. Its Latin file covers English; a second
  file, with ₦ and accented letters, is fetched only by a page that uses
  one of them.
- **Fredoka One** — every headline, prompt and button on
  the site, hero and navbar included. It ships one weight, so anything
  set in it stays at `font-weight: 400`; bolding it makes the browser
  fake the weight. The wordmark stays in Plus Jakarta Sans — it is the brand mark,
  not a headline.

**Colour.** `#99A6F9` carries atmosphere and large areas. White dominates.
In the game and the account pages, orange (`#FE885C`) means "press this"
and nothing else: it is only ever the one button the child (or grown-up)
should press. Anything chosen, counted or pointed at is lavender
(`#99A6F9`, or `--pm-purple-700` where it must be read on white). Painted
artwork, like the stall's awning, keeps its own colours. The landing page
still uses orange for a few small accents.

Two contrast decisions worth knowing:

- Text on the orange button is warm near-black (`#2E1B12`), not white.
  White on `#FE885C` is 2.4:1 and fails WCAG; this pairing is 6.5:1.
- Purple text uses `--pm-purple-700` (`#4C5CCB`, 5.7:1), never the brand
  `#99A6F9`, which is too light to read on white.

**Glass.** An accent only — the eyebrow pill, the floating chips, the
secondary button, the navbar. Sections stay solid.

**Motion.** One 11-second loop (`--pm-loop`) drives the whole market
scene, so the apples, the counter and the spark stay in step. The
character stands still. Everything else on the page is static.
`prefers-reduced-motion` shows the finished state — five apples in the
basket — with nothing moving.

**Weight.** The character art is WebP — 955KB of PNG became 318KB with
no visible difference. Every `<img>` carries its intrinsic `width` and
`height` so the browser reserves the box before the file lands; that is
what keeps layout shift at zero. The hero character loads eagerly at
high priority, everything below the fold lazily, and `img { height:
auto }` in `base.css` stops those attributes from stretching anything.

**Restraint.** The market loop pauses whenever the scene scrolls out of
view, and every page but the landing page is fetched only when someone
opens it.

**Honesty.** No testimonials, user numbers, learning statistics, awards
or partnerships anywhere on the page. The parent section says plainly
that the game is in development.

## Getting in

```
Grown-up   Get Started → /signup → confirmation link → /confirmed → /dashboard
           add a child (name, age band, optional class) → Play
           (the age bands offered are Under 7 and 7–8, and the classes
           Kindergarten to Primary 3: Pebble Math covers kindergarten to
           Primary 3, and the form says there are no games above that
           level yet)

Child      /play "Who's playing?" → tap own card → /play/:id (loading)
           → /intro      the film (until first_play_done)
           → /avatar     Zizi's look (until character holds one)
           → /name       the game name (until game_name is set)
           → /story      Scene 1 (until scene1_done)
           → /stall/fruit  the Fruit Stall, where every later visit
                           starts: where they got to, or the map
                           once Chapter 1 is done
```

Every step is its own route and its own chunk of code, and `lib/playFlow.js`
decides which one comes next from what the player row already holds. A
child who stops halfway picks up at the step they left. Steps replace each
other in the history, so Back from any of them returns to "Who's playing?".
A visit, or a reload, always starts at the loading screen, so the steps
can't be taken out of order and each one's pictures are in before it shows.

Every Get Started button on the landing page goes to `/signup`. There is no
student sign-up: a child can't own an account, so the grown-up creates one
and adds the child from the dashboard.

**Who is who.** Every child plays as **Zizi**, in the look they choose.
The purple monster is **Blob**, and nobody can pick it. He is not a guide:
he is lost in the market too ([docs/story.md](docs/story.md)). The other
seven monsters are on the grown-up's side: a grown-up picks one for each
child when adding them (`players.monster`), so the cards on the dashboard
and on "Who's playing?" are easy to tell apart. In the game, six of them
(green, blue, orange, pink, yellow, teal) are Blob's friends, who join the
search one place at a time; lavender is not one of them. Children added before
monsters came back show a neutral circle with their initial.

**"Who's playing?"** is built for a child: one big card per child (their
monster and their name), nothing to type, no sign-out, no settings. The
device stays signed in as the grown-up. A small link in the corner goes
back to the dashboard. What a child has earned isn't shown here: this
screen is only for choosing who is playing.

The cards sit still. Tapping one is like picking a player in a game: that
monster squashes, hops with a small lean on the way up, lands level with a
burst of lavender sparkles behind it, and its card turns to its chosen
look (a lavender edge and wash), all in 600 ms of CSS keyframes on the
picture that was already there; then the game starts. Taps after the
first do nothing. A sound goes with it (below). With reduced motion there
is no hop, lean or sparkle: the card fades to its chosen look, and the
sound still plays.

**The loading screen** shows `public/loading/hands-apart.webp` full screen,
with a slim bar low down that fills only as files actually arrive
(`lib/preload.js`). It loads only what the next step needs: before the film,
the film itself and its poster; before the avatar screen, the storybook and
the seven Zizi pictures; after that, just the child's Zizi. It is a story
beat as much as a wait, so it stays up for about two seconds on a first
play and one second after that. That is a floor, never a delay added on
top: the bar can't show more than has really loaded, it is only kept from
racing across faster than the floor, and it glides between values. On a
slow connection the screen ends a fraction of a second after the last file
arrives. The film is downloaded once and played from that copy. While a child is busy on one step, the next step's
code and pictures are fetched in the background.

**The film** (until `players.first_play_done`): a full-screen "Tap to begin",
because a browser only plays sound after a tap; then the film with its
sound, and a Skip button there from the first second. `first_play_done` is
saved when it ends or is skipped. On a phone held upright the whole frame
is shown, letterboxed, rather than cropping the story.

**Zizi's look** (until `players.character` holds one of the six): the open
storybook, with the six looks on the left page and the chosen Zizi standing
on the right page, in her original look until one is tapped. Tapping a look
selects it and "This is me" saves it. On a phone held upright only the left
page is shown.

**The game name** (until `players.game_name` is set): two words, one from
each list in `data/gameNames.js`, each stepped through with big arrows, and
a Shuffle button. It starts on a random pair. There is no text box: a child
never types anything, so they can't put a real name in. "That's my name!"
saves it.

**Scene 1** (until `players.scene1_done`): the dim market. The child's Zizi
hides behind toppled crates while purple haze drifts past, and she and
Blob find each other: "…I'm lost too", he says, in a small voice (the line
carries its own `voice`, read slower and quieter). He knows one useful
thing: he has friends in this market, and they will help them look. He doesn't know where her mother is;
the traders see everyone but can't leave their stalls, so the two of them
will mind a stall while a trader goes and asks. Her lines are labelled with the child's
game name, never "Zizi". "Let's go" saves `scene1_done` and goes straight to
the Fruit Stall.

**The Fruit Stall.** The stall is painted empty: the only oranges on screen
are ones a child can move. They sit on its table, and the basket stands on
the ground just in front, so every drag is short. Everything is placed from
where the stall picture is on screen (`components/BasketGame.jsx`), and on
a short screen the scene moves in closer so the oranges stay finger-sized.

*Round 1 is practice*, labelled "Practice" on screen. A child who has just
played Scene 1 is given their basket (one card), then a four-beat
tutorial: everything dims except one thing, an arrow bobs at it, and Blob
explains it in a thought bubble. Tap anywhere to move on; the last beat
lets them try a drag. A child who comes back later goes straight to the
seller, who asks for some oranges (2–5 under 7, 3–10 at 7–8, 5–10 at 9 and
over). There are always three more than asked for, so the child has to stop
at the right number.

*Rounds 2 to 5* fill the basket to ten (`data/fruitStall.js`, and
[docs/learning-rules.md](docs/learning-rules.md) for why). The basket
starts part full; in rounds 2 and 3 Blob first wonders "Hmm. How many MORE
to fill the basket?" with three numbers to tap, and a wrong one gets "Hmm,
let me count these again." (Blob counting again himself; never "wrong"). When the basket fills it closes into a crate of ten, and what is
left on the stall moves onto a woven cloth beside it, so the leftovers
can't be mistaken for the stall's stock. Then Blob says what is there one
step at a time, and the light follows the words: "Ten…" (the crate lifts
and glows, everything else dims), "…and three." (the leftovers light up,
with a 3 on their cloth), "Thirteen." (both, and a 13 between them). Each
step waits for the voice, about a second apart; with the sound off, the
child taps through them. Round 5 never fills the basket: the child puts all
nine in, and Blob says what happened, one line at a time and paced the same
way: "Hmm. The basket didn't fill this time." "Nine. One short of ten." (the
one empty space lights up) "Oh. Not every pile makes a ten." Blob
notices; he doesn't instruct.

Rounds 1 to 5 are **the tutorial**, not a chapter; nothing on screen says
"Chapter 1". When it ends the stall starts again straight away as Chapter
1, as if the child had just come back: Grandma, the crates, a fresh meter.
No card, and no trip back to "Who's playing?".

A child gets a few small sparkles each time an orange goes into the basket:
they fly from where it lands to the basket's count, in under half a second
(CSS and SVG, none with reduced motion).

*The progress meter* is a ring around the child's face, in the name's
chip: an SVG circle cut into one segment per round the child plays today
(stroke-dasharray, small gaps between), filling clockwise from the top.
Five in the tutorial, nine in Chapter 1, and it starts empty every time. When a round is
answered (the order in round 1, a full basket in rounds 2 to 4, round 5
once Blob has explained it), sparkles fly from the basket's count into the
next segment, which turns from outlined to solid lavender as they land,
with a soft rising sound. When the last fills, the meter glows briefly
with a warmer sound, and then the end comes. A right answer to "How many
MORE?" gets the rising sound too. It is not a score: no number, no
percentage, nothing to compare; it only shows how far through the child
is. Without motion the segments simply light, with the same sounds.

The sounds are made in `lib/sound.js`, and the corner switch mutes them
(reduced motion doesn't: it is about movement, not sound):

- **A correct answer** (240 ms): two sine notes a fifth apart, the second
  70 ms after the first, each gliding up a whole tone in 60 ms (660 to
  740 Hz, then 990 to 1110 Hz), with a faint sine an octave above the
  second (1980 to 2220 Hz) for air. 8 ms rise, then they fade.
- **The meter full** (half a second): four triangle-wave notes rising C5,
  E5, G5, C6 (523, 659, 784, 1047 Hz), 80 ms apart, through a 2400 Hz
  low-pass, each fading over 260 ms, over a quiet sine at C4 (262 Hz).
- **A crate cracking open** (140 ms): a burst of white noise through a
  1800 Hz band-pass (Q 1.5), gone in 35 ms; a second, quieter one 25 ms
  later at 3200 Hz (Q 2); under them a triangle wave falling from 220 to
  110 Hz in 80 ms.
- **Choosing who is playing** (done by 450 ms, inside the 600 ms hop): a
  soft pop as the hop starts, 60 ms in (a sine falling from 900 to 300 Hz
  in 40 ms, gone by 70 ms), then two sine notes rising a fourth as it
  lands: G5 (784 Hz) at 270 ms and C6 (1047 Hz) 50 ms later.

*Clearing the stall.* Finishing round 5 clears the stall, and that is saved
at once as a `stall_progress` row; then Chapter 1 starts. No confetti,
star ratings or score. A child who has finished the tutorial comes back
to Chapter 1, where they left off (below). If `stall_progress` can't be read,
the game starts as if nothing were cleared. There are no locks and no
chain: nobody took the mother ([docs/story.md](docs/story.md)).

*After the tutorial, nobody answers for the child.* The tutorial is the
teaching stage; from Chapter 1 on, the game never breaks a number down for
the child and never says a total they could say
([docs/learning-rules.md](docs/learning-rules.md)). A customer asks for a
number; the child decides what that is in crates and loose; the child says
the total, and the game only confirms. Nothing is outlined. Help is
always there, in every round, the tests too: Blob's hint button, bottom
left, makes every crate show its 10 for three seconds, and nothing more (it
never says what to do next, never adds anything up, never points at the
cloth). Whether a child used it goes into their answers in `attempts`
(`used_hint`). In practice a tapped crate also shows its 10 for a
moment.

*Chapter 1, Stage A: adding past ten.* The same stall, now with full
crates on the table: each a crate of ten oranges in two rows of five,
stacked at the table's left end, with no number on it. Each round is a
sum like 28 + 6 (`CHAPTER_ONE_ROUNDS` in `data/fruitStall.js`: 28 + 6,
17 + 5, 39 + 4), though the child never sees it written. Two crates on the
table, eight oranges in the basket, and six loose on the stall. They drag
two in; the basket shuts into a crate, which goes up onto the table with
the others, and four loose oranges are left. Then Blob, one step at a
time: "Three crates…" (the crates light), "…and four loose." (the loose
oranges light), "How many is that?" (both), and three numbers to tap: 34,
43 and 7 (`totalChoices` in `data/fruitStall.js`). The wrong ones are
there to tell a teacher something, not to be near misses: 43 (the digits
swapped) is a place-value slip, 7 (the digits added) means a crate isn't
seen as ten. For 22, where swapping changes nothing, the place-value one
is 202, the tens and ones side by side as they are said. A wrong tap gets
"Hmm, let me count these again."; the right one gets the soft "yes", the
number shows, and Blob says it after the child ("Thirty-four!"). Every tap
is saved in `attempts`, with the number tapped. Objects first, the number
second, and the number the child's.

*Grandma goes to ask.* At the start of the chapter Grandma asks the child
to pack the new oranges and mind her stall, and says she'll go along the
row and ask everyone about their mother; then she walks out of the
picture. That is why the child serves the customers alone: from here every
order is a customer's, and a customer asks for a number in digits, never
for crates and loose: "15 oranges, please." The two digits are the
lesson.

*Chapter 1, Stage B: taking away, by cracking a crate.* Three orders,
"15 oranges, please.", "23 oranges, please." and "8 oranges, please."
(32 - 15, 41 - 23, 23 - 8), each with crates and a few loose oranges on
the table and an empty basket, stepped left to make room for a plain
cloth beside it, with nothing drawn on it but a pale cream edge, always
there, and a row more room than the order needs, so it is plainly the
place for the order before anything is on it (the counter in Stage C has
the same edge). The order is never put away:
it stays up all round as a small strip at the top, "Customer · 23
oranges" (there is no Next to dismiss it, and no "Fill the order": the
number is the order). The child carries crates and loose oranges to the
cloth, by touch or mouse, in any mix; anything that would make more than
the number springs back, and anything on the cloth can be dragged or
tapped back. The cloth has its own count, like the basket's, in its
corner, and it counts oranges, not things: two crates and three loose go
10, 20, 21, 22, 23. Counting on in tens and then ones is what the crates
are for, and it lets the child check before they say they're done. Done
appears on the strip once something is on the cloth; the customer checks
it, and if it isn't the number, "Hmm, let me count these again." Each order needs more loose oranges than there
are. In the first, nothing warns the child and nothing is greyed out:
they carry the two loose ones across, run out, and reach for another (or
wait two seconds), and only then does Blob ask "Hmm. Not enough loose
ones. What's inside a crate?" (his line stays up, with no button, and the
crates breathe a little light). A tap on a crate splits it open with a
short wooden crack; its ten oranges spill into the basket's ten spaces,
and from there they can be carried to the order. Before that, a tapped
crate only shows its 10. In the next two orders the child can open one
whenever they like (a tap opens it, so there the ten oranges spilling
out are what show the ten), and Blob asks again only if they run out.
When it is right the cloth glows, its segment of the meter fills, the
customer takes it, and any loose oranges left on the table go into the
basket with the rest, so the loose ones are one group ("and eight loose"
is a basket of eight, not seven and one on its own). Then Blob asks about
what is left the same way: "One crate…" (each crate shows its 10),
"…and eight loose." (the basket shows its 8), "How many is that?" (18, 81
or 9). In Stage A, where the loose ones are on the table, a tag over them
shows how many as he names them.

*Chapter 1, Stage C: three tests.* Nothing to help: no outlines, no
hint, no 10 on the crates, no Blob, nothing counted aloud, and the basket
put away. The customer's order stays up, with Done once something is on
the counter, a plain wooden top in the middle that starts empty. The
counter counts what is on it, like the cloth (it shows what was placed,
never what to place), except in the reading round, where its count would
be the answer to "How many oranges is that?". "33 oranges,
please.": the child
carries crates and loose oranges from the stall to the counter (anything
can be dragged or tapped back) and taps Done. "One crate and five
oranges.": once those are handed over, "How many oranges is that?", and
the child taps numerals into two slots under the counter, tens under the
crates and ones under the loose oranges. "20 oranges, please.": no loose
ones at all. Wrong is just the customer checking their own order, "Hmm,
let me count these again.", as often as it takes; nothing turns red. Each Done, and each number, is saved as a row in
`attempts` (`lib/attempts.js`) with what was handed over and, if it was
wrong, the first step that broke: `crates`, `loose` or `total`. So is
every Done on a Stage B order (stage `B`) and every tap on Blob's "How
many is that?" (stages `A-ask` and `B-ask`), each with whether the hint
was used in that round first (`used_hint`). Nothing
shows those yet; they are for the teacher dashboard. Only what the
customer takes is ever counted; the stock on the stall never is.

*The end of Chapter 1.* Grandma comes back: she walks back into the
picture, and a card says "Grandma is back!" No news yet. She lends the
child her lantern, so they can see further into the haze, and it arrives
on the card (down from above, its light coming up); the first time a
second one follows, "for serving the customers all by yourself". On a
replay she gives one, for coming back. Then she points: "Look, over there.
More of the market!" (`CHAPTER_ONE.back` in `data/dialogue.js`; without
motion the lanterns are simply there, lit.)

Finishing it the first time (after Stage C) is also
saved at once as a `fruit-stall-chapter-1` row in `stall_progress`, which
earns the straw hat and the tally stick (`data/rewards.js`: every reward
comes from the place that gave it). A second card shows them, says Grandma
gives them, and that the market is opening up: the map comes next. They show
in the child's profile in the game (below) and, for a parent, on the
dashboard, as item cards drawn in SVG: the hat isn't worn on the Zizi
picture, whose seven looks are painted with their heads in different
places. A child coming back after Chapter 1 goes to the map, and plays it
again only if they choose to there (Grandma leaves and comes back again).

*Chapter 1 ends on the map* (`components/MarketMap.jsx`, built from the
map demo). One clear picture of the market (`public/art/market-map-day.webp`)
with the haze drawn over it in CSS: a purple veil, and a soft-masked hole
in it over each open place, where the clear picture shows through. Each
place is one row in `data/places.js`, `{ id, name, x, y, r }`. A dashed
line runs along the path from place to place, roped off (a rope between
two posts, never a padlock: nothing in this market is locked) where the
next place isn't open yet; places still in the haze have a drifting wisp
and a rope, open ones a dot, and the Fruit Stall has the child's pin, with
their Zizi's face. What a place needs is shown on it: the next place along
the path has two dark lanterns. The first time, two lit lanterns float up
to the Provision Store's dark ones and light them, its haze pulls back and
its rope drops; its lanterns stay lit there, and the next place along
shows its two dark ones. A tap on a place opens its card: the Fruit
Stall's "Carry on here" plays Chapter 1 again; the Provision Store says
the haze has lifted but nobody is ready yet; a place still in the haze
says Blob's friends haven't reached it. On a phone held upright the map is
as tall as the screen and scrolls sideways. The map picture is fetched in
the background during the tests, so it is there when the map opens.

The map is where the chapter ends. When the child leaves it (the corner's
home button), Blob signs off over it with his errand: one small thing he
is going to try himself, away from the screen, and asks the child to try
it too, picked at random from `ERRANDS` in `data/dialogue.js` ("I'm going
to count out ten of anything at home, and see what's left over. You try
it too?"): his own idea, not homework. Its button goes back to "Who's
playing?".

*Coming back.* Opening the game takes a child to the furthest point they
reached, never back to a start they have passed. Never played: the film,
then Scene 1 (above). Part way through the tutorial: its round 1. The
tutorial done but not Chapter 1: Chapter 1, at the round they were on,
with Grandma already gone along the row (`players.round_reached`, saved as
each round is reached; the meter has a segment for each round still to
play). Chapter 1 finished: the map, with their pin on the Fruit Stall, the
Provision Store clear and nothing opening; if they left before they had
seen it, Grandma's return and the cards first, then the map opening, as it
would have. From the map the child chooses: "Carry on here" plays Chapter
1 again from Grandma's lines, or they tap the next place. Playing
something again is always their choice, never where the game puts them,
so a replay saves no rounds: leaving one, they come back to the map. On a
phone held upright the map starts with the pin and the furthest open
place both in view. If `round_reached` can't be read (the column not
added yet), Chapter 1 starts at its beginning. Once a child has stepped
into the Provision Store, the same holds there instead (below).

**The Provision Store** (`routes/PlayShop.jsx`, `components/ShelfGame.jsx`,
`data/provisionStore.js`): Chapter 2, Baba's shop. Tapping the Provision
Store on the map, once Chapter 1 has opened it, says "Let's go", and the
child is in the same market, the same light: the Fruit Stall's sky, far
houses, palms, ground and near leaves, with the shop standing in the fruit
stall's place, on the same ground line, its counter as high as the fruit
stall's table. Baba is what the child calls him, like Grandma: not a name.
He asks them to fill his shelves and mind the shop, and goes along the row
to ask. He has no figure in the scene, only his face in the box and on his
card.

It has Chapter 1's shape exactly (the same stages, meter, lanterns and map
ending) and one new idea: **difference**, "this shelf holds 30, it has 18,
how many more fit?", the other half of subtraction from Chapter 1's "give
me 15" ([docs/learning-rules.md](docs/learning-rules.md)). Every shelf of
the shelf unit holds ten tins, five at the back and five in front, and a
carton holds ten, so a carton fills an empty shelf exactly; the unit is
cut from the one picture into a top, shelves and feet, and stacked to hold
10, 30 or 40. Everything to handle is in one band along the ground, close
together, so every drag is short: the shelf unit, the delivery on a mat
(cartons at the back, loose tins in front), and, where there is an order,
the place it goes, a rectangle with a pale cream edge that is always there
(a cloth for a customer, a counter top in the tests), with room to spare.
On a phone held upright the delivery and the place share the ground and
the shelf stands just behind them. A carton dragged onto the shelf goes to
the first empty shelf (and won't go on a part-full one); a tin goes to the
first gap. Nothing outlines the gaps: bare wood is the empty space. The
shelf's tag counts tins, a carton adding 10.

Tins are chosen by tapping: a tapped tin lifts a little and shows 1, the
next 2, and so on; a chosen one tapped again is put down, and the rest
renumber. Dragging any chosen tin carries them all together, and they go
only if all of them fit (otherwise they all spring back, still chosen);
dragging a tin that isn't chosen carries just that one, and a carton
always moves alone. Choosing five and watching 1, 2, 3, 4, 5 appear is
counting: it saves the trips without saving the thinking.

- Stage A, three shelves of ten (6, 3 and 8 on them): a strip says "This
  shelf holds 10 tins" all round. Full, it glows, and Blob: "It had 6… and
  it holds 10. How many more did it need?", with three numbers to tap,
  then "4 more!" after the child. A shelf round ends there, on the
  difference: nothing else is asked.
- Stage B: shelves of 30 and 40 (20, 24 and 23 on them), and a customer:
  "15 tins, please." with 3 cartons and 2 loose. The order goes on the
  customer's cloth beside the delivery, which counts tins. Cracking a
  carton is not taught again: a tapped carton opens whenever the child
  likes, and only if they are stuck (no loose tins, and a carton won't do)
  does Blob wonder, after a touch or two seconds, "Hmm. Not enough loose
  ones. What's inside a carton?" When the order is right, before the
  customer takes it, Blob reads it back with the child: "1 carton… and 5
  loose. How many is that?" (the cloth's count hidden while he asks). The
  child put that quantity together, so reading it back is the question;
  what is left is not asked.
- Stage C, three tests with nothing but the hint button: "This shelf holds
  30 tins. How many more fit?", answered by putting that many on the
  counter beside the delivery (its count hidden: it would be the answer);
  Done checks the
  cartons, then the loose tins, and a right answer goes up onto the shelf
  and fills it. Then a customer's 24 from 3 cartons and 1 loose, and a
  shelf of 40 with 35.

Every tap on "How many more did it need?" and every Done is saved in
`attempts`, as in Chapter 1, with `holds` (the shelf's size) in a shelf
round. Blob's hint button is there in every round: every carton shows its
10, and each shelf what it holds, for three seconds.

At the end Baba comes back with news warmer than Grandma's: someone along
the row thinks they saw a woman asking after a child, nobody saw which way
she went, but somebody is looking for them. His lantern, and the first
time one more, for minding the shop alone. Then the first time, Sprout,
the next of Blob's friends, joins the search (no keepsakes: Grandma's were
a one-off), and the map: the child's pin moves to the Provision Store and
the haze lifts off the Produce Yard. Blob's errand for the shop is about
gaps ("Next time I see a shelf, I'm going to count how many more would
fill it").

Stepping into the shop is saved (a `provision-store` row in
`stall_progress`): from then on every visit starts there, at the round
the child was on, or on the map once Chapter 2 is done, and
`round_reached` is Chapter 2's. From the map, "Carry on here" on either
place plays its chapter again, and what was done today goes with them.

*Blob's hint button*, bottom left: in the tutorial each tap gives the next
step (a question, then the empty spaces outlined, then Blob trying the
move slowly, once), never the answer, and it resets each round. (In
Chapter 1 it shows the crates' 10s: above.) Blob thinks out
loud ("Hmm. What about those empty spaces?"): he doesn't know the answer
either, and never sounds as if he is keeping one back. How many hints a child
used, and how many wrong numbers they tapped, is noted per round in
`lib/stallLog.js`, in memory only, shaped to be saved later.

Tapping an orange counts it: a number badge, 1, 2, 3, in the order tapped.
Tapping a counted orange clears it and the rest renumber. That's the
child's scratchpad and changes nothing. Dragging is what moves an orange.
An orange let go anywhere but over the basket springs back. One in the
basket can't be picked up again, so nothing is counted twice. Both work
with a finger, a mouse or a pen (pointer events). With a keyboard, Enter
counts the focused orange and B puts it in the basket.

**Every line is in `data/dialogue.js`**, to edit without touching code, and
is read aloud with the browser's own voice (`lib/speech.js`) until real
recordings exist. The speaker button in the top corner mutes it (and the
game's sounds), and that is remembered on the device. Only voices on the
device itself are used: the online ones (Edge's "Online (Natural)" voices,
Chrome's "Google" voices) send each line, the child's game name included,
to Microsoft or Google, so they are never chosen, and a device with no
voice of its own is silent. Among the device's voices, Nigerian English
comes first, then British, then any English. Chrome stays silent until the
child has tapped something on the page, which every normal path through
the game does.

**The game name** appears in the top corner of the play screens, as Zizi's
label in the dialogue box, and in the child's profile, and nowhere else.

**The profile.** The name in the top corner (Zizi's face and the game
name) is a button: it opens the child's profile over the game. Their
face and game name, then what the story counts
([docs/story.md](docs/story.md)):

- **Friends**, first and with the most room: seven spaces, Blob in colour
  and the six still to join as dark silhouettes of their own shapes, under
  "Blob's friends are helping us look." One joins at each new place
  (`data/friends.js`): Sprout (green) at the end of the Provision Store.
  It is how close the child is to finding their mother.
- **Lanterns**: every lantern they have earned, lit, for good. Nothing
  earned is ever taken away; what a place still needs is shown on the map,
  as dark lanterns on that place.
- **Keepsakes**: the straw hat and the tally stick, once Grandma has given
  them, and no empty spaces beside them, ever: they are gifts, not a set.

It is a native `<dialog>`: the close button, Escape or a tap outside closes
it, and the focus goes back to the name.

**Lanterns** (`data/lanterns.js`, `lib/lanterns.js`). One for finishing a
place's teaching chapter (at the Fruit Stall, Chapter 1's Stages A and B),
one for finishing its test rounds (Stage C), and one more every time the
child comes back and does the test rounds again: only for coming back,
never for being fast or right first time. Two open the next place on the
main path: at the end of Chapter 1 the map's Provision Store lights with
the two it earns, at the end of Chapter 2 the Produce Yard (a place's
`opensAfter` in `data/places.js`). They stay
lit in the child's profile, and on the place they opened. Extras will open
optional places off the main road (not built). Finishing a chapter once
always earns the two needed to go on. Each lantern earned is a row in `lanterns`
(`teaching` and `test` once per place, `replay` each time), counted when a
session starts. Chapter 1's are saved at its end, when Grandma is back to
lend them, so a lantern never turns up in the profile before the child
has seen it arrive.

While it is open the game is paused (`lib/pause.js`), and closing it goes
on exactly where it was. Nothing is against the clock, so nothing is
lost: the game's waits (`after()` instead of `setTimeout`: a full basket
becoming a crate, an order being taken, Blob's two seconds at the wall,
his steps) stop counting and go on with the time they had left;
everything moving on screen stops mid-way (`document.getAnimations()`);
and reading aloud stops, with the line it was on said again on closing.
A touch on the corners (the name, the sound) doesn't count as reaching for
another orange at the wall.

`prefers-reduced-motion` turns off the little pops, the bar's glide, the
haze drifting, the bobbing arrow and the tutorial's moving demonstration
(`styles/base.css`). The film never starts on its own in any case.

The film is 22 seconds, 1280×720, encoded from the master in `source-art/`:

| File | Size | Encoding |
|---|---|---|
| `pre-intro.webm` | 1.68 MB | VP9 two-pass, 600 kbps (max 900k), Opus 48 kbps |
| `pre-intro.mp4` | 1.86 MB | H.264 Main@3.1, CRF 31, max 900k, AAC-LC 64 kbps, `+faststart` |
| `pre-intro-poster.webp` | 55 KB | the frame at 1.0s, quality 74 |

A child downloads one of the two, never both. Keep re-encodes under 2 MB
each: the loading screen waits for the film on a first play.

## Accounts

**A parent or teacher owns the account. Children are players underneath it.**

A child never has an email, a password or a login, and never signs up.
Collecting those from a child directly would need verifiable parental
consent (COPPA in the US, GDPR-K in the EU, the NDPA in Nigeria), so the
adult signs up with their own email and creates the players. A child just
picks their profile from a list.

```
auth.users ─ profiles ─ players ─ stall_progress
 (adult)     name, role   display name, age band,     one row per stall or
                          class (optional), monster,  chapter the child has
                                                      cleared, or place reached
                          character (Zizi's look),
                          game_name, first_play_done,
                          scene1_done, round_reached
```

- `players` holds a nickname the grown-up gave, a **coarse age band**
  (never a date of birth), an optional class, the monster the grown-up
  picked, the Zizi look and the two-word game name the child chose, and how
  far they've got. Nothing else. Do not add an email, password or date of
  birth column to it. If a change seems to need one, stop and rethink the
  change.
- Row Level Security is on for every table, and the policies are scoped to
  `auth.uid()`: a signed-in account can only read and write its own profile,
  its own players and their progress. Never ship a table without it.
- The `profiles` row is created by a database trigger when someone signs
  up. The sign-up form sends `role` and `full_name` as user metadata, and
  the trigger checks them rather than trusting them.

Routes: `/` landing; `/signup`, `/signin`, `/confirmed`, `/forgot-password`,
`/reset-password`, `/privacy` and `/terms` public; `/dashboard`, `/play` and
`/play/:playerId` protected. A signed-out visit to a protected page goes to `/signin` with the
attempted location in router state, and sign-in sends them back.

**The privacy notice and terms** (`/privacy`, `/terms`) show the matching
sections of `docs/privacy-and-terms-draft.md`, word for word, read at build
time: edit the draft and the pages follow. The draft's own preamble and its
notes for reviewers aren't shown. Every `[BRACKETED]` placeholder is
highlighted until it's filled in. The landing page's footer links to both,
and the sign-up form has a checkbox, "I agree to the Terms of Use and the
Privacy Notice", with both linked (they open in a new tab). Create account
stays disabled until it is ticked.

**Delete my account**, at the foot of the dashboard, asks the grown-up to
type DELETE. It then calls `delete_my_account()` (in `supabase/schema.sql`),
which deletes the caller's own sign-in; the profile, every child on it and
their progress go with it, because each table references the one above it
`on delete cascade`. They are signed out, and the sign-in page says the
account is gone. If it fails, nothing is deleted and the page says so.

**Signing up with an address that already has an account** says so, with
Sign in and Forgot-your-password links. Supabase hides this on purpose: with
email confirmation on it answers 200 with a stand-in user whose `identities`
list is empty (with it off, a `user_already_exists` error). `SignUp.jsx`
checks for both. Supabase's source for this is `internal/api/signup.go` in
supabase/auth. An address that signed up but never confirmed gets the
confirmation email again and keeps its first password; the "check your
email" screen says so.

**The confirmation link** in the sign-up email lands on `/confirmed`, which
never shows an error: no red, no status codes, nothing from Supabase, and
the link's details are taken out of the address bar once read. One calm
sentence and one button:

| Arriving with | Says | Button |
|---|---|---|
| a good link (which also signs them in) | Your email is confirmed. | Continue, to the dashboard |
| a good link, but the sign-in didn't stick on this device | Your email is confirmed. | Sign in |
| a link that had been used or had run out | This account is already confirmed. | Sign in |
| no link at all | You can sign in below. | Sign in |

"Sign in" carries the parent's address to `/signin` in router state (never
the address bar, which ends up in browser history and server logs), from
the session or from the link's own sign-in. The sign-in page fills it in
and puts the cursor in the password box. When the address can't be read,
usually after a used link, the form is simply empty.

**Forgotten passwords.** "Forgot your password?" on sign-in →
`/forgot-password` emails a reset link → `/reset-password` sets the new one.
The request page reads the same whether or not the address has an account
(Supabase answers an unknown address exactly as a real one). The reset page
only offers the form when it was opened from a reset link
(`lib/authRedirect.js` reads that from the address bar before supabase-js
clears it), so a child on a device signed in as the grown-up can't change
the grown-up's password by going to `/reset-password`.

**The landing page ships no account code.** `AuthProvider` wraps only the
account and play routes (`routes/AuthShell.jsx`), and the pages are `React.lazy`, so
`supabase-js` is a separate chunk fetched only when someone opens one of
them. Keep it that way: don't import anything from `lib/supabase.js`,
`context/AuthContext.jsx` or the account pages into `Home.jsx` or the
components it uses, or it lands back in the main bundle.

**The dashboard.** A parent or teacher lists, adds and deletes the players
under their account, and sees which account they're in (the email, small,
in the header). A delete asks first, and counts as done only when the
database confirms a row was removed; saving a look, a game name and the
end of the film are checked the same way. **Play** opens "Who's playing?".

**When a page fails to load** (a dropped connection, or a new version of
the site going live while a tab is open), `RouteErrorBoundary` shows a plain
message with a reload button instead of a white screen.

### Setting up Supabase

1. Create a project at supabase.com.
2. SQL Editor → New query → paste all of `supabase/schema.sql` → Run. It is
   safe to run again.
3. Copy the Project URL and the publishable key (`sb_publishable_…`,
   Settings → API Keys, or the **Connect** dialog) into `.env.local`, then
   restart `npm run dev`. The variable is `VITE_SUPABASE_PUBLISHABLE_KEY`.
   Supabase is replacing its old `anon` key with the publishable one, so the
   old name `VITE_SUPABASE_ANON_KEY` is still read if the new one is empty.
   Never put a `secret` or `service_role` key in a `VITE_` variable: those
   are bundled into the page.
4. Authentication → Sign In / Providers → Email: keep it enabled and set the
   minimum password length to **8**. The form checks 8, but the default
   here is shorter, and only the server setting stops someone calling the
   API directly. Leave the other providers off.
5. Authentication → URL Configuration:
   - **Site URL**: the address the app runs on. `http://localhost:5173`
     while developing; your real domain (e.g. `https://pebblemath.com`) once
     it is live.
   - **Redirect URLs**: add `http://localhost:5173/**` and, when you have it,
     `https://pebblemath.com/**`. The confirmation link returns to
     `/confirmed` and the reset link to `/reset-password`; `/**` covers both.
     An address that isn't on this list is ignored and Supabase sends people
     to the Site URL instead, which for a reset link means landing on the
     home page with nothing happening.
6. "Confirm email" is on by default, and should stay on in production. While
   developing you can switch it off to skip the email step. The sign-up page
   handles both.

## Next

The map and the other stalls (each bringing making ten back with
different objects, see [docs/learning-rules.md](docs/learning-rules.md)),
and saving the per-round record of hints in `lib/stallLog.js`. Later: a way
for the grown-up to edit a child they've already added (their monster,
name, age band), which the dashboard doesn't have yet.

The stall's living background is six layers on one 1920×1080 canvas,
horizon at 55% (y 594), from back to front: sky, far, palms, ground, stall,
near. Keep all six: the stall is its own layer because it is what the child
drags onto, at its own depth.

| Layer | Placement |
|---|---|
| sky | fills the frame |
| far | full width, bottom edge at y 608 |
| palms | 430px tall, centred at 30% of the width, bottom at y 640 |
| ground | full width, bottom at the canvas bottom |
| stall | 700px tall, centred at 52% of the width, bottom at 99% of the height |
| near | 138% of the width, centred, bottom 70px below the frame |

Parallax runs from slowest to fastest: sky, far, palms, ground, near. The
stall barely moves, because it is the subject. The empty sand on the right
is for Grandma (the fruit seller) and Blob. The layers are in place as a still
picture (`components/StallBackdrop.css`); the parallax and the living
effects aren't built yet.
