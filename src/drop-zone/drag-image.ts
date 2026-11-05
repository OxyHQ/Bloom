import type { DragImageOptions } from './types';

/**
 * The image an HTML5 drag shows (`DataTransfer.setDragImage`), on the web.
 * Native has no HTML5 drag: the platform's drag draws its image from the
 * dragged view (`PlatformDragRequest`'s `previewRef` and `count`), so this
 * does nothing there.
 */
export function setDragImage(
  _transfer: DataTransfer | null,
  _element: Element | null,
  _options: DragImageOptions,
): void {}
