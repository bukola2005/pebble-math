// The reload tests: where a child lands when the page is reloaded.
//
//   npm run test:reload                       every case, at desktop size
//   npm run test:reload -- tutorial-round-3   only the cases named
//   npm run test:reload -- --size=portrait    desktop, portrait, landscape or all
//   npm run test:reload -- --list             what the cases are
//
// It starts the game itself (Vite's dev server) against a stand-in for
// Supabase that keeps its tables in memory (stand-in.mjs), opens a
// headless Chrome, and for each case plays as a child would and reloads
// the page (cases.mjs). Nothing touches the real database, and no
// .env.local is needed. It needs Chrome, Chromium or Edge on the machine
// (CHROME_PATH says where, if it isn't found).
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { SIZES, openBrowser, sleep } from "./browser.mjs";
import { cases } from "./cases.mjs";
import { Failed, childAt, where } from "./play.mjs";
import { startStandIn } from "./stand-in.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];
const named = args.filter((arg) => !arg.startsWith("--"));

if (args.includes("--list")) {
  for (const one of cases) console.log(`${one.id.padEnd(24)} ${one.title}`);
  process.exit(0);
}

const unknown = named.filter((id) => !cases.some((one) => one.id === id));
if (unknown.length) {
  console.error(`No case called ${unknown.join(", ")}. --list shows them.`);
  process.exit(1);
}
const sizes = flag("size") === "all" ? Object.keys(SIZES) : [flag("size") ?? "desktop"];
if (sizes.some((size) => !SIZES[size])) {
  console.error(`--size is one of ${Object.keys(SIZES).join(", ")}, or all.`);
  process.exit(1);
}
const chosen = named.length ? cases.filter((one) => named.includes(one.id)) : cases;

// The one child every case plays as.
const CHILD_ID = "11111111-1111-4111-8111-111111111111";
const childRow = (over) => ({
  id: CHILD_ID,
  profile_id: "parent-1",
  display_name: "Ada",
  age_band: "7-8",
  class_level: null,
  monster: "blue",
  character: "zizi-afro",
  game_name: "Sunny Star",
  first_play_done: true,
  scene1_done: true,
  tutorial_round: 0,
  tutorial_done: false,
  round_reached: 0,
  // Blob's finding out about carrying several at once is not what these test.
  group_drag_known: true,
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

const db = await startStandIn();
// Set before Vite starts: these win over anything in .env.local.
process.env.VITE_SUPABASE_URL = db.url;
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "stand-in-key";
const game = await createServer({ root: ROOT, logLevel: "error", server: { port: 5190 } });
await game.listen();
const app = `http://localhost:${game.httpServer.address().port}`;

// A parent already signed in (the session supabase-js keeps in the
// browser), and nothing read aloud: the child taps through every line, so
// no test waits on a voice.
async function signIn(page) {
  await page.goto(`${app}/`);
  await page.waitFor(`document.readyState === 'complete'`, { timeout: 30000, what: "the site" });
  const part = (object) => Buffer.from(JSON.stringify(object)).toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + 24 * 3600;
  const user = { id: "parent-1", aud: "authenticated", role: "authenticated", email: "parent@example.com", app_metadata: {}, user_metadata: {} };
  const token = `${part({ alg: "HS256", typ: "JWT" })}.${part({ sub: user.id, email: user.email, aud: user.aud, role: user.role, exp: expires })}.stand-in`;
  const session = { access_token: token, refresh_token: "stand-in", token_type: "bearer", expires_in: 24 * 3600, expires_at: expires, user };
  await page.eval(`(() => {
    localStorage.setItem('sb-localhost-auth-token', ${JSON.stringify(JSON.stringify(session))});
    localStorage.setItem('pm-read-aloud-muted', '1');
  })()`);
}

function context(page) {
  const saved = () => ({
    player: db.tables().players?.[0] ?? null,
    rows: (db.tables().stall_progress ?? []).map((row) => row.stall_id),
  });
  // Through the loading screen, to wherever the game puts them: a step's
  // own screen, up and still there a moment later. (Every visit, and
  // every reload, goes through the loading screen first.)
  const STEP = ".pm-stall, .pm-story, .pm-name, .pm-look, .pm-film__skip";
  const settled = `location.pathname.split('/').filter(Boolean).length > 2 && document.querySelector(${JSON.stringify(STEP)}) && location.pathname`;
  const land = async () => {
    for (let i = 0; i < 2; i++) {
      await page.waitFor(settled, { timeout: 45000, what: "the game to put the child somewhere" });
      const path = await page.eval(settled);
      await sleep(700);
      if (path && (await page.eval(settled)) === path) return where(page);
    }
    throw new Error("the page never settled on a step");
  };
  return {
    page,
    saved,
    child: childAt(page, saved),
    seed(player = {}, rows = [], missing = []) {
      db.seed({ missing, players: [childRow(player)], stall_progress: rows.map((stall_id) => ({ player_id: CHILD_ID, stall_id })) });
    },
    async open() {
      await page.goto(`${app}/play/${CHILD_ID}`);
      return land();
    },
    async reload() {
      await page.reload();
      return land();
    },
    at(w, expected, when) {
      const wrong = Object.keys(expected).filter((key) => w[key] !== expected[key]);
      if (!wrong.length) return;
      const show = (object) => wrong.map((key) => `${key} ${JSON.stringify(object[key])}`).join(", ");
      throw new Failed(`${when}: expected ${show(expected)}; got ${show(w)}`);
    },
    is(actual, expected, what) {
      if (actual !== expected) throw new Failed(`${what}: expected ${JSON.stringify(expected)}; got ${JSON.stringify(actual)}`);
    },
  };
}

let failures = 0;
try {
  for (const size of sizes) {
    console.log(`\n${size} (${SIZES[size].width} x ${SIZES[size].height})`);
    const page = await openBrowser(size);
    try {
      await signIn(page);
      for (const one of chosen) {
        const started = Date.now();
        page.takeErrors();
        let problem = null;
        try {
          await Promise.race([
            one.run(context(page)),
            sleep(5 * 60 * 1000).then(() => {
              throw new Failed("took more than five minutes");
            }),
          ]);
          const errors = page.takeErrors();
          if (errors.length) problem = `the page logged an error: ${errors[0]}`;
        } catch (error) {
          problem = error instanceof Failed ? error.message : (error.stack ?? String(error));
        }
        const seconds = Math.round((Date.now() - started) / 1000);
        if (!problem) console.log(`  pass  ${one.id}  (${seconds}s)`);
        else {
          failures += 1;
          const picture = `${ROOT}tests/reload/failures/${size}-${one.id}.png`;
          await page.screenshot(picture).catch(() => {});
          console.log(`  FAIL  ${one.id}  (${seconds}s)\n        ${one.title}\n        ${problem}\n        picture: ${picture}`);
        }
      }
    } finally {
      await page.close();
    }
  }
} finally {
  await game.close();
  await db.close();
}

console.log(failures ? `\n${failures} failed.` : `\nAll ${chosen.length * sizes.length} passed.`);
process.exit(failures ? 1 : 0);
