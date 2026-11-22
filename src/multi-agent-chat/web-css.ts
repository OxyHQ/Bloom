import { useEffect } from 'react';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { IS_WEB } from '../styles/platform';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';

const NONE = '0 0 #0000';
/** A ring as Tailwind computes it: its offset layer, the ring, and the empty layers round them. */
const twRing = (ring: string) => `${NONE}, ${NONE}, ${NONE}, ${ring}, ${NONE}`;
/** `transition-colors`, at Tailwind's default ease and duration. */
const TRANSITION_COLORS =
  'transition-property:color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms';
/** `outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring`. */
const focusRing = (hook: string) =>
  `[data-${hook}]{outline-style:none}
[data-${hook}]:focus-visible{box-shadow:${twRing('0 0 0 2px var(--ring)')}}`;
/** `grid grid-cols-<compact> sm:grid-cols-<columns>`. */
const grid = (compact: number, columns: number) =>
  `[data-bloom-market-grid="${compact}-${columns}"]{display:grid;grid-template-columns:repeat(${compact}, minmax(0, 1fr))}
@media (width >= 40rem){[data-bloom-market-grid="${compact}-${columns}"]{grid-template-columns:repeat(${columns}, minmax(0, 1fr))}}`;

/** The marketplace's web hooks: what its parts draw beyond React Native's styles. */
export const MARKETPLACE_HOOKS = {
  /** A listing's own press target inside its card. */
  item: webDataSet({ bloomMarketItem: '' }),
  /** A bot tile of the teammates strip. */
  tile: webDataSet({ bloomMarketTile: '' }),
  /** `text-center` on a box: what inherits it on the web (a text sets its own). */
  center: webDataSet({ bloomMarketCenter: '' }),
  /** A one-line name (`truncate`): its ellipsis and no-wrap are the web's. */
  truncate: webDataSet({ bloomMarketTruncate: '' }),
  /** The detail's last action: both compact tracks on a row of its own, one track from `sm`. */
  wide: IS_WEB ? { bloomMarketWide: '' } : undefined,
  /** A catalogue grid, by its compact and `sm` column counts. */
  grid: (compact: number, columns: number) =>
    webDataSet({ bloomMarketGrid: `${compact}-${columns}` }),
} as const;

const STYLE_ID = 'bloom-multi-agent-chat';
const CSS = `[data-bloom-market-item]{text-align:start}
${focusRing('bloom-market-item')}
[data-bloom-market-tile]{background-color:var(--surface);${TRANSITION_COLORS}}
@media (hover: hover){[data-bloom-market-tile]:hover{background-color:var(--popover)}}
${focusRing('bloom-market-tile')}
[data-bloom-market-center]{text-align:center}
[data-bloom-market-truncate]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${grid(1, 2)}
${grid(2, 4)}
${grid(2, 3)}
${grid(2, 2)}
[data-bloom-market-wide]{grid-column:span 2 / span 2;grid-row-start:2}
@media (width >= 40rem){[data-bloom-market-wide]{grid-column:span 1 / span 1;grid-row-start:auto}}`;

/** `transition-colors` as a web style entry, for a part that takes no hook (a `Card`, a `Button`). */
export const WEB_TRANSITION_COLORS: WebCssStyle = {
  transitionProperty:
    'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to',
  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  transitionDuration: '150ms',
};

/**
 * A type step's line height, as its class set it: pixels on native; on the web
 * the step's unitless ratio, which scales with the text's own size (a `Text`
 * keeps its 13px default under a body step's class).
 */
export function stepLineHeight(px: number, size: number): number {
  return IS_WEB ? (String(px / size) as unknown as number) : px;
}

export function useMultiAgentChatWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CSS);
  }, []);
}
