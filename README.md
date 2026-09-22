# Pebble Math — website

Phase 1 (visual foundation + hero), Phase 2 (the landing page) and
Phase 3 (the Get Started flow, on local state only).

## Run it

```bash
npm install
npm run dev
```

## What's here

```
index.html                  font links + mount point
src/
  styles/tokens.css         colour, type, space, depth, motion — edit here first
  styles/base.css           reset, focus ring, skip link, section rhythm
  components/
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
state library, no backend — the onboarding flow uses local state only.

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

`App.jsx` holds one piece of state — whether the flow is open — and
every Get Started button calls it. `GetStartedFlow.jsx` holds the rest:

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

## Next

The addition chapter itself: the first playable scene in the market.
