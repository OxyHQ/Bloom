/** The handle's measured geometry, px. */
export const RESIZE_HANDLE = {
  grip: { thickness: 20 },
  /** A split's divider: the bar, and a strip of the 7px gap plus 2px of each pane. */
  pill: { length: 36, depth: 4, thickness: 11 },
} as const;
/** The pill's presence over the foreground colour: under the pointer or focus, and while dragging. */
export const PILL_HOVER_OPACITY = 0.32;
export const PILL_DRAG_OPACITY = 0.55;

const PILL_ROOT = '[data-bloom-resize-handle][data-bloom-resize-handle-variant="pill"]';

export const RESIZE_HANDLE_CSS = `
[data-bloom-resize-handle] [data-bloom-resize-handle-pill] {
  opacity: 0;
  transition: opacity 150ms ease;
}
[data-bloom-resize-handle]:hover [data-bloom-resize-handle-pill],
[data-bloom-resize-handle-pill="dragging"],
[data-bloom-resize-handle-dragging="on"] [data-bloom-resize-handle-pill] { opacity: 1; }
[data-bloom-resize-handle] { cursor: col-resize; touch-action: none; outline: none; }
[data-bloom-resize-handle][aria-orientation="horizontal"] { cursor: row-resize; }
[data-bloom-resize-handle]:focus-visible [data-bloom-resize-handle-pill] { opacity: 1; outline: 2px solid var(--color-ring, currentColor); outline-offset: 2px; }
${PILL_ROOT} [data-bloom-resize-handle-pill] { opacity: 0; }
${PILL_ROOT}:hover [data-bloom-resize-handle-pill],
${PILL_ROOT}:focus-visible [data-bloom-resize-handle-pill] { opacity: ${PILL_HOVER_OPACITY}; }
${PILL_ROOT}[data-bloom-resize-handle-dragging="on"] [data-bloom-resize-handle-pill],
${PILL_ROOT} [data-bloom-resize-handle-pill="dragging"] { opacity: ${PILL_DRAG_OPACITY}; }
@media (prefers-reduced-motion: reduce) { [data-bloom-resize-handle] [data-bloom-resize-handle-pill] { transition: none; } }
`;
