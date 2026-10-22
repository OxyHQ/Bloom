import { useLayoutEffect, useInsertionEffect, useMemo, useState } from 'react';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { BREAKPOINTS } from '../styles/breakpoints';
import type { SidebarMetrics } from '../sidebar/metrics';
import { resolveSidebarGeometry } from '../sidebar/geometry';
import { SIDEBAR_RAIL_WIDTH } from '../sidebar/SidebarRail';
import { breakpointPx } from './constants';
import { panelEnvelope } from './panel-layout';
import type { AppShellPanelLayout } from './panel-layout-types';
import type { AppShellEngineProps } from './types';

type Options = Pick<
  AppShellEngineProps,
  | 'sidebar'
  | 'navFrom'
  | 'navExpandedFrom'
  | 'framedFrom'
  | 'panels'
  | 'variant'
  | 'navigationAlign'
  | 'topBar'
  | 'topBarVisibility'
> & {
  metrics: SidebarMetrics;
  layout: AppShellPanelLayout;
  gap: number;
  gutter: number;
  navigationGap: number;
  contentWidth: number;
  userCollapsed: boolean;
};
export interface CssShellState {
  mode: 'panel' | 'rail' | 'drawer';
  collapsed: boolean;
  capacityCollapsed: boolean;
  framed: boolean;
  small: boolean;
}

/** Descriptor compilation only: container queries resolve the live shell width. */
export function shellLayoutCss(scope: string, options: Options) {
  const { sidebar, metrics, layout, gap, gutter, navigationGap } = options;
  const root = `[data-bloom-layout="${scope}"]`;
  const frame = `${root} [data-bloom-shell-frame="${scope}"]`;
  const hasNav = sidebar != null && options.variant !== 'focus';
  const automatic =
    options.navFrom === undefined &&
    options.navExpandedFrom === undefined &&
    sidebar?.variant === undefined;
  const panelFrom = options.navExpandedFrom ?? (automatic ? 'lg' : undefined);
  const navFrom =
    options.navFrom ??
    (automatic ? 'md' : panelFrom !== undefined || sidebar?.variant === 'rail' ? 'sm' : 'lg');
  const geometry = resolveSidebarGeometry(
    metrics,
    sidebar?.surface ?? 'card',
    !!sidebar?.primaryAction,
    sidebar?.content != null,
  );
  const railWidth =
    sidebar?.railWidth === undefined || !Number.isFinite(sidebar.railWidth)
      ? SIDEBAR_RAIL_WIDTH
      : Math.max(64, sidebar.railWidth);
  const thresholds = new Set([0, BREAKPOINTS.sm, breakpointPx(navFrom), BREAKPOINTS.md]);
  if (panelFrom !== undefined) thresholds.add(breakpointPx(panelFrom));
  if (options.framedFrom !== undefined) thresholds.add(breakpointPx(options.framedFrom));
  for (const panel of layout.panels) {
    if (panel.hideBelow !== undefined) thresholds.add(breakpointPx(panel.hideBelow));
    if (panel.floating) thresholds.add(breakpointPx(panel.floating.below));
  }
  if (typeof layout.axis === 'object')
    for (const key of Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[])
      if (layout.axis[key]) thresholds.add(BREAKPOINTS[key]);
  const ranges = [...thresholds].sort((a, b) => a - b);
  let css = `${frame}{padding-block-start:var(--bloom-frame-top)!important;padding-block-end:var(--bloom-frame-bottom)!important;padding-inline-start:var(--bloom-frame-alignment, var(--bloom-frame-start))!important;padding-inline-end:var(--bloom-frame-end)!important;gap:var(--bloom-nav-gap)!important;transition:padding-inline-start 380ms cubic-bezier(.4,0,.2,1)}
${root} [data-bloom-reading-envelope="${scope}"]{padding-block:var(--bloom-body-gutter)!important}
${root} [data-bloom-shell-nav="${scope}"]{display:var(--bloom-nav-display)!important;width:var(--bloom-nav-width)!important;flex-shrink:0;transition:width 380ms cubic-bezier(.4,0,.2,1)}
${root} [data-bloom-shell-nav="${scope}"] [data-bloom-shell-nav-mode="panel"]{display:var(--bloom-panel-nav-display)!important}
${root} [data-bloom-shell-nav="${scope}"] [data-bloom-shell-nav-mode="rail"]{display:var(--bloom-rail-nav-display)!important}
${root} [data-bloom-shell-nav="${scope}"] [data-bloom-shell-nav-mode] > *{width:100%!important}
@media(prefers-reduced-motion:reduce){${frame},${root} [data-bloom-shell-nav="${scope}"]{transition:none}}
`;
  for (let index = 0; index < ranges.length; index++) {
    const width = ranges[index]!;
    const upper = ranges[index + 1];
    const inFlow = hasNav && width >= breakpointPx(navFrom);
    const mode = !inFlow
      ? 'drawer'
      : panelFrom !== undefined
        ? width >= breakpointPx(panelFrom)
          ? 'panel'
          : 'rail'
        : (sidebar?.variant ?? 'panel');
    const framed =
      !!options.panels &&
      options.variant !== 'canvas' &&
      (options.framedFrom !== undefined
        ? width >= breakpointPx(options.framedFrom)
        : hasNav
          ? inFlow
          : width >= BREAKPOINTS.md);
    const topBarShown =
      options.topBar != null && (options.topBarVisibility === 'always' || !inFlow);
    const aligned =
      options.navigationAlign === 'content' &&
      (options.variant === 'feed' || options.variant === 'focus');
    const plain = aligned && sidebar?.surface === 'plain' && !topBarShown;
    const flush = inFlow && (sidebar?.surface === 'docked' || plain);
    const outer = framed || (inFlow && !flush) ? gutter : 0;
    const rowGap = !inFlow ? 0 : sidebar?.surface === 'docked' ? outer : navigationGap;
    const force = sidebar?.collapsed ?? (options.userCollapsed ? true : undefined);
    const baseCollapsed = force ?? false;
    // A centered flex row loses all free space as soon as Deck overflows it.
    // Express that alignment as a length so the browser can interpolate the
    // same frame in both directions, including RTL, without measured FLIP boxes.
    const alignmentEnvelope =
      layout.mode === 'deck' ? '100cqw' : `${panelEnvelope(layout, width, gap)}px`;
    const alignment = aligned
      ? `max(var(--bloom-frame-start), calc((100cqw - var(--bloom-nav-width) - var(--bloom-nav-gap) - ${alignmentEnvelope} - var(--bloom-frame-end) + var(--bloom-frame-start)) / 2))`
      : 'var(--bloom-frame-start)';
    const state = (collapsed: boolean, capacity: boolean) =>
      `${frame}{--bloom-nav-mode:${mode};--bloom-nav-collapsed:${collapsed ? 1 : 0};--bloom-nav-capacity:${capacity ? 1 : 0};--bloom-framed:${framed ? 1 : 0};--bloom-small:${width >= BREAKPOINTS.sm ? 1 : 0};--bloom-nav-display:${inFlow ? 'flex' : 'none'};--bloom-panel-nav-display:${mode === 'panel' ? 'flex' : 'none'};--bloom-rail-nav-display:${mode === 'rail' ? 'flex' : 'none'};--bloom-nav-width:${!inFlow ? 0 : mode === 'rail' ? railWidth : collapsed ? geometry.collapsedWidth : metrics.expanded}px;--bloom-frame-top:${flush ? 0 : outer}px;--bloom-frame-bottom:${flush ? 0 : outer}px;--bloom-frame-start:${flush ? 0 : outer}px;--bloom-frame-end:${outer}px;--bloom-body-gutter:${flush ? outer : 0}px;--bloom-nav-gap:${rowGap}px; --bloom-frame-alignment:${alignment};justify-content:flex-start!important}`;
    const query = `(min-width:${width}px)${upper === undefined ? '' : ` and (width < ${upper}px)`}`;
    let rules = state(baseCollapsed, false);
    if (!framed)
      rules += `${root} [data-bloom-reading-envelope="${scope}"]{--bloom-reading-envelope:100%!important}
${root} [data-bloom-panel-group="${scope}"] [data-bloom-panel-mask],${root} [data-bloom-panel-group="${scope}"] [data-bloom-panel-border]{display:none!important}
${root} [data-bloom-panel-group="${scope}"] [data-bloom-panel],${root} [data-bloom-panel-group="${scope}"] [data-bloom-panel-content]{border-radius:0!important;--bloom-panel-sticky-top:0px!important}`;
    if (mode === 'panel') {
      const preferred =
        layout.mode === 'deck' ? options.contentWidth : panelEnvelope(layout, width, gap);
      const required = metrics.expanded + preferred + navigationGap + gutter * 2;
      rules += `@container ${scope} (width < ${required}px){${state(force ?? true, true)}}`;
    }
    css += `@container ${scope} ${query}{${rules}}\n`;
  }
  return css;
}

