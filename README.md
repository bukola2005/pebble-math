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
    ForgotPassword.jsx      emails a reset link; never says whether an address exists
    ResetPassword.jsx       where the reset link lands: choose a new password
    Dashboard.jsx           greeting, email, the account's players: add, delete, Play
    Play.jsx                "Who's playing?" — the child picks their own card
    PlaySessionShell.jsx    /play/:id and below: fetches the player, hands it to each step
    PlayHub.jsx             /play/:id: the loading screen, then the next step
    PlayIntro.jsx           /play/:id/intro: the opening film
    PlayAvatar.jsx          /play/:id/avatar: choose Zizi's look, on the storybook
    PlayName.jsx            /play/:id/name: build a game name from two word lists
    PlayStory.jsx           /play/:id/story: Scene 1, the dim market, with Blob
    PlayStall.jsx           /play/:id/stall/fruit: the basket, the tutorial, round one
    Protected*.jsx          each page above behind its sign-in check
  context/AuthContext.jsx   AuthProvider + useAuth: session, user, loading, signUp, signIn, signOut
  lib/
    supabase.js             the one Supabase client; null if the env is missing
    authRedirect.js         what an emailed link put in the address bar, read before supabase-js clears it
    players.js              every query on the players table, and its error messages
    playFlow.js             the order of the play steps, and what each one loads
    speech.js               reads lines aloud (speechSynthesis), with the mute switch
    preload.js              the loaders behind the loading bar (real progress only)
    authErrors.js           Supabase auth error → a sentence a parent can act on
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
    PlayerAvatar.jsx        the monster the grown-up picked, or a neutral circle
    PlayLoading.jsx         the loading screen: the art + a bar driven by real loading
    DialogueBox.jsx         the one dialogue box: speaker, portrait, line, big Next
    StallBackdrop.jsx       the stall's six painted layers, or the dim market
    PlayHud.jsx             the play screens' corners: a way out, game name, mute
    BasketGame.jsx          the oranges and the basket: tap to count, drag to move
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
  data/monsters.js          Blob the guide, and the seven a grown-up can pick
  data/zizi.js              Zizi's six looks and her original look
  data/gameNames.js         the two word lists game names are built from
  data/dialogue.js          every line in the game: Scene 1, the tutorial, the stall
  data/fruitStall.js        how many oranges the seller asks for, by age band
  data/market.js            the market's art: the six layers, basket, orange, crate
  styles/game.css           the game screens' own tokens (garden green, paper)
  data/players.js           age bands and class levels a player may hold
  data/media.js             the agreed paths for the loading art, storybook and film
