import { isMuted } from "./speech";

/*
  The game's few small sounds, made in the browser (Web Audio) so there
  are no sound files to download: a lock opening, a correct answer, and
  the progress meter filling. The speaker switch in the corner mutes them
  along with reading aloud.

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

/** A lock opening: a small metal click, then two soft bell notes. */
export function playLockOpen() {
  if (isMuted()) return;
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.02;

  // The click: a very short burst of filtered noise.
  const length = Math.floor(ctx.sampleRate * 0.05);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  const click = ctx.createBufferSource();
  click.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2600;
  band.Q.value = 2.5;
  const clickGain = ctx.createGain();
  clickGain.gain.value = 0.22;
  click.connect(band).connect(clickGain).connect(ctx.destination);
  click.start(t);

  // Two soft notes, a fifth apart, fading slowly.
  [
    [659.25, 0.07, 0.12],
    [987.77, 0.05, 0.3],
  ].forEach(([frequency, peak, delay]) => {
    const start = t + delay;
    const tone = ctx.createOscillator();
    tone.type = "sine";
    tone.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);
    tone.connect(gain).connect(ctx.destination);
    tone.start(start);
    tone.stop(start + 1.7);
  });
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
 * The progress meter full, just before the lock opens: warmer and longer,
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
