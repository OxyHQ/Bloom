/** Bloom's hooks and the Sticker as a test controls them: reduced motion and screen visibility. */
export const runtime = { reducedMotion: false, screenVisible: true };
export function usePrefersReducedMotion(): boolean {
  return runtime.reducedMotion;
}
export function useScreenVisible(): boolean {
  return runtime.screenVisible;
}
export const Sticker = 'Sticker';
