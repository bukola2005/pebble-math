/**
 * Renders public/og-image.png — the card that shows when the site is
 * shared on WhatsApp, X, Slack, iMessage and so on.
 *
 * Run it whenever the hero message or the character changes:
 *
 *   npx playwright@latest install chromium   # first time only
 *   node tools/og-image.mjs
 *
 * It needs the brand fonts installed or reachable, otherwise the text
 * falls back and the card looks off-brand.
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,800&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; display: flex; align-items: center;
    padding: 0 70px; gap: 40px; background: #fff; overflow: hidden;
    font-family: "Satoshi Variable", "Plus Jakarta Sans", sans-serif;
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
    margin-top: 26px; font-family: "Fredoka One", "Satoshi Variable", sans-serif;
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
    <p>A 2D math game for children 7–10, built around one connected market.</p>
    <div class="chips">
      <span class="chip">Addition</span>
      <span class="chip">Subtraction</span>
      <span class="chip">Money &amp; saving</span>
    </div>
  </div>
  <div class="art"><img src="./public/characters/purple.webp" alt="" /></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file://${root}/`);
await page.setContent(html, { waitUntil: "networkidle" });
await page.waitForTimeout(1200); // let webfonts settle
await page.screenshot({ path: path.join(root, "public", "og-image.png") });
await browser.close();
console.log("wrote public/og-image.png");
