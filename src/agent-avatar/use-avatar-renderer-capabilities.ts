/** SVG shares numeric frame work across independently laid-out avatars on every platform.
 * Explicit opt-out remains available; reduced motion belongs to each avatar instance. */
export function useAvatarRendererCapabilities({ enabled = true }: { enabled?: boolean } = {}): {
  sharedLiveRendering: boolean;
} {
  return { sharedLiveRendering: enabled };
}