docs/learning-rules.md      how the game teaches, with examples for later chapters
tools/og-image.mjs          regenerates the social card
public/characters/*.webp    the eight monsters, halos cleaned up
public/characters/mother-sheet.svg
                            Zizi's mother; story artwork only, never playable
public/zizi/*.webp          Zizi: six looks (zizi-headband, -cornrows, -afro, -puffs,
                            -twists, -braids) and the original, zizi-default
public/video/pre-intro.*    the opening film (webm + mp4 + poster)
public/loading/hands-apart.webp
                            the loading screen: Zizi and her mother pulled apart
public/stall/*.webp         the Fruit Stall's six layers (sky, far, palms, ground,
                            fruit-stall, near) and the basket, orange and crate
public/ui/leaves-*.webp     two leaf sprigs from the near layer, for the dialogue box
public/art/*.webp           market map (day, misty), not used yet; the blank
                            storybook behind the avatar screen
source-art/                 full-size masters, kept out of git and out of the build
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

Run it from a machine that can load the brand fonts, or the card's text
falls back and looks off-brand.

Two more things for the host. `/signup`, `/signin`, `/dashboard` and
`/play` are client-side routes, so the host must serve `index.html` for unknown paths
(a rewrite to `/index.html`) or a refresh on those URLs will 404. And
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are read at build
time, so set them in the host's build environment. A build without them still
serves the landing page; sign-up, sign-in and the dashboard then say accounts
aren't available.

## The rules the design follows

**Type.** Two faces, both loaded in `index.html` in a single Google
Fonts request:

- **Satoshi Variable** (Fontshare) — labels, instructions, body copy and
  small UI text. Plus Jakarta Sans is the fallback where Satoshi isn't
  loaded.
- **Fredoka One** (Google Fonts) — every headline, prompt and button on
  the site, hero and navbar included. It ships one weight, so anything
  set in it stays at `font-weight: 400`; bolding it makes the browser
  fake the weight. The wordmark stays in Satoshi — it is the brand mark,
  not a headline.

**Colour.** `#99A6F9` carries atmosphere and large areas. `#FE885C` is
reserved for the primary action and small accents. White dominates.

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
Grown-up   Get Started → /signup → confirm email → /signin → /dashboard
           add a child (name, age band, optional class) → Play

Child      /play "Who's playing?" → tap own card → /play/:id (loading)
           → /intro      the film (until first_play_done)
           → /avatar     Zizi's look (until character holds one)
           → /name       the game name (until game_name is set)
           → /story      Scene 1 (until scene1_done)
           → /stall/fruit  the Fruit Stall, which is where every later
                           visit starts until the map exists
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
The purple monster is **Blob**, the guide, and nobody can pick it. The other
seven monsters are on the grown-up's side: a grown-up picks one for each
child when adding them (`players.monster`), so the cards on the dashboard
and on "Who's playing?" are easy to tell apart. Children added before
monsters came back show a neutral circle with their initial.

**"Who's playing?"** is built for a child: one big card per child (their
monster and their name), nothing to type, no sign-out, no settings. The
device stays signed in as the grown-up. A small link in the corner goes
back to the dashboard.

**The loading screen** shows `public/loading/hands-apart.webp` full screen,
with a slim bar low down that fills only as files actually arrive
(`lib/preload.js`). It loads only what the next step needs: before the film,
the film itself and its poster; before the avatar screen, the storybook and
the seven Zizi pictures; after that, just the child's Zizi. It stays up at
least 700ms so a cached load doesn't flash. The film is downloaded once and
played from that copy. While a child is busy on one step, the next step's
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

**Scene 1** (until `players.scene1_done`): the dim market, as written in the
handoff. The child's Zizi hides behind toppled crates while purple haze
drifts past, and Blob finds her. Her lines are labelled with the child's
game name, never "Zizi". "Let's go" saves `scene1_done` and goes straight to
the Fruit Stall.

**The Fruit Stall, round one.** A child who has just played Scene 1 is given
their basket (one card), then a four-beat tutorial: everything dims except
one thing, an arrow bobs at it, and Blob explains it in a thought bubble.
Tap anywhere to move on. The last beat lets them try a drag. A child who
comes back later goes straight to the stall. The seller then asks for some
oranges (2–5 under 7, 3–10 at 7–8, 5–10 at 9 and over) and the child drags
them in; the basket counts each drop. There are always three more oranges
than asked for, so the child has to stop at the right number. Blob says
"You did it! Look, the first lock is open!" and "Play again" starts a fresh
round one. Nothing about the stall is saved yet.

Tapping an orange counts it: a number badge, 1, 2, 3, in the order tapped.
Tapping a counted orange clears it and the rest renumber. That's the
child's scratchpad and changes nothing. Dragging is what moves an orange.
An orange let go anywhere but over the basket springs back. One in the
basket can't be picked up again, so nothing is counted twice. Both work
with a finger, a mouse or a pen (pointer events). With a keyboard, Enter
counts the focused orange and B puts it in the basket.

**Every line is in `data/dialogue.js`**, to edit without touching code, and
is read aloud with the browser's own voice (`lib/speech.js`) until real
recordings exist. The speaker button in the top corner mutes it, and that
is remembered on the device. Nigerian English is used where the browser
has it (Edge does), then British, then any English. Chrome stays silent
until the child has tapped something on the page, which every normal path
through the game does.

**The game name** appears in the top corner of the play screens and as Zizi's
label in the dialogue box, and nowhere else.

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
 (adult)     name, role   display name, age band,     one row per stall
                          class (optional), monster,  the child has cleared
                          character (Zizi's look),
                          game_name, first_play_done,
                          scene1_done
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

Routes: `/` landing; `/signup`, `/signin`, `/forgot-password` and
`/reset-password` public; `/dashboard`, `/play` and `/play/:playerId`
protected. A signed-out visit to a protected page goes to `/signin` with the
attempted location in router state, and sign-in sends them back.

**Signing up with an address that already has an account** says so, with
Sign in and Forgot-your-password links. Supabase hides this on purpose: with
email confirmation on it answers 200 with a stand-in user whose `identities`
list is empty (with it off, a `user_already_exists` error). `SignUp.jsx`
checks for both. Supabase's source for this is `internal/api/signup.go` in
supabase/auth. An address that signed up but never confirmed gets the
confirmation email again and keeps its first password; the "check your
email" screen says so.

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
     `/dashboard` and the reset link to `/reset-password`; `/**` covers both.
     An address that isn't on this list is ignored and Supabase sends people
     to the Site URL instead, which for a reset link means landing on the
     home page with nothing happening.
6. "Confirm email" is on by default, and should stay on in production. While
   developing you can switch it off to skip the email step. The sign-up page
   handles both.

## Next

Rounds two to five at the Fruit Stall (the "how many more?" question, then
make-ten), the reward when a stall is cleared, the lock opening and the
map. Later: a way for the grown-up to edit a child they've already added
(their monster, name, age band), which the dashboard doesn't have yet.

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
is for the fruit seller and Blob. The layers are in place as a still
picture (`components/StallBackdrop.css`); the parallax and the living
effects aren't built yet.
