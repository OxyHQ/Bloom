import { useEffect, useState, type RefObject } from 'react';
import { Platform } from 'react-native';
import { parseRgba } from '../theme/color-utils';

/** Opt into the nearest material's baked paint; an explicit ordinary fill wins by default. */
export function usePaintedSurfaceFill(
  ref: RefObject<unknown>,
  fallback: string,
  enabled = false,
): string {
  const [paint, setPaint] = useState<string>();
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) {
      setPaint(undefined);
      return;
    }
    let observer: MutationObserver | undefined;
    const read = () => {
      observer?.disconnect();
      let ancestor = ref.current as HTMLElement | null;
      let layer: HTMLElement | undefined;
      while (ancestor?.children) {
        // Only direct child changes matter: list scrolling and row edits are not observed.
        observer?.observe(ancestor, { childList: true });
        layer = Array.from(ancestor.children).find((child) =>
          child.hasAttribute('data-bloom-paint-layer'),
        ) as HTMLElement | undefined;
        if (layer) break;
        const style = getComputedStyle(ancestor);
        if (
          (parseRgba(style.backgroundColor)?.a ?? 0) >= 1 ||
          (style.backgroundImage && style.backgroundImage !== 'none')
        ) {
          // An opaque ordinary panel hides any more distant material behind it.
          observer?.observe(ancestor, {
            childList: true,
            attributes: true,
            attributeFilter: ['style', 'class'],
          });
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (layer)
        observer?.observe(layer, {
          attributes: true,
          attributeFilter: ['style', 'data-bloom-material'],
        });
      const baked =
        layer?.getAttribute('data-bloom-material') === 'baked'
          ? getComputedStyle(layer).getPropertyValue('--bloom-surface-baked-body').trim()
          : '';
      setPaint(baked || undefined);
    };
    if (typeof MutationObserver !== 'undefined') observer = new MutationObserver(read);
    read();
    return () => observer?.disconnect();
  }, [ref, fallback, enabled]);
  return enabled ? (paint ?? fallback) : fallback;
}
