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
@media (prefers-reduced-motion: reduce) { [data-bloom-resize-handle-pill] { transition: none; } }
`;
