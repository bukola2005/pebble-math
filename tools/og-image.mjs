/**
 * Renders public/og-image.png — the card that shows when the site is
 * shared on WhatsApp, X, Slack, iMessage and so on.
 *
 * Run it whenever the hero message or the character changes:
 *
 *   npx playwright@latest install chromium   # first time only
 *   node tools/og-image.mjs
 *
 * The fonts come from public/fonts/ and are embedded in the page, so
 * nothing is fetched from a font service.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const font = (file) => {
  try {
    return `data:font/woff2;base64,${readFileSync(path.join(root, "public", "fonts", file)).toString("base64")}`;
  } catch {
    console.warn(`public/fonts/${file} is missing; the card will use a fallback font.`);
    return "";
  }
};

/** The card's page. Relative image paths resolve against the project root. */
export const cardHtml = () => `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<style>
  @font-face { font-family: "Plus Jakarta Sans"; src: url(${font("PlusJakartaSans-latin.woff2")}) format("woff2"); font-weight: 200 800; }
  @font-face { font-family: "Fredoka One"; src: url(${font("FredokaOne-latin.woff2")}) format("woff2"); font-weight: 400; }
</style>
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; display: flex; align-items: center;
    padding: 0 70px; gap: 40px; background: #fff; overflow: hidden;
    font-family: "Plus Jakarta Sans", sans-serif;
    position: relative;
  }
  .glow {
    position: absolute; inset: -20% -10% auto -10%; height: 900px;
    background: radial-gradient(45% 55% at 72% 45%, rgba(153,166,249,.42) 0%, rgba(153,166,249,0) 70%),
                radial-gradient(30% 40% at 20% 90%, rgba(254,136,92,.18) 0%, rgba(254,136,92,0) 70%);
  }
  .copy { position: relative; flex: 1; }
  .mark { font-size: 26px; font-weight: 800; letter-spacing: -.035em; color: #1e1e32; }
  h1 {
    margin-top: 26px; font-family: "Fredoka One", "Plus Jakarta Sans", sans-serif;
    font-weight: 400; font-size: 66px; line-height: 1.1; letter-spacing: -.005em; color: #1e1e32;
  }
  h1 em { font-style: normal; color: #e2622f; }
  p { margin-top: 22px; font-size: 24px; line-height: 1.5; color: #5b5b79; max-width: 19em; }
  .chips { display: flex; gap: 10px; margin-top: 30px; }
  .chip {
    padding: 9px 18px; border-radius: 999px; background: #f6f7ff;
    border: 1px solid rgba(124,140,242,.22); font-size: 17px; font-weight: 700; color: #4c5ccb;
  }
  .art { position: relative; width: 330px; display: grid; place-items: end center; }
  .art::before {
    content: ""; position: absolute; bottom: 10px; left: 8%; right: 8%; height: 46px;
    border-radius: 50%; background: radial-gradient(closest-side, rgba(76,92,203,.26), rgba(76,92,203,0));
  }
  .art img { position: relative; width: 100%; height: auto; }
</style></head>
<body>
  <div class="glow"></div>
  <div class="copy">
    <div class="mark">Pebble Math</div>
    <h1>A market where kids learn to <em>use</em> math.</h1>
    <p>A 2D math game for children from kindergarten to Primary 3, built around one connected market.</p>
    <div class="chips">
      <span class="chip">Addition</span>
      <span class="chip">Subtraction</span>
      <span class="chip">Money &amp; saving</span>
    </div>
  </div>
  <div class="art"><img src="./public/characters/purple.webp" alt="" /></div>
</body></html>`;

// Run directly (not imported): draw the card with Playwright.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`file://${root}/`);
  await page.setContent(cardHtml(), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, "public", "og-image.png") });
  await browser.close();
  console.log("wrote public/og-image.png");
}
