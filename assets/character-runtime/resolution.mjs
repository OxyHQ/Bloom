// Tiny chat avatars do not need the same backing resolution as a profile/editor
// preview. Bound fragment work and atlas copies while retaining full-size detail.
export function characterPixels(
  canvas,
  dpr = globalThis.devicePixelRatio || 1,
) {
  const size = Math.max(1, Math.min(canvas.clientWidth, canvas.clientHeight));
  const scale = size <= 64 ? 1 : size <= 128 ? 1.5 : 2;
  return Math.max(64, Math.min(512, Math.round(size * Math.min(dpr, scale))));
}
