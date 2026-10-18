import { isMuted } from "./speech";

/*
  The game's few small sounds, made in the browser (Web Audio) so there
  are no sound files to download. The speaker switch in the corner mutes
  them along with reading aloud.

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
