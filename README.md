# Pebble Math — website

Phase 1 (visual foundation + hero), Phase 2 (the landing page),
Phase 3 (the Get Started flow, on local state only) and Phase 4 (adult
accounts: sign up, sign in, dashboard — see [Accounts](#accounts)).

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
  App.jsx                   the route table; the account pages are lazy-loaded
  routes/
    Home.jsx                the landing page
    AuthShell.jsx           wraps /signup, /signin and /dashboard in AuthProvider;
                            shows "accounts aren't available" if Supabase isn't set up
    SignUp.jsx              parent / teacher creates the account
    SignIn.jsx              sign in, then back to where they were going
    ProtectedDashboard.jsx  the dashboard behind its sign-in check
    Dashboard.jsx           greeting + the account's players: list, add, delete
  context/AuthContext.jsx   AuthProvider + useAuth: session, user, loading, signUp, signIn, signOut
  lib/
    supabase.js             the one Supabase client; null if the env is missing
    players.js              every query on the players table, and its error messages
    authErrors.js           Supabase auth error → a sentence a parent can act on
    validation.js           password length, email check, name limits
    useDocumentTitle.js     per-page browser-tab title
  styles/tokens.css         colour, type, space, depth, motion — edit here first
  styles/base.css           reset, focus ring, skip link, section rhythm
  components/
    ProtectedRoute.jsx      loading state, then redirect to /signin with the
                            attempted location in router state
    PageLoading.jsx         the lavender "Loading…" page
    AuthLayout.jsx          the page sign-up and sign-in share
    AuthField.jsx           label + input + hint + inline error
    PlayerForm.jsx          add a player: name, age band, class, character
    PlayerCard.jsx          one player, with an inline "delete?" confirm
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
    GetStartedFlow.jsx      the onboarding journey and all of its state
    OnboardingStep.jsx      the shell each step shares
    IntroSequence.jsx       the three-beat intro into the market
    Character.jsx           any character, reusable anywhere
    Apple.jsx               one apple, for demonstrations
    CTAButton.jsx           the only button (primary / secondary)
    GlassPanel.jsx          the translucent surface
    VideoIntro.jsx          the opening film, with skip and sound
  data/characters.js        the eight characters, with intrinsic sizes
  data/players.js           age bands and class levels a player may hold
tools/og-image.mjs          regenerates the social card
public/characters/*.webp    the eight characters, halos cleaned up
public/video/intro.*        the opening film (webm + mp4 + poster)
public/favicon.svg          the app mark
public/og-image.png         the social sharing card
public/robots.txt           crawling rules + sitemap pointer
public/sitemap.xml          one URL, for now
```

Sections alternate white and `--pm-purple-50`, and every section headline
goes through `SectionHeading` so the vertical rhythm stays the same.

Each component keeps its CSS in a file next to it. No CSS framework, no
state library. The onboarding flow uses local state only; the only thing
that talks to a backend is the adult account (Supabase, below).

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

Two more things for the host. `/signup`, `/signin` and `/dashboard` are
client-side routes, so the host must serve `index.html` for unknown paths
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
view, and the onboarding flow is fetched on the click that opens it
rather than shipped with the landing page.

**Honesty.** No testimonials, user numbers, learning statistics, awards
or partnerships anywhere on the page. The parent section says plainly
that the game is in development.

## The Get Started flow

`routes/Home.jsx` holds one piece of state — whether the flow is open —
and every Get Started button calls it. `GetStartedFlow.jsx` holds the rest:

```
role → played before? → name → age (+ optional class) → character
     → film → intro → the market
```

"Yes, I've played" leads to a screen that says plainly there is no
account to return to yet, rather than pretending to log anyone in.

Parents and teachers get their own short screen instead of the child
steps, and can drop into the student path from there.

Nothing is stored and nothing is sent: no account, no database, no
network call. A child's name lives in React state until the tab closes.
When this needs to become real, the step components stay and only
`GetStartedFlow`'s state changes.

The film plays muted (browsers refuse to autoplay sound) with a sound
toggle and a skip. `prefers-reduced-motion` shows the poster frame and
a play button instead of starting on its own. WebM is offered first and
MP4 second, so Safari and older browsers still get it.

The intro timing is one constant, `BEAT_MS` in `IntroSequence.jsx`.
`MarketScene` takes `reveal` to build itself up piece by piece and
`character` to swap in the player's choice.

## Accounts

**A parent or teacher owns the account. Children are players underneath it.**

A child never has an email, a password or a login, and never signs up.
Collecting those from a child directly would need verifiable parental
consent (COPPA in the US, GDPR-K in the EU, the NDPA in Nigeria), so the
adult signs up with their own email and creates the players. A child just
picks their profile from a list.

```
auth.users ─ profiles ─ players
 (adult)     name, role   display name, age band,
                          class (optional), character
```

- `players` holds a display name the child chose, a **coarse age band**
  (never a date of birth), an optional class, and a character. Nothing
  else. Do not add an email or password column to it. If a change seems to
  need one, stop and rethink the change.
- Row Level Security is on for both tables, and the policies are scoped to
  `auth.uid()`: a signed-in account can only read and write its own profile
  and its own players. Never ship a table without it.
- The `profiles` row is created by a database trigger when someone signs
  up. The sign-up form sends `role` and `full_name` as user metadata, and
  the trigger checks them rather than trusting them.

Routes: `/` landing, `/signup` and `/signin` public, `/dashboard` protected.
A signed-out visit to `/dashboard` goes to `/signin` with the attempted
location in router state, and sign-in sends them back.

**The landing page ships no account code.** `AuthProvider` wraps only those
three routes (`routes/AuthShell.jsx`), and the pages are `React.lazy`, so
`supabase-js` is a separate chunk fetched only when someone opens one of
them. Keep it that way: don't import anything from `lib/supabase.js`,
`context/AuthContext.jsx` or the account pages into `Home.jsx` or the
components it uses, or it lands back in the main bundle.

**The dashboard.** A parent or teacher lists, adds and deletes the players
under their account. A delete asks first, and counts as done only when the
database confirms a row was removed. Picking a player to play is not built
yet; the list is only a list.

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
5. Authentication → URL Configuration: set **Site URL** to the address the
   app runs on (`http://localhost:5173` in development) and add
   `http://localhost:5173/**` and the production address to **Redirect
   URLs**. Without this the link in the confirmation email goes to the wrong
   place.
6. "Confirm email" is on by default, and should stay on in production. While
   developing you can switch it off to skip the email step. The sign-up page
   handles both.

## Next

The addition chapter itself: the first playable scene in the market.
Before it: letting a child pick their player (the Get Started flow still
makes a throwaway local one, and its age step still asks for a single year
where players use bands) and password reset, which doesn't exist yet.
