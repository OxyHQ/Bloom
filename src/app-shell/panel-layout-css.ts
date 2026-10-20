import { createContext } from 'react';
import { BREAKPOINTS } from '../styles/breakpoints';
import { breakpointPx } from './constants';
import {
  panelEnvelope,
  resolvePanelAxis,
  eligiblePanels,
  DEFAULT_PANEL_WIDTH,
} from './panel-layout';
import type { AppShellPanelLayout } from './panel-layout-types';

export const PanelCssContext = createContext<string | null>(null);
export const PanelCssLayoutContext = createContext<{
  layout: AppShellPanelLayout;
  gap: number;
} | null>(null);
export const panelSizeProperty = (scope: string, index: number) => `--${scope}-panel-size-${index}`;
export const panelGrowProperty = (scope: string, index: number) => `--${scope}-panel-grow-${index}`;
export const panelCssScope = (id: string) => `bloom-panels-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

/** Compile descriptor rules, never viewport measurements. The browser chooses each range. */
export function panelLayoutCss(
  scope: string,
  layout: AppShellPanelLayout,
  gap: number,
  widths: Readonly<Record<string, number>> = {},
  heights: Readonly<Record<string, number>> = {},
) {
  const root = `[data-bloom-layout="${scope}"]`;
  const group = `[data-bloom-panel-group="${scope}"]`;
  const row = `${group} [data-bloom-panel-row="${scope}"]`;
  const item = (index: number) =>
    `${group} [data-bloom-panel-owner="${scope}"][data-bloom-panel-index="${index}"]`;
  const liveSize = (index: number, fallback: string) =>
    `var(${panelSizeProperty(scope, index)}, ${fallback})`;
  const deck = layout.mode === 'deck';
  const document = layout.flow === 'document' && !deck;
  const pageDeck = deck && layout.horizontalScroll !== 'contained';
  const thresholds = new Set<number>([0]);
  for (const panel of layout.panels) {
    if (panel.hideBelow !== undefined) thresholds.add(breakpointPx(panel.hideBelow));
    if (panel.floating) thresholds.add(breakpointPx(panel.floating.below));
  }
  if (layout.collapseBelow !== undefined) thresholds.add(breakpointPx(layout.collapseBelow));
  if (typeof layout.axis === 'object')
    for (const name of Object.keys(BREAKPOINTS) as (keyof typeof BREAKPOINTS)[])
      if (layout.axis[name]) thresholds.add(BREAKPOINTS[name]);
  let css = `${root} [data-bloom-reading-envelope="${scope}"]{width:var(--bloom-reading-envelope)!important;flex-grow:0!important;flex-basis:auto!important;max-width:var(--bloom-reading-envelope)!important;interpolate-size:allow-keywords}
