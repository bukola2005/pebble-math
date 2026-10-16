/*
  The loaders behind the play session's loading screen. Each one does real
  work and reports real progress; nothing here runs on a timer.
*/

/**
 * Fetches an image. Resolves once it has downloaded.
 *
 * Decoding starts straight away too, so the picture is ready to paint when
 * its <img> mounts, but it isn't waited for: a page that isn't being drawn
 * (a minimised window, a locked tablet) never finishes decoding, and that
 * must not hold the loading screen.
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      image.decode?.().catch(() => {});
      resolve(src);
    };
    image.onerror = () => reject(new Error(`Couldn't load ${src}`));
    image.src = src;
  });
}

/**
 * Downloads a whole file, calling `onProgress(bytesSoFar, totalBytes)` as
 * it arrives, and resolves with a blob: URL for it.
 *
 * The blob URL is the point: the film then plays from the copy already in
 * memory, so it is downloaded exactly once, however the host sets its cache
 * headers.
 */
export async function preloadFile(url, onProgress, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Couldn't load ${url} (${response.status})`);

  const type = response.headers.get("Content-Type") ?? "";
  const total = Number(response.headers.get("Content-Length")) || 0;

  // Without a size or a readable stream we can't count bytes; take it whole.
  if (!total || !response.body) {
    const blob = await response.blob();
    onProgress(blob.size, blob.size);
    return URL.createObjectURL(blob);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(Math.min(received, total), total);
  }
  return URL.createObjectURL(new Blob(chunks, { type }));
}

/**
 * The source a <video> would choose: the first one whose type (with its
 * codecs) the browser says it can play. Null if it can play none of them.
 */
export function pickPlayableSource(sources) {
  const probe = document.createElement("video");
  return sources.find((source) => probe.canPlayType(source.type) !== "") ?? null;
}
