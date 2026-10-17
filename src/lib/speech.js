import { useEffect, useSyncExternalStore } from "react";

/*
  Reads the game's lines aloud with the browser's own voice
  (speechSynthesis). A placeholder until real recordings exist: which
  voices there are depends on the browser and the device, and where there
  is none the game is simply silent. Nothing waits on speech finishing.

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

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  const lang = (v) => v.lang.replace("_", "-").toLowerCase();
  for (const wanted of PREFERRED) {
    const matches = voices.filter((v) => lang(v) === wanted);
    // A voice on the device itself doesn't stall on a slow connection.
    if (matches.length) return matches.find((v) => v.localService) ?? matches[0];
  }
  return voices.find((v) => lang(v).startsWith("en")) ?? null;
}

let pending = 0;

if (canSpeak) {
  // Chrome lists its voices a moment after the page loads.
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    voice = null;
  });
  // Don't keep talking from a tab the child has left.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopSpeaking();
  });
}

/** Says `text` in `speaker`'s voice, cutting off whatever was being said. */
export function speak(text, speaker = "narrator") {
  if (!canSpeak || muted || !text) return;
  stopSpeaking();
  // Chrome can drop a line queued in the same moment as cancel().
  pending = window.setTimeout(() => {
    voice ??= pickVoice();
    // Words in capitals ("How many MORE…") are for the eye; some voices
    // would spell them out letter by letter.
    const utterance = new SpeechSynthesisUtterance(text.replace(/\b[A-Z]{2,}\b/g, (word) => word.toLowerCase()));
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "en-GB";
    const style = STYLE[speaker] ?? STYLE.narrator;
    utterance.pitch = style.pitch;
    utterance.rate = style.rate;
    window.speechSynthesis.speak(utterance);
  }, 60);
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
