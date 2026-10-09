export interface VisibilityRect { x: number; y: number; width: number; height: number }
export function validVisibilityRect(rect: VisibilityRect): boolean {
  return Object.values(rect).every(Number.isFinite) && rect.width > 0 && rect.height > 0;
}
export function intersectionRatio(target: VisibilityRect, clips: readonly VisibilityRect[]): number {
  if (!validVisibilityRect(target) || clips.some((clip) => !validVisibilityRect(clip))) return 0;
  let left = target.x, top = target.y, right = left + target.width, bottom = top + target.height;
  for (const clip of clips) {
    left = Math.max(left, clip.x); top = Math.max(top, clip.y);
    right = Math.min(right, clip.x + clip.width); bottom = Math.min(bottom, clip.y + clip.height);
  }
  if (left === target.x && top === target.y && right === target.x + target.width && bottom === target.y + target.height) return 1;
  return Math.max(0, right - left) * Math.max(0, bottom - top) / (target.width * target.height);
}
export function visibilityThreshold(value = 0): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Bloom visibility threshold must be between 0 and 1.');
  return value;
}
