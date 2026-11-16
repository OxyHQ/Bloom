import { measureElement, type Virtualizer } from '@tanstack/react-virtual';
import { panelGeometryTransitions } from '../app-shell/panel-transitions';

type RowVirtualizer = Virtualizer<HTMLElement | Window, HTMLDivElement>;

/** A panel's in-flight box is not a new intrinsic size for its retained rows. */
export function createStableRowMeasurement(isActive: () => boolean) {
  const pending = new Map<HTMLDivElement, RowVirtualizer>();
  let generation = 0;
  let waiting = false;

  const transitionsFor = (node: HTMLElement) => {
    const owners: HTMLElement[] = [];
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      if (
        parent.hasAttribute('data-bloom-panel-owner') ||
        parent.hasAttribute('data-bloom-reading-envelope') ||
        parent.hasAttribute('data-bloom-shell-frame')
      )
        owners.push(parent);
    }
    return panelGeometryTransitions(owners);
  };

  const flushWhenSettled = (request: number) => {
    if (request !== generation) return;
    if (!isActive()) {
      pending.clear();
      waiting = false;
      return;
    }
    const animations = new Set(
      [...pending.keys()].filter((node) => node.isConnected).flatMap(transitionsFor),
    );
    if (animations.size) {
      void Promise.allSettled([...animations].map((animation) => animation.finished)).then(() =>
        flushWhenSettled(request),
      );
      return;
    }
    const rows = [...pending];
    pending.clear();
    waiting = false;
    for (const [node, instance] of rows) {
      if (!node.isConnected || node.getBoundingClientRect().width <= 0) continue;
      const index = instance.indexFromElement(node);
      if (index < 0 || index >= instance.options.count) continue;
      const key = instance.options.getItemKey(index);
      if (instance.elementsCache.get(key) !== node) continue;
      // A final RO entry can arrive before transition.finished. Re-read the
      // settled box once; measureElement's no-entry path intentionally caches.
      instance.resizeItem(index, node.offsetHeight);
    }
  };

  return {
    measure(
      node: HTMLDivElement,
      entry: ResizeObserverEntry | undefined,
      instance: RowVirtualizer,
    ) {
      const index = instance.indexFromElement(node);
      const key = instance.options.getItemKey(index);
      const previous = instance.itemSizeCache.get(key) ?? instance.options.estimateSize(index);
      if (!isActive()) return previous;
      const width = entry?.borderBoxSize?.[0]?.inlineSize ?? node.getBoundingClientRect().width;
      // Keep observing: the next nonzero box reports itself without a timer.
      if (width <= 0) return previous;
      if (transitionsFor(node).length) {
        pending.set(node, instance);
        if (!waiting) {
          waiting = true;
          flushWhenSettled(generation);
        }
        return previous;
      }
      pending.delete(node);
      return measureElement(node, entry, instance);
    },
    cancel() {
      generation++;
      pending.clear();
      waiting = false;
    },
  };
}
