/** Keep focused controls inside their horizontal owner without scrolling the document. */
export function revealHorizontalFocus(scroller: HTMLElement, target: Element): void {
  if (!scroller.contains(target) || target === scroller) return;
  const viewport = scroller.getBoundingClientRect();
  const control = target.getBoundingClientRect();
  if (viewport.width <= 0 || control.width <= 0 || scroller.clientWidth <= 0) return;
  const scale = scroller.offsetWidth > 0 ? viewport.width / scroller.offsetWidth : 1;
  const left = viewport.left + scroller.clientLeft * scale;
  const right = left + scroller.clientWidth * scale;
  // An oversized field already spanning both edges cannot fit; keep its caret's
  // current view instead of alternating between its two edges on every resize.
  if (control.left < left && control.right > right) return;
  const delta =
    control.left < left ? control.left - left : control.right > right ? control.right - right : 0;
  if (Math.abs(delta) < 1) return;
  // Physical rect deltas also work with RTL's negative scrollLeft. Only this
  // scroller moves; scrollIntoView would also move outer panels and the document.
  // RNW replaces the element's scrollTo with its { x, y } imperative API.
  // Calling that overload with DOM { left, top } resets the offset to zero.
  const nativeScrollTo: ((this: Element, options: ScrollToOptions) => void) | undefined =
    scroller.ownerDocument.defaultView?.Element.prototype.scrollTo;
  const leftOffset = scroller.scrollLeft + delta / scale;
  if (nativeScrollTo) {
    nativeScrollTo.call(scroller, {
      left: leftOffset,
      top: scroller.scrollTop,
      behavior: 'instant',
    });
  } else {
    // Non-browser DOM implementations may expose only the offset property.
    scroller.scrollLeft = leftOffset;
  }
}

export function observeHorizontalFocus(scroller: HTMLElement): () => void {
  const view = scroller.ownerDocument.defaultView;
  if (!view) return () => {};
  let frame: number | null = null;
  const schedule = () => {
    if (frame !== null) view.cancelAnimationFrame(frame);
    frame = view.requestAnimationFrame(() => {
      frame = null;
      const focused = scroller.ownerDocument.activeElement;
      if (focused) revealHorizontalFocus(scroller, focused);
    });
  };
  // Run after the browser's own focus scrolling. Browsers may consider a
  // partially visible button sufficient; the whole control must remain usable.
  scroller.addEventListener('focusin', schedule);
  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  resize?.observe(scroller);
  schedule();
  return () => {
    scroller.removeEventListener('focusin', schedule);
    resize?.disconnect();
    if (frame !== null) view.cancelAnimationFrame(frame);
  };
}
