import type { CanvasRect } from './types';

/** Window coordinates, intersected with actual clipping ancestors. */
export function visibleCanvasWindow(host: HTMLElement): CanvasRect {
  const visual = window.visualViewport;
  let left = visual?.offsetLeft ?? 0;
  let top = visual?.offsetTop ?? 0;
  let right = left + (visual?.width ?? window.innerWidth);
  let bottom = top + (visual?.height ?? window.innerHeight);
  for (let parent = host.parentElement; parent; parent = parent.parentElement) {
    const css = getComputedStyle(parent);
    const clipX = /^(auto|scroll|hidden|clip)$/.test(css.overflowX);
    const clipY = /^(auto|scroll|hidden|clip)$/.test(css.overflowY);
    if (!clipX && !clipY) continue;
    const rect = parent.getBoundingClientRect();
    if (clipX) {
      left = Math.max(left, rect.left + parent.clientLeft);
      right = Math.min(right, rect.left + parent.clientLeft + parent.clientWidth);
    }
    if (clipY) {
      top = Math.max(top, rect.top + parent.clientTop);
      bottom = Math.min(bottom, rect.top + parent.clientTop + parent.clientHeight);
    }
  }
  return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/** Event-driven observation; descendant panel scrolling is not a host movement. */
export function observeCanvasHost(host: HTMLElement, measure: () => void): () => void {
  let pending = 0;
  const schedule = () => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      measure();
    });
  };
  const moved = (event: Event) => {
    const target = event.target;
    if (
      target === document ||
      target === window ||
      (target instanceof Node && target.contains(host))
    )
      schedule();
  };
  document.addEventListener('scroll', moved, true);
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  document.addEventListener('transitionend', moved, true);
  document.addEventListener('animationend', moved, true);
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  for (let parent: HTMLElement | null = host; parent; parent = parent.parentElement)
    observer?.observe(parent);
  return () => {
    if (pending) cancelAnimationFrame(pending);
    observer?.disconnect();
    document.removeEventListener('scroll', moved, true);
    window.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
    document.removeEventListener('transitionend', moved, true);
    document.removeEventListener('animationend', moved, true);
  };
}
