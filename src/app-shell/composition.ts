import type { AppShellProps } from './types';
import type { AppShellPanelDefinition, AppShellPanelLayout } from './panel-layout-types';

/** Semantic structure, independent of the material used to present it. */
export type AppShellLayout =
  | 'workspace'
  | 'collection-detail'
  | 'feed'
  | 'deck'
  | 'catalog'
  | 'map-browser';
export type AppShellPresentation = 'continuous' | 'framed' | 'floating';
export type AppShellPanelRole =
  | 'main'
  | 'collection'
  | 'detail'
  | 'inspector'
  | 'context'
  | 'canvas';
export interface AppShellComposition {
  family?: AppShellLayout;
  presentation?: AppShellPresentation;
}

const FAMILY = {
  workspace: {
    variant: 'dashboard',
    flow: 'bounded',
    mode: 'split',
    gutter: 12,
    navigationGap: 12,
  },
  'collection-detail': {
    variant: 'dashboard',
    flow: 'bounded',
    mode: 'split',
    gutter: 12,
    navigationGap: 12,
  },
  feed: { variant: 'feed', flow: 'document', mode: 'split', gutter: 8, navigationGap: 0 },
  deck: { variant: 'feed', flow: 'bounded', mode: 'deck', gutter: 8, navigationGap: 0 },
  catalog: { variant: 'feed', flow: 'document', mode: 'split', gutter: 8, navigationGap: 4 },
  'map-browser': {
    variant: 'dashboard',
    flow: 'bounded',
    mode: 'split',
    gutter: 12,
    navigationGap: 12,
  },
} as const;

/** Undefined always defers, including object-spread props from adapters. */
function explicit<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

/** One resolution path for root descriptors, route groups and local groups. */
export function resolvePanelComposition(
  layout: AppShellPanelLayout,
  inherited: AppShellComposition = {},
): AppShellPanelLayout {
  const family = layout.family ?? inherited.family;
  const presentation = layout.presentation ?? inherited.presentation;
  if (!family && !presentation && !layout.panels.some((panel) => panel.role || panel.group))
    return layout;
  const recipe = family ? FAMILY[family] : undefined;
  const panels = layout.panels.map((panel): AppShellPanelDefinition => {
    const role = panel.role;
    const defaults: Partial<AppShellPanelDefinition> =
      role === 'collection'
        ? { width: 380, minWidth: 320, maxWidth: 480, resizable: true }
        : role === 'inspector'
          ? { width: 320, minWidth: 280, maxWidth: 420 }
          : role === 'context'
            ? { width: 320, minWidth: 240, hideBelow: 'xl' }
            : role === 'canvas'
              ? { minWidth: 380, span: 1 }
              : role === 'main' || role === 'detail'
                ? { minWidth: 320, span: 1 }
                : {};
    if (panel.span !== undefined) {
      delete defaults.width;
      delete defaults.maxWidth;
    }
    if (layout.axis === 'vertical') {
      delete defaults.width;
      delete defaults.minWidth;
      delete defaults.maxWidth;
    }
    if (role === 'inspector' && panel.open !== undefined) {
      if (!panel.onOpenChange || !panel.label) {
        throw new Error(
          'Bloom inspector: controlled open requires onOpenChange and an accessible label.',
        );
      }
      if (panel.visible !== undefined && panel.visible !== panel.open) {
        throw new Error(
          'Bloom inspector: open and visible must agree; prefer open as the visibility owner.',
        );
      }
      defaults.visible = panel.open;
      defaults.floating = {
        below: 'lg',
        whenConstrained: true,
        placement: 'end',
        label: panel.label,
        ...explicit(panel.floating ?? {}),
        open: panel.open,
        onOpenChange: panel.onOpenChange,
      };
    }
    return {
      ...defaults,
      ...explicit(panel),
      ...(role === 'inspector' && panel.open !== undefined
        ? { visible: panel.open, floating: defaults.floating }
        : {}),
      ...(panel.group
        ? { group: resolvePanelComposition(panel.group, { family, presentation }) }
        : {}),
    };
  });
  if (presentation === 'continuous' && layout.appearance === 'separated') {
    throw new Error(
      'Bloom continuous composition cannot use separated surfaces. Use joined/plain, or a local framed presentation.',
    );
  }
  return {
    mode: recipe?.mode ?? 'split',
    flow: recipe?.flow ?? 'bounded',
    ...(family === 'collection-detail' ? { collapseBelow: 'lg' as const } : {}),
    appearance: presentation === 'continuous' ? 'joined' : 'separated',
    ...explicit(layout),
    family,
    presentation,
    panels,
  };
}