export function useCssShellLayout(scope: string | null, options: Options): CssShellState | null {
  const [state, setState] = useState<CssShellState>({
    mode: 'panel',
    collapsed: false,
    capacityCollapsed: false,
    framed: true,
    small: true,
  });
  const css = useMemo(() => (scope ? shellLayoutCss(scope, options) : ''), [scope, options]);
  useInsertionEffect(() => {
    if (scope) adoptStyleSheet(`${scope}-shell`, css);
  }, [scope, css]);
  useLayoutEffect(() => {
    if (!scope || typeof document === 'undefined') return;
    const root = document.querySelector<HTMLElement>(`[data-bloom-layout="${scope}"]`);
    if (!root) return;
    const read = () => {
      const frame = root.querySelector<HTMLElement>(`[data-bloom-shell-frame="${scope}"]`);
      if (!frame) return;
      const style = getComputedStyle(frame);
      const value = (key: string) => style.getPropertyValue(key).trim();
      const mode = value('--bloom-nav-mode');
      if (mode !== 'panel' && mode !== 'rail' && mode !== 'drawer') return;
      const next: CssShellState = {
        mode,
        collapsed: value('--bloom-nav-collapsed') === '1',
        capacityCollapsed: value('--bloom-nav-capacity') === '1',
        framed: value('--bloom-framed') === '1',
        small: value('--bloom-small') === '1',
      };
      setState((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(root);
    return () => observer.disconnect();
  }, [scope, css]);
  return scope ? state : null;
}
