import { useEffect } from 'react';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { IS_WEB } from '../styles/platform';
import { TAILWIND_SHADOW as stack } from './styles';
const NONE = '0 0 #0000';
const CARD_SHADOW = '0 1px 1px rgb(0 0 0/0.05)';
const SHADOW_SM = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const COLORS =
  'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to';

const STYLE_ID = 'bloom-project-board';
/**
 * What the web draws beyond React Native's styles, off the board's `dataSet`
 * hooks: the card material's shadow, hover and cursor; the small icon
 * buttons', control triggers' and property rows' hovers and focus rings; and
 * the comment thread's connector; and the indigo of the new ticket's Low pill.
 */
const CSS = `[data-bloom-board-card]{text-align:start;box-shadow:${stack('0 0 0 2.5px transparent', CARD_SHADOW)};transition-property:box-shadow,opacity;transition-timing-function:cubic-bezier(0, 0, 0.2, 1);transition-duration:200ms}
[data-bloom-board-card-dark]{background-color:color-mix(in oklab, var(--card) 60%, transparent)}
@media (prefers-reduced-motion:reduce){[data-bloom-board-card]{transition-property:none}}
@media (hover:hover){[data-bloom-board-card="drag"]:hover,[data-bloom-board-card="handle"]:hover{box-shadow:${stack('0 0 0 2.5px transparent', SHADOW_SM)}}}
[data-bloom-board-card="drag"]{cursor:grab}
[data-bloom-board-card="drag"]:active,[data-bloom-board-card="overlay"]{cursor:grabbing}
[data-bloom-board-slot]{touch-action:manipulation;outline-style:none}
[data-bloom-board-icon-button]{cursor:pointer;transition-property:${COLORS};transition-timing-function:${EASE};transition-duration:150ms}
@media (hover:hover){[data-bloom-board-icon-button]:hover{background-color:var(--popover)}}
[data-bloom-board-icon-button]:focus-visible{outline-style:none;box-shadow:${stack('0 0 0 2px var(--ring)', NONE)}}
[data-bloom-board-trigger]{background-color:var(--card);box-shadow:${stack(NONE, '0 1px 2px 0 rgb(0 0 0 / 0.05)')};transition-property:${COLORS};transition-timing-function:${EASE};transition-duration:150ms}
[data-bloom-board-property]{background-color:transparent}
@media (hover:hover){[data-bloom-board-trigger]:hover,[data-bloom-board-property=""]:hover{background-color:var(--surface)}}
@media (hover:hover){[data-bloom-board-menu-row]:hover{background-color:var(--popover)}}
[data-bloom-board-comment]::after{content:"";pointer-events:none;position:absolute;top:36px;bottom:-12px;inset-inline-start:23.5px;width:1px;background-color:var(--border)}
[data-bloom-board-comment]:last-child::after{display:none}
[data-bloom-board-link]{outline-style:none}
[data-bloom-board-link]:focus-visible{box-shadow:${stack('0 0 0 2px var(--ring)', NONE)}}
:root{--bloom-board-indigo-200:oklch(87% 0.065 274.039);--bloom-board-indigo-300:oklch(78.5% 0.115 274.713);--bloom-board-indigo-800:oklch(39.8% 0.195 277.366);--bloom-board-indigo-950-60:color-mix(in oklab, oklch(25.7% 0.09 281.288) 60%, transparent)}`;

export function useProjectBoardWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CSS);
  }, []);
}
