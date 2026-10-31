import { useEffect, useRef, type RefObject } from 'react';
import type { PanelRevealRequest, AppShellPanelDefinition } from './panel-layout-types';
import type { ResolvedPanelTrack } from './panel-layout';

/** Selection can hydrate at any time. Only a new explicit action may move the page. */
export function usePanelReveal({
  rootRef,
  request,
  enabled,
  scope,
  panels,
  tracks,
  reducedMotion,
}: {
  rootRef: RefObject<unknown>;
  request: PanelRevealRequest | undefined;
  enabled: boolean;
  scope: string | null;
  panels: readonly AppShellPanelDefinition[];
  tracks: readonly Pick<ResolvedPanelTrack, 'id' | 'visible'>[];
  reducedMotion: boolean;
}) {
  const consumed = useRef<PanelRevealRequest | undefined>(undefined);
  useEffect(() => {
    if (!enabled || !scope || !request) return;
    if (consumed.current?.id === request.id && consumed.current.requestKey === request.requestKey)
      return;
    if (!tracks.some((track) => track.id === request.id && track.visible)) return;
    const index = panels.findIndex((panel) => panel.id === request.id);
    if (index < 0) return;
    const root = rootRef.current as HTMLElement | null;
    const node = root?.querySelector<HTMLElement>(
      `[data-bloom-panel-owner="${scope}"][data-bloom-panel-index="${index}"]`,
    );
    if (!root || !node?.scrollIntoView) return;
    let cancelled = false;
    const revealWhenSettled = () => {
      if (cancelled) return;
      // Insertion starts at zero width. Revealing that box consumes the action
      // without scrolling, then leaves the expanded panel outside the viewport.
      // Only compositor-owned transitions participate: card animations and
      // scroll timelines must not delay this explicit navigation action.
      const envelope = root.closest<HTMLElement>(`[data-bloom-reading-envelope="${scope}"]`);
      const owners = Array.from(
        root.querySelectorAll<HTMLElement>(`[data-bloom-panel-owner="${scope}"]`),
      );
      if (envelope) owners.push(envelope);
      const transitions = owners.flatMap((owner) =>
        (owner.getAnimations?.() ?? []).filter(
          (animation) =>
            'transitionProperty' in animation &&
            (animation.pending || animation.playState === 'running'),
        ),
      );
      if (transitions.length) {
        void Promise.allSettled(transitions.map((animation) => animation.finished)).then(
          revealWhenSettled,
        );
        return;
      }
      consumed.current = { ...request };
      node.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: reducedMotion ? 'instant' : 'smooth',
      });
    };
    revealWhenSettled();
    return () => {
      cancelled = true;
    };
  }, [rootRef, request, enabled, scope, panels, tracks, reducedMotion]);
}
