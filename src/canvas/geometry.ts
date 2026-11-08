import type { CanvasInsets, CanvasRect } from './types';
/** Intersect actual host bounds with an occluding viewport, never subtract twice. */
export function canvasVisibleRect(
  width: number,
  height: number,
  screenX: number,
  screenY: number,
  visible?: CanvasRect,
): CanvasRect {
  if (!visible) return { x: 0, y: 0, width: Math.max(0, width), height: Math.max(0, height) };
  const x = Math.min(width, Math.max(0, visible.x - screenX));
  const y = Math.min(height, Math.max(0, visible.y - screenY));
  const right = Math.max(x, Math.min(width, visible.x + visible.width - screenX));
  const bottom = Math.max(y, Math.min(height, visible.y + visible.height - screenY));
  return { x, y, width: right - x, height: bottom - y };
}

/** Translate window safe edges once, even when a host is inset or resized. */
export function canvasSafeArea(
  host: CanvasRect,
  windowSize: { width: number; height: number },
  safe: CanvasInsets,
): CanvasInsets {
  return {
    top: Math.min(host.height, Math.max(0, safe.top - host.y)),
    left: Math.min(host.width, Math.max(0, safe.left - host.x)),
    right: Math.min(host.width, Math.max(0, host.x + host.width - (windowSize.width - safe.right))),
    bottom: Math.min(
      host.height,
      Math.max(0, host.y + host.height - (windowSize.height - safe.bottom)),
    ),
  };
}
