import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollRestorationScope, useOptionalScrollRestorationContext } from '../scroll/context';
import { ScreenHostContext } from '../screen/context';
import type { ScrollRouterAdapter, ScreenFocusEffect } from '../scroll/types';
import type {
  PanelNavigationController,
  PanelNavigationEntry,
  PanelNavigationOptions,
  PanelNavigationState,
} from './panel-layout-types';

const NavigationContext = createContext<PanelNavigationController | null>(null);
const FocusContext = createContext({ id: '', active: true });
export function useOptionalPanelNavigation(): PanelNavigationController | null {
  return useContext(NavigationContext);
}
export function usePanelNavigation(): PanelNavigationController {
  const value = useOptionalPanelNavigation();
  if (!value) throw new Error('usePanelNavigation requires a panel with navigation.');
  return value;
}
const memoryAdapter: ScrollRouterAdapter = {
  useScreenContentId() {
    const scope = useContext(FocusContext);
    return scope.active ? scope.id : null;
  },
  useScreenFocusEffect(effect) {
    const { active, id } = useContext(FocusContext);
    useEffect(() => (active ? effect() : undefined), [active, id, effect]);
  },
};

export function normalizePanelHistory(state: PanelNavigationState): PanelNavigationState {
  const entries = state.entries.length ? state.entries : [{ key: 'root', name: 'root' }];
  const keys = new Set<string>();
  for (const entry of entries) {
    if (!entry.key || keys.has(entry.key))
      throw new Error('Panel navigation entry keys must be nonempty and unique.');
    keys.add(entry.key);
  }
  return {
    entries,
    index: Math.max(
      0,
      Math.min(entries.length - 1, Number.isFinite(state.index) ? Math.floor(state.index) : 0),
    ),
  };
}

export function PanelNavigation({
  id,
  active,
  options,
}: {
  id: string;
  active: boolean;
  options: PanelNavigationOptions;
}) {
  const host = useContext(ScreenHostContext);
  const [own, setOwn] = useState<PanelNavigationState>(() =>
    normalizePanelHistory({ entries: options.initialEntries, index: 0 }),
  );
  const state = normalizePanelHistory(options.state ?? own);
  const contentIds = useMemo(
    () => state.entries.map((entry) => `${id}:${entry.key}`),
    [id, state.entries],
  );
  const latest = useRef(state);
  latest.current = state;
  const serial = useRef(0);
  const change = (next: PanelNavigationState) => {
    next = normalizePanelHistory(next);
    if (options.state === undefined) {
      latest.current = next;
      setOwn(next);
    }
    options.onNavigationChange?.(normalizePanelHistory(next));
  };
  const entryFor = (
    entry: Omit<PanelNavigationEntry, 'key'> & { key?: string },
  ): PanelNavigationEntry => {
    let key = entry.key;
    if (key === undefined)
      do {
        key = `${id}-${++serial.current}`;
      } while (latest.current.entries.some((item) => item.key === key));
    return { ...entry, key };
  };
  const controller: PanelNavigationController = {
    ...state,
    entry: state.entries[state.index]!,
    canGoBack: state.index > 0,
    canGoForward: state.index < state.entries.length - 1,
    push(entry) {
      const current = latest.current;
      const entries = [...current.entries.slice(0, current.index + 1), entryFor(entry)];
      change({ entries, index: entries.length - 1 });
    },
    replace(entry) {
      const current = latest.current;
      change({
        ...current,
        entries: current.entries.map((value, index) =>
          index === current.index ? entryFor(entry) : value,
        ),
      });
    },
    go(delta) {
      if (!Number.isFinite(delta)) return;
      const current = latest.current;
      const index = Math.max(
        0,
        Math.min(current.entries.length - 1, current.index + Math.trunc(delta)),
      );
      if (index !== current.index) change({ ...current, index });
    },
    back() {
      const current = latest.current;
      if (current.index > 0) change({ ...current, index: current.index - 1 });
    },
    forward() {
      const current = latest.current;
      if (current.index < current.entries.length - 1)
        change({ ...current, index: current.index + 1 });
    },
  };
  return (
    <NavigationContext.Provider value={controller}>
      <FocusContext.Provider value={{ id: `${id}:${controller.entry.key}`, active }}>
        <ScrollRestorationScope
          adapter={memoryAdapter}
          contentIds={contentIds}
          {...options.scrollRestoration}
        >
          <ScreenHostContext.Provider value={{ ...host, navigation: controller }}>
            {options.render(controller.entry, controller)}
          </ScreenHostContext.Provider>
        </ScrollRestorationScope>
      </FocusContext.Provider>
    </NavigationContext.Provider>
  );
}

/** Preserve the host router contract, but prevent retained hidden panels from writing offsets. */
export function PanelScrollScope({
  id,
  active,
  children,
}: {
  id: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const parent = useOptionalScrollRestorationContext();
  const adapter = useMemo<ScrollRouterAdapter>(() => {
    const upstream = parent?.adapter;
    return {
      useScreenContentId() {
        const scope = useContext(FocusContext);
        const route = upstream?.useScreenContentId();
        return scope.active ? (route ? `${scope.id}:${route}` : scope.id) : null;
      },
      useScreenFocusEffect(effect: ScreenFocusEffect) {
        const scope = useContext(FocusContext);
        const guarded = React.useCallback(
          () => (scope.active ? effect() : undefined),
          [scope.active, effect],
        );
        if (upstream) upstream.useScreenFocusEffect(guarded);
        else useEffect(guarded, [guarded]);
      },
    };
  }, [parent?.adapter]);
  const focus = useMemo(() => ({ id, active }), [id, active]);
  return (
    <FocusContext.Provider value={focus}>
      <ScrollRestorationScope adapter={adapter}>{children}</ScrollRestorationScope>
    </FocusContext.Provider>
  );
}