${root} [data-bloom-reading-content="${scope}"]{width:100%!important;flex-basis:100%!important;max-width:100%!important;flex-grow:1!important}
${row}{gap:0!important}
${group} [data-bloom-panel-owner="${scope}"][data-bloom-panel-index]{interpolate-size:allow-keywords;transition-property:width,height,flex-basis,flex-grow,min-width,min-height,max-width,max-height,margin-inline-start,margin-top,opacity,display;transition-behavior:allow-discrete;transition-duration:380ms;transition-timing-function:cubic-bezier(.4,0,.2,1)}
${group}[data-bloom-panel-resizing] [data-bloom-panel-owner="${scope}"][data-bloom-panel-index],${root}:has(${group}[data-bloom-panel-resizing]) [data-bloom-reading-envelope="${scope}"]{transition:none!important}
${group}[data-bloom-panel-resizing]{user-select:none;cursor:col-resize}
${group}[data-bloom-panel-resizing="vertical"]{cursor:row-resize}
@media(prefers-reduced-motion:reduce){${group} [data-bloom-panel-owner="${scope}"][data-bloom-panel-index]{transition:none}}
`;
  if (pageDeck)
    css += `:root:has(${root}){container-type:scroll-state;container-name:bloom-document-scroll}\n`;
  const ranges = [...thresholds].sort((a, b) => a - b);
  for (let n = 0; n < ranges.length; n++) {
    const lower = ranges[n]!;
    const upper = ranges[n + 1];
    const query = `(min-width:${lower}px)${upper === undefined ? '' : ` and (width < ${upper}px)`}`;
    const axis = resolvePanelAxis(layout, lower);
    const vertical = axis === 'vertical';
    const eligible = eligiblePanels(layout, lower);
    const active =
      eligible.find((p) => p.id === (layout.expandedPanel ?? layout.activePanel)) ?? eligible[0];
    const forced =
      !!layout.expandedPanel ||
      (!deck && layout.collapseBelow !== undefined && lower < breakpointPx(layout.collapseBelow));
    const shown = forced ? eligible.filter((p) => p.id === active?.id) : eligible;
    const flexible = shown.some((p) =>
      vertical
        ? heights[p.id] === undefined && p.height === undefined
        : widths[p.id] === undefined && p.width === undefined,
    );
    const envelope = deck ? '100%' : `${panelEnvelope(layout, lower, gap)}px`;
    let rules = `${root} [data-bloom-reading-envelope="${scope}"]{--bloom-reading-envelope:${envelope}}\n${row}{flex-direction:${vertical ? 'column' : 'row'}!important;--bloom-panel-axis:${axis}}\n`;
    const hidden = (index: number) =>
      `${item(index)}{--bloom-panel-visible:0;flex:0 0 0px!important;display:none!important;width:0!important;height:auto!important;max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;opacity:0!important;margin:0!important;overflow:hidden!important;pointer-events:none!important}\n`;
    for (let index = 0; index < layout.panels.length; index++) {
      const p = layout.panels[index]!;
      rules += `${item(index)}{--bloom-panel-floating:${p.floating && lower < breakpointPx(p.floating.below) ? 1 : 0}}\n`;
      const position = shown.findIndex((x) => x.id === p.id);
      if (position < 0) {
        rules += hidden(index);
        continue;
      }
      const dim = vertical ? (heights[p.id] ?? p.height) : (widths[p.id] ?? p.width);
      const min = vertical ? p.minHeight : p.minWidth;
      const max = vertical ? p.maxHeight : p.maxWidth;
      const natural = vertical && document;
      const basis =
        pageDeck && !vertical
          ? 'auto'
          : forced
            ? natural
              ? 'auto'
              : '100%'
            : dim !== undefined
              ? `${dim}px`
              : deck
                ? `${DEFAULT_PANEL_WIDTH}px`
                : natural
                  ? 'auto'
                  : '0px';
      const grow = forced
        ? 1
        : deck || natural
          ? 0
          : flexible && dim !== undefined
            ? 0
            : (p.span ?? 1);
      rules += `${item(index)}{--bloom-panel-visible:1;display:flex!important;flex:var(${panelGrowProperty(scope, index)}, ${grow}) ${deck || natural ? 0 : 1} ${liveSize(index, basis)}!important;width:${vertical ? '100%' : pageDeck ? (forced ? 'calc(var(--bloom-deck-viewport) - var(--bloom-frame-end))' : liveSize(index, `${dim ?? DEFAULT_PANEL_WIDTH}px`)) : 'auto'}!important;height:auto!important;min-width:${vertical || forced ? 0 : (min ?? 0)}px!important;max-width:${vertical || forced ? '100%' : max === undefined ? 'none' : `${max}px`}!important;min-height:${vertical && !forced ? (min ?? 0) : 0}px!important;max-height:${vertical && !forced && max !== undefined ? `${max}px` : 'none'}!important;opacity:1!important;margin-inline-start:${!vertical && position > 0 ? gap : 0}px!important;margin-top:${vertical && position > 0 ? gap : 0}px!important}\n`;
      rules += `@starting-style{${item(index)}{flex:0 0 0px!important;width:${vertical ? '100%' : '0px'}!important;min-width:0!important;min-height:0!important;opacity:0!important;margin-inline-start:0!important;margin-top:0!important}}\n`;
    }
    if (pageDeck && !vertical) {
      const trackWidths = shown.map((panel) =>
        Math.max(
          panel.minWidth ?? 0,
          Math.min(
            panel.maxWidth ?? Infinity,
            widths[panel.id] ?? panel.width ?? DEFAULT_PANEL_WIDTH,
          ),
        ),
      );
      const declaredWidth = trackWidths
        .map((value, index) => liveSize(layout.panels.indexOf(shown[index]!), `${value}px`))
        .concat(`${Math.max(0, shown.length - 1) * gap}px`)
        .join(' + ');
      const deckWidth = layout.expandedPanel
        ? 'var(--bloom-deck-viewport)'
        : `max(var(--bloom-deck-viewport), calc(${declaredWidth} + var(--bloom-frame-end)))`;
      rules += `${root} [data-bloom-shell-frame="${scope}"]{overflow:visible!important;padding-inline:0!important;--bloom-deck-viewport:calc(100cqw - var(--bloom-nav-width) - var(--bloom-nav-gap))}
