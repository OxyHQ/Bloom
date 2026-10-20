import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import type { View } from 'react-native';
import type { ComponentRef } from 'react';
import {
  clampPanelWidth,
  panelForAxis,
  resizePanelPair,
  type ResolvedPanelTrack,
} from './panel-layout';
import { panelSizeProperty, panelGrowProperty } from './panel-layout-css';
import type { AppShellPanelDefinition, AppShellPanelLayout } from './panel-layout-types';

type Sizes = Readonly<Record<string, number>>;
export interface PanelResizePreview {
  read: () => number;
  update: (size: number) => void;
}

type Drag = {
  id: string;
  key: string;
  root: HTMLElement | null;
  envelope: HTMLElement | null;
  targets: Map<string, { node: HTMLElement; size: string; grow: string }>;
  first: AppShellPanelDefinition;
  next?: AppShellPanelDefinition;
  firstSize: number;
  nextSize: number;
  values?: Sizes;
  properties: Map<CSSStyleDeclaration, Set<string>>;
};

/** Direct gestures own live geometry: CSS on web, shared values on native. Commit once at release. */
export function usePanelResize({
  layout,
  tracks,
  vertical,
  document,
  scope,
  rootRef,
  onCommit,
}: {
  layout: AppShellPanelLayout;
  tracks: readonly ResolvedPanelTrack[];
  vertical: boolean;
  document: boolean;
  scope: string | null;
  rootRef: RefObject<ComponentRef<typeof View> | null>;
  onCommit: (sizes: Sizes) => void;
}) {
  const drag = useRef<Drag | null>(null);
  const previews = useRef(new Map<string, PanelResizePreview>());
  const register = useCallback((id: string, preview: PanelResizePreview) => {
    previews.current.set(id, preview);
    return () => {
      if (previews.current.get(id) === preview) previews.current.delete(id);
    };
  }, []);
  const pending = useRef<Drag | null>(null);
  const interrupted = useRef(false);
  const frame = useRef<number | null>(null);
  const key = JSON.stringify([
    scope,
    vertical,
    layout.mode,
    document,
    tracks.filter((t) => t.visible).map((t) => t.id),
  ]);

  const clear = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const previous = pending.current;
    pending.current = null;
    if (!previous) return;
    previous.properties.forEach((properties, style) =>
      properties.forEach((property) => style.removeProperty(property)),
    );
    // Let the committed geometry paint before restoring responsive transitions.
    frame.current = requestAnimationFrame(() => {
      previous.root?.removeAttribute('data-bloom-panel-resizing');
      frame.current = null;
    });
  };
  const cancel = () => {
    if (drag.current) pending.current = drag.current;
    drag.current = null;
    clear();
  };
  useLayoutEffect(() => {
    if (drag.current && drag.current.key !== key) {
      interrupted.current = true;
      cancel();
    } else if (pending.current) clear();
  });
  useLayoutEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      for (const previous of [drag.current, pending.current]) {
        previous?.properties.forEach((properties, style) =>
          properties.forEach((property) => style.removeProperty(property)),
        );
        previous?.root?.removeAttribute('data-bloom-panel-resizing');
      }
      if (scope)
        (rootRef.current as unknown as HTMLElement | null)?.removeAttribute(
          'data-bloom-panel-resizing',
        );
    },
    [],
  );

  const size = (id: string) => {
    const active = drag.current;
    if (active?.id === id) return active.firstSize;
    if (!scope)
      return (
        previews.current.get(id)?.read() ?? tracks.find((track) => track.id === id)?.width ?? 0
      );
    const index = layout.panels.findIndex((panel) => panel.id === id);
    const node = (rootRef.current as unknown as HTMLElement | null)?.querySelector<HTMLElement>(
      `[data-bloom-panel-owner="${scope}"][data-bloom-panel-index="${index}"]`,
    );
    const bounds = node?.getBoundingClientRect();
    return bounds ? (vertical ? bounds.height : bounds.width) : 0;
  };
  const snapshot = (panel: AppShellPanelDefinition) => {
    const visible = tracks.filter((track) => track.visible);
    const nextId = visible[visible.findIndex((track) => track.id === panel.id) + 1]?.id;
    const next =
      layout.mode !== 'deck' && !(vertical && document)
        ? layout.panels.find((candidate) => candidate.id === nextId)
        : undefined;
    return {
      first: panelForAxis(panel, vertical ? 'vertical' : 'horizontal'),
      next: next ? panelForAxis(next, vertical ? 'vertical' : 'horizontal') : undefined,
      firstSize: size(panel.id),
      nextSize: next ? size(next.id) : 0,
    };
  };
  const control = {
    size,
    register,
    start(panel: AppShellPanelDefinition) {
      if (!rootRef.current) return;
      cancel();
      interrupted.current = false;
      // Cancel the transition-restoration frame before starting a new transaction.
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      const root = scope ? (rootRef.current as unknown as HTMLElement) : null;
      const shell = root?.closest<HTMLElement>(`[data-bloom-layout="${scope}"]`);
      const targets = new Map<string, { node: HTMLElement; size: string; grow: string }>();
      layout.panels.forEach((candidate, index) => {
        const node = root?.querySelector<HTMLElement>(
          `[data-bloom-panel-owner="${scope}"][data-bloom-panel-index="${index}"]`,
        );
        if (node && scope)
          targets.set(candidate.id, {
            node,
            size: panelSizeProperty(scope, index),
            grow: panelGrowProperty(scope, index),
          });
      });
      drag.current = {
        id: panel.id,
        key,
        root,
        envelope:
          layout.mode === 'deck' && !vertical && layout.horizontalScroll !== 'contained'
            ? (shell?.querySelector<HTMLElement>(`[data-bloom-reading-envelope="${scope}"]`) ??
              null)
            : null,
        targets,
        ...snapshot(panel),
        properties: new Map(),
      };
      root?.setAttribute('data-bloom-panel-resizing', vertical ? 'vertical' : 'horizontal');
    },
    resize(panel: AppShellPanelDefinition, requested: number) {
      if (interrupted.current) return;
      const active = drag.current?.id === panel.id ? drag.current : null;
      const { first, next, firstSize, nextSize } = active ?? snapshot(panel);
      const values = next
        ? resizePanelPair(first, next, firstSize, nextSize, requested)
        : { [panel.id]: clampPanelWidth(first, requested) };
      if (!active) {
        onCommit(values);
        return;
      }
      if (
        !active.values &&
        values[panel.id] === firstSize &&
        (!next || values[next.id] === nextSize)
      )
        return;
      if (
        active.values &&
        Object.entries(values).every(([id, value]) => active.values?.[id] === value)
      )
        return;
      active.values = values;
      const write = (style: CSSStyleDeclaration, property: string, content: string) => {
        let properties = active.properties.get(style);
        if (!properties) active.properties.set(style, (properties = new Set()));
        properties.add(property);
        style.setProperty(property, content);
      };
      for (const [id, value] of Object.entries(values)) {
        if (!scope) {
          previews.current.get(id)?.update(value);
          continue;
        }
        const target = active.targets.get(id);
        if (!target) continue;
        write(target.node.style, target.size, `${value}px`);
        write(target.node.style, target.grow, '0');
        if (active.envelope) write(active.envelope.style, target.size, `${value}px`);
      }
    },
    nudge(panel: AppShellPanelDefinition, delta: number) {
      control.start(panel);
      control.resize(panel, control.size(panel.id) + delta);
      control.end();
    },
    end() {
      interrupted.current = false;
      const active = drag.current;
      if (!active) return;
      drag.current = null;
      pending.current = active;
      if (active.values) onCommit(active.values);
      // Also clean up when a controlled host declines the change and never renders.
      frame.current = requestAnimationFrame(clear);
    },
  };
  return control;
}