/** Legacy props are accepted at this boundary and resolved once, before any renderer runs. */
export function resolveAppShellComposition(props: AppShellProps): AppShellProps {
  if (!props.layout && !props.presentation) {
    if (!props.panelLayout) return props;
    const panelLayout = resolvePanelComposition(props.panelLayout);
    return panelLayout === props.panelLayout ? props : { ...props, panelLayout };
  }
  const family = props.layout ?? 'workspace';
  const presentation = props.presentation ?? 'framed';
  const recipe = FAMILY[family];
  if (presentation === 'continuous') {
    if (
      (props.gutter !== undefined && props.gutter !== 0) ||
      (props.navigationGap !== undefined && props.navigationGap !== 0) ||
      props.framedFrom !== undefined ||
      props.variant === 'canvas' ||
      props.sidebar?.surface === 'card' ||
      Object.values(props.frameInset ?? {}).some((value) => value !== undefined && value !== 0)
    ) {
      throw new Error(
        'Bloom continuous composition owns its zero outer frame. Remove nonzero gutter/navigationGap/frameInset, framedFrom, card sidebar or canvas variant overrides, or select framed presentation.',
      );
    }
  }
  const continuous = presentation === 'continuous';
  const result: AppShellProps = {
    variant: recipe.variant,
    safeArea: true,
    panels: true,
    scroll: recipe.flow === 'document' || family === 'deck' ? 'page' : 'fixed',
    navFrom: 'md',
    navigationAlign: recipe.variant === 'feed' ? 'content' : 'edge',
    contentMaxWidth: recipe.variant === 'dashboard' ? 'none' : undefined,
    gutter: continuous ? 0 : recipe.gutter,
    navigationGap: continuous ? 0 : recipe.navigationGap,
    ...explicit(props),
    layout: family,
    presentation,
    sidebar: props.sidebar
      ? {
          surface: continuous
            ? 'docked'
            : presentation === 'floating'
              ? 'card'
              : recipe.variant === 'feed'
                ? 'plain'
                : 'docked',
          ...explicit(props.sidebar),
        }
      : undefined,
  };
  if (props.panelLayout)
    result.panelLayout = resolvePanelComposition(props.panelLayout, { family, presentation });
  return result;
}

/** Declarative diagnostics. Actual measured visibility is exposed by useAppShellPanel. */
export function explainAppShellComposition(props: AppShellProps) {
  const resolved = resolveAppShellComposition(props);
  return {
    phase: 'declaration' as const,
    measured: false as const,
    precedence: [
      'explicit defined value',
      'presentation constraint',
      'role/family default',
      'legacy default',
    ],
    family: resolved.layout ?? 'legacy',
    presentation: resolved.presentation ?? 'legacy',
    frame: {
      gutter: resolved.gutter,
      navigationGap: resolved.navigationGap,
      sources: {
        gutter:
          props.gutter !== undefined
            ? 'explicit'
            : resolved.presentation === 'continuous'
              ? 'presentation'
              : resolved.layout
                ? 'family'
                : 'legacy',
        navigationGap:
          props.navigationGap !== undefined
            ? 'explicit'
            : resolved.presentation === 'continuous'
              ? 'presentation'
              : resolved.layout
                ? 'family'
                : 'legacy',
      },
      source:
        resolved.presentation === 'continuous'
          ? 'presentation'
          : props.gutter !== undefined
            ? 'explicit'
            : resolved.layout
              ? 'family'
              : 'legacy',
    },
    owners: { frame: 'AppShell', surfaces: 'panel group', scroll: 'Screen', state: 'application' },
    panels:
      resolved.panelLayout?.panels.map((panel) => ({
        id: panel.id,
        role: panel.role ?? 'custom',
        minWidth: panel.minWidth,
        visible: panel.visible ?? true,
        ownership: { identity: panel.id, navigation: 'panel', contentState: 'application' },
        reason: panel.floating
          ? 'floating is eligible below its declared threshold; whenConstrained also responds to available group capacity'
          : 'the existing panel solver compares available group capacity with declared minimum sizes',
        adaptation: panel.floating
          ? 'sheet below threshold or when constrained'
          : 'active panel when constrained',
        threshold: panel.floating?.below ?? resolved.panelLayout?.collapseBelow,
      })) ?? [],
  };
}
