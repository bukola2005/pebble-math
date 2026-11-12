// Chrome, driven over its DevTools protocol, for the reload tests: real
// mouse presses, real drags, and the browser's own reload. No packages:
// Node's own WebSocket and fetch, and the Chrome already on the machine
// (or CHROME_PATH).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const SIZES = {
  desktop: { width: 1280, height: 800, mobile: false },
  portrait: { width: 390, height: 844, mobile: true },
  landscape: { width: 844, height: 390, mobile: true },
};

function findChrome() {
  const places = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  const found = places.find((place) => place && existsSync(place));
  if (!found) throw new Error("No Chrome found. Set CHROME_PATH to a Chrome, Chromium or Edge executable.");
  return found;
}

/** Opens a headless Chrome at `size` (a name from SIZES). */
export async function openBrowser(size = "desktop") {
  const { width, height, mobile } = SIZES[size];
  const profile = mkdtempSync(join(tmpdir(), "pebble-math-reload-"));
  const port = 9300 + Math.floor(Math.random() * 600);
  const chrome = spawn(
    findChrome(),
    [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--headless=new", "--no-first-run", "--disable-gpu", "about:blank"],
    { stdio: "ignore" }
  );

  let target = null;
  for (let i = 0; i < 200 && !target; i++) {
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page") ?? null;
    } catch {
      // not up yet
    }
    if (!target) await sleep(100);
  }
  if (!target) throw new Error("Chrome didn't start.");

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => (socket.onopen = resolve));
  let last = 0;
  const waiting = new Map();
  const errors = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && waiting.has(message.id)) {
      waiting.get(message.id)(message.result ?? { error: message.error });
      waiting.delete(message.id);
    } else if (message.method === "Runtime.exceptionThrown") {
      errors.push(message.params.exceptionDetails.exception?.description ?? "an exception");
    } else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++last;
      waiting.set(id, resolve);
      socket.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });

  const page = {
    size,
    /** Errors the page logged or threw, since the last call. */
    takeErrors: () => errors.splice(0),

    /** Runs an expression in the page and returns its (JSON) value. */
    async eval(expression) {
      const { result, exceptionDetails } = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (exceptionDetails) throw new Error(`in the page: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
      return result?.value;
    },

    async waitFor(expression, { timeout = 10000, what = expression } = {}) {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (await page.eval(`Boolean(${expression})`)) return;
        await sleep(100);
      }
      throw new Error(`timed out waiting for ${what}`);
    },

    async goto(url) {
      await send("Page.navigate", { url });
      await sleep(300);
    },

    /** The browser's own reload: everything in memory is gone. */
    async reload() {
      await send("Page.reload");
      await sleep(500);
    },

    exists: (selector) => page.eval(`Boolean(document.querySelector(${JSON.stringify(selector)}))`),
    count: (selector) => page.eval(`document.querySelectorAll(${JSON.stringify(selector)}).length`),

    /**
     * A point on the first element matching `selector` where that element
     * is the one on top, as it would have to be for a child to touch it;
     * null if there is none. `outside` leaves out anything inside that.
     */
    pointOn: (selector, { outside = null } = {}) =>
      page.eval(`(() => {
        for (const el of document.querySelectorAll(${JSON.stringify(selector)})) {
          if (${JSON.stringify(outside)} && el.closest(${JSON.stringify(outside)})) continue;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          for (const [fx, fy] of [[0.5, 0.5], [0.5, 0.3], [0.3, 0.5], [0.7, 0.5], [0.5, 0.7]]) {
            const x = r.x + r.width * fx, y = r.y + r.height * fy;
            if (el.contains(document.elementFromPoint(x, y))) return { x, y };
          }
        }
        return null;
      })()`),

    async pressAt({ x, y }) {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await sleep(30);
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
      await sleep(200);
    },

    /** Presses the element, where it is on top. False if it can't be reached. */
    async press(selector, options) {
      const point = await page.pointOn(selector, options);
      if (!point) return false;
      await page.pressAt(point);
      return true;
    },

    /** Drags the first reachable `from` onto the middle of `to`. */
    async drag(from, to, options) {
      const start = await page.pointOn(from, options);
      const end = await page.eval(`(() => {
        const r = document.querySelector(${JSON.stringify(to)})?.getBoundingClientRect();
        return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
      })()`);
      if (!start || !end) return false;
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.x, y: start.y });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: start.x, y: start.y, button: "left", clickCount: 1 });
      for (let i = 1; i <= 12; i++) {
        const x = start.x + ((end.x - start.x) * i) / 12;
        const y = start.y + ((end.y - start.y) * i) / 12;
        await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "left", buttons: 1 });
        await sleep(16);
      }
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: end.x, y: end.y, button: "left", clickCount: 1 });
      await sleep(500);
      return true;
    },

    async screenshot(file) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
    },

    async close() {
      socket.close();
      chrome.kill();
      await sleep(300);
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        // Chrome can hold its files a moment longer; the temp folder is cleared by the system.
      }
    },
  };
  return page;
}
