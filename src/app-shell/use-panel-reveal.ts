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
  tracks: readonly ResolvedPanelTrack[];
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
    const node = (rootRef.current as HTMLElement | null)?.querySelector<HTMLElement>(
      `[data-bloom-panel-owner="${scope}"][data-bloom-panel-index="${index}"]`,
    );
    if (!node?.scrollIntoView) return;
    consumed.current = { ...request };
    node.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: reducedMotion ? 'instant' : 'smooth',
    });
  }, [rootRef, request, enabled, scope, panels, tracks, reducedMotion]);
}
