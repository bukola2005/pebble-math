import { useEffect, useSyncExternalStore } from "react";

/*
  Reads the game's lines aloud with the browser's own voice
  (speechSynthesis). A placeholder until real recordings exist: which
  voices there are depends on the browser and the device, and where there
  is none the game is simply silent. Nothing waits on speech finishing.

  Only voices on the device itself are used. Browsers also offer online
  voices (Edge's "Online (Natural)" ones, Chrome's "Google" ones), which
  send each line to Microsoft or Google to be spoken, and the lines carry
  the child's game name. So a device with no voice of its own stays
  silent rather than fall back to one of those.

  Muting is remembered on this device (localStorage). It is a preference
  for this device, not progress, so it doesn't go to Supabase.
*/

const STORAGE_KEY = "pm-read-aloud-muted";

export const canSpeak =
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof window.SpeechSynthesisUtterance === "function";

function readMuted() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false; // storage blocked: start unmuted
  }
}

let muted = canSpeak ? readMuted() : true;
const listeners = new Set();

export const isMuted = () => muted;

export function setMuted(next) {
  muted = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Storage blocked (a private window): remembered for this visit only.
  }
  if (next) stopSpeaking();
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Whether reading aloud is muted, kept in step across every screen. */
export const useMuted = () => useSyncExternalStore(subscribe, isMuted, isMuted);

// One browser voice for everyone, pitched a little differently per speaker.
const STYLE = {
  zizi: { pitch: 1.3, rate: 0.95 },
  blob: { pitch: 1.12, rate: 0.95 },
  seller: { pitch: 0.92, rate: 0.92 },
  narrator: { pitch: 1.05, rate: 0.95 },
};

// Nigerian English first, then the nearest neighbours, then any English.
const PREFERRED = ["en-ng", "en-gb", "en-za", "en-ke", "en-gh", "en-us", "en-au", "en-in"];

let voice = null;

/** The best English voice on the device itself, or null if it has none. */
function pickVoice() {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.localService);
  const lang = (v) => v.lang.replace("_", "-").toLowerCase();
  for (const wanted of PREFERRED) {
    const match = voices.find((v) => lang(v) === wanted);
    if (match) return match;
  }
  return voices.find((v) => lang(v).startsWith("en")) ?? null;
}

let pending = 0;

if (canSpeak) {
  // Browsers list their voices a moment after they are first asked (Edge
  // a few seconds), so ask now, well before the first line.
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    voice = null;
  });
  // Don't keep talking from a tab the child has left.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopSpeaking();
  });
}

/**
 * Says `text` in `speaker`'s voice, cutting off whatever was being said.
 * `onEnd` runs when the line has been said (or the browser gave up on it).
 * Returns false when nothing will be said at all (muted, or no voice on
 * the device), so a caller pacing things to the voice knows to wait for a
 * tap instead.
 */
export function speak(text, speaker = "narrator", { onEnd } = {}) {
  if (!canSpeak || muted || !text) return false;
  stopSpeaking();
  // No voice on the device (or the list hasn't arrived yet): say nothing.
  // Speaking without a voice set would let the browser pick its default,
  // which can be an online one.
  voice ??= pickVoice();
  if (!voice) return false;
  const chosen = voice;
  // Chrome can drop a line queued in the same moment as cancel().
  pending = window.setTimeout(() => {
    // Words in capitals ("How many MORE…") are for the eye; some voices
    // would spell them out letter by letter.
    const utterance = new SpeechSynthesisUtterance(text.replace(/\b[A-Z]{2,}\b/g, (word) => word.toLowerCase()));
    utterance.voice = chosen;
    utterance.lang = chosen.lang;
    const style = STYLE[speaker] ?? STYLE.narrator;
    utterance.pitch = style.pitch;
    utterance.rate = style.rate;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  }, 60);
  return true;
}

export function stopSpeaking() {
  if (!canSpeak) return;
  window.clearTimeout(pending);
  window.speechSynthesis.cancel();
}

/**
 * Reads `text` aloud when it appears or changes, and again when reading
 * aloud is switched back on; stops when the component goes away.
 */
export function useReadAloud(text, speaker) {
  const quiet = useMuted();
  useEffect(() => {
    if (quiet || !text) return undefined;
    speak(text, speaker);
    return () => stopSpeaking();
  }, [text, speaker, quiet]);
}
