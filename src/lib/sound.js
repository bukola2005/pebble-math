import { isMuted } from "./speech";

/*
  The game's few small sounds, made in the browser (Web Audio) so there
  are no sound files to download: a correct answer, the progress meter
  filling, a crate cracking open, and a child choosing who is playing. The speaker switch in the corner mutes them along with
  reading aloud.

  A browser only plays sound after the child has tapped something on the
  page, so `primeSound()` is called from the tap that leads to a sound,
  and the sound itself can follow a moment later.
*/

let context = null;

function audio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  context ??= new AudioContextClass();
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
}

/** Call from a tap, before a sound that comes a little later. */
export function primeSound() {
  if (!isMuted()) audio();
}

/*
  One soft note for the sounds below: a `type` wave whose pitch glides
  from `from` to `to` Hz over `glide` seconds, rising to `peak` in 8ms and
  fading out by `length` seconds after `at`.
*/
function note(ctx, out, { at, type = "sine", from, to = from, glide = 0.06, peak, length }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + glide);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/**
 * A correct answer: a quick, soft "yes", 240 ms in all. Two sine notes a
 * fifth apart, the second 70 ms after the first, each gliding up a whole
 * tone in 60 ms: 660 to 740 Hz, then 990 to 1110 Hz. With the second, a
 * faint sine an octave higher (1980 to 2220 Hz) for air. Each rises in
 * 8 ms and fades away: the first over 150 ms, the second over 170 ms.
 */
export function playCorrect() {
  if (isMuted()) return;
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.01;
  note(ctx, ctx.destination, { at: t, from: 660, to: 740, peak: 0.05, length: 0.15 });
  note(ctx, ctx.destination, { at: t + 0.07, from: 990, to: 1110, peak: 0.045, length: 0.17 });
  note(ctx, ctx.destination, { at: t + 0.07, from: 1980, to: 2220, peak: 0.008, length: 0.17 });
}

/**
 * The progress meter full, at the end of the tutorial or a chapter: warmer and longer,
 * half a second. Four triangle-wave notes rising C5, E5, G5, C6 (523, 659,
 * 784 and 1047 Hz), 80 ms apart, through a low-pass at 2400 Hz that rounds
 * them off, each fading over 260 ms; under them a quiet sine at C4
 * (262 Hz) fading over the whole half second.
 */
export function playMeterFull() {
  if (isMuted()) return;
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.01;
  const soft = ctx.createBiquadFilter();
  soft.type = "lowpass";
  soft.frequency.value = 2400;
  soft.connect(ctx.destination);
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => {
    note(ctx, soft, { at: t + i * 0.08, type: "triangle", from: frequency, peak: 0.05 - i * 0.005, length: 0.26 });
  });
  note(ctx, ctx.destination, { at: t, from: 261.63, peak: 0.03, length: 0.5 });
}

/**
 * A crate cracking open: a short wooden crack, 140 ms. A burst of white
 * noise through a band-pass at 1800 Hz (Q 1.5) that is gone in 35 ms, for
 * the split; a second, quieter one 25 ms later at 3200 Hz (Q 2) for a
 * splinter; and under them a triangle wave falling from 220 to 110 Hz in
 * 80 ms and fading by 140 ms, for the knock of the wood.
 */
export function playCrack() {
  if (isMuted()) return;
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.01;
  const burst = (at, frequency, q, peak, length) => {
    const count = Math.floor(ctx.sampleRate * length);
    const buffer = ctx.createBuffer(1, count, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < count; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / count) ** 4;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = frequency;
    band.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = peak;
    noise.connect(band).connect(gain).connect(ctx.destination);
    noise.start(at);
  };
  burst(t, 1800, 1.5, 0.4, 0.035);
  burst(t + 0.025, 3200, 2, 0.2, 0.03);
  note(ctx, ctx.destination, { at: t, type: "triangle", from: 220, to: 110, glide: 0.08, peak: 0.09, length: 0.14 });
}

/**
 * Choosing who is playing, with the card's hop (routes/Play.css): short
 * and bright, done by 450 ms, well inside the 600 ms celebration. A soft
 * pop as the hop starts, 60 ms in: a sine falling from 900 to 300 Hz in
 * 40 ms, gone by 70 ms. Then, as it lands, two sine notes rising a fourth:
 * G5 (784 Hz) at 270 ms, fading over 100 ms, and C6 (1047 Hz) 50 ms
 * later, fading over 130 ms.
 */
export function playPick() {
  if (isMuted()) return;
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.01;
  note(ctx, ctx.destination, { at: t + 0.06, from: 900, to: 300, glide: 0.04, peak: 0.07, length: 0.07 });
  note(ctx, ctx.destination, { at: t + 0.27, from: 783.99, peak: 0.05, length: 0.1 });
  note(ctx, ctx.destination, { at: t + 0.32, from: 1046.5, peak: 0.045, length: 0.13 });
}
