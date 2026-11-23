/** Bloom's hooks and the Sticker as a test controls them: reduced motion and screen visibility. */
export const runtime = { reducedMotion: false, screenVisible: true };
export function usePrefersReducedMotion(): boolean {
  return runtime.reducedMotion;
}
export function useScreenVisible(): boolean {
  return runtime.screenVisible;
}
export const Sticker = 'Sticker';
export function mergeRefs<T>(
  refs: Array<((node: T | null) => void) | { current: T | null } | null | undefined>,
) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }
  };
}