${root} [data-bloom-reading-envelope="${scope}"]{width:${deckWidth}!important;min-width:0!important;max-width:none!important;flex:0 0 auto!important;padding-inline-start:0!important;padding-inline-end:var(--bloom-frame-end)!important}
${root} [data-bloom-reading-envelope="${scope}"]{min-width:0!important}
${root} [data-bloom-shell-nav="${scope}"]{position:sticky!important;inset-inline-start:0;top:0;z-index:200;background-color:inherit}
${root} [data-bloom-shell-nav="${scope}"]{isolation:isolate}
${root} [data-bloom-deck-trailing="${scope}"]{display:flex;position:absolute;inset-inline-end:var(--bloom-frame-end);top:50%;transform:translateY(-50%);z-index:210;width:64px;min-height:96px;padding:8px;align-items:center;justify-content:center;visibility:visible}
${root} [data-bloom-deck-trailing="${scope}"]>*{opacity:0;transition:opacity 150ms ease}
${root} [data-bloom-deck-trailing="${scope}"]:is(:hover,:focus-within)>*{opacity:1}
@supports(animation-timeline:scroll(root inline)){
@keyframes ${scope}-deck-end{from{visibility:hidden}to{visibility:visible}}
${root} [data-bloom-deck-trailing="${scope}"]{position:fixed;inset-inline-end:0;animation:${scope}-deck-end steps(1,end) both;animation-timeline:scroll(root inline);animation-range:calc(100% - 1px) 100%}
}
@media(prefers-reduced-motion:reduce){${root} [data-bloom-deck-trailing="${scope}"]>*{transition:none}}

${root} [data-bloom-shell-nav="${scope}"]::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:var(--bloom-nav-overlay-surface);border-inline-end:1px solid var(--bloom-nav-overlay-border);box-shadow:var(--bloom-nav-overlay-shadow);opacity:0}
@supports(animation-timeline:scroll(root inline)){
@keyframes ${scope}-nav-overlap{from{opacity:0}to{opacity:1}}
@container bloom-document-scroll (scroll-state(scrollable:inline-start) or scroll-state(scrollable:inline-end)){
${root} [data-bloom-shell-nav="${scope}"]::before{animation:${scope}-nav-overlap linear both;animation-timeline:scroll(root inline);animation-range:0px max(1px,var(--bloom-frame-end))}
}
@media(prefers-reduced-motion:reduce){${root} [data-bloom-shell-nav="${scope}"]::before{animation-timing-function:steps(1,end)}}
}
${root} [data-bloom-shell-viewport-chrome="${scope}"]{position:fixed!important}
${group}{container-type:normal!important;width:100%!important;min-width:0!important}
${row}{width:100%!important;min-width:0!important}
`;
    }
    // Insufficient split capacity selects the same active track, entirely in CSS.
    const minimum =
      eligible.reduce((sum, p) => sum + (vertical ? (p.minHeight ?? 0) : (p.minWidth ?? 0)), 0) +
      Math.max(0, eligible.length - 1) * gap;
    if (!deck && !forced && !(vertical && document) && minimum > 0) {
      rules += `@container ${scope}-group (${vertical ? 'height' : 'width'} < ${minimum}px){`;
      layout.panels.forEach((p, index) => {
        rules +=
          p.id === active?.id
            ? `${item(index)}{--bloom-panel-visible:1;display:flex!important;flex:1 1 0px!important;min-width:0!important;min-height:0!important;max-width:100%!important;max-height:none!important;margin:0!important;opacity:1!important}`
            : hidden(index);
      });
      rules += '}\n';
    }
    css += `@container ${scope} ${query}{${rules}}\n`;
  }
  return css;
}
