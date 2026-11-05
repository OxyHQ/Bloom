import { BADGE_COLOR, BADGE_HEIGHT, badgeText, STACK_STEP, stackLayers } from './shared';
import type { DragImageOptions } from './types';

/**
 * Sets an HTML5 drag's image (`DataTransfer.setDragImage`) from the dragged
 * element as it looks, the point pressed in it under the pointer, as the
 * platform's drag draws its image from the dragged view on OxyOS. For one item
 * it is the element itself; for several, the element over copies of it,
 * stacked down and to the right, with the count on a red badge at its top
 * right, as a Mac's drag of several files. The browser draws it translucent.
 *
 * Call it in `dragstart`: the stack is built off screen, given to the
 * browser, which takes its picture at once, and removed after.
 */
export function setDragImage(
  transfer: DataTransfer | null,
  element: Element | null,
  { x, y, count = 1 }: DragImageOptions,
): void {
  if (!transfer || !element || typeof transfer.setDragImage !== 'function') return;
  const layers = stackLayers(count);
  if (layers === 0) {
    transfer.setDragImage(element, x, y);
    return;
  }
  const { width, height } = element.getBoundingClientRect();
  // Room above and to the right for the badge, which overhangs the item's corner by half.
  const inset = BADGE_HEIGHT / 2;
  const stack = document.createElement('div');
  stack.setAttribute('aria-hidden', 'true');
  Object.assign(stack.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0px',
    width: `${width + layers * STACK_STEP + inset}px`,
    height: `${height + layers * STACK_STEP + inset}px`,
    pointerEvents: 'none',
  });
  for (let layer = layers; layer >= 0; layer -= 1) {
    const copy = element.cloneNode(true) as HTMLElement;
    copy.removeAttribute('id');
    Object.assign(copy.style, {
      position: 'absolute',
      left: `${layer * STACK_STEP}px`,
      top: `${inset + layer * STACK_STEP}px`,
      width: `${width}px`,
      height: `${height}px`,
      margin: '0px',
      // The copies behind fade as they go, as a pile seen from above.
      opacity: String(1 - layer * 0.25),
    });
    stack.appendChild(copy);
  }
  const badge = document.createElement('span');
  badge.textContent = badgeText(count);
  Object.assign(badge.style, {
    position: 'absolute',
    top: '0px',
    left: `${width - inset}px`,
    minWidth: `${BADGE_HEIGHT}px`,
    height: `${BADGE_HEIGHT}px`,
    padding: '0px 6px',
    boxSizing: 'border-box',
    borderRadius: `${BADGE_HEIGHT / 2}px`,
    background: BADGE_COLOR,
    color: '#ffffff',
    font: '600 12px/20px system-ui, -apple-system, sans-serif',
    textAlign: 'center',
  });
  stack.appendChild(badge);
  document.body.appendChild(stack);
  transfer.setDragImage(stack, x, y + inset);
  // The browser took its picture in setDragImage; the stack is not left in the page.
  setTimeout(() => stack.remove(), 0);
}
