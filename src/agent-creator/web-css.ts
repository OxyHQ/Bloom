import { useEffect } from 'react';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { IS_WEB } from '../styles/platform';
import { webDataSet } from '../styles/web-data';

const NONE = '0 0 #0000';
/** A box shadow as Tailwind computes it: the four empty layers before it. */
export const twShadow = (shadow: string) => `${NONE}, ${NONE}, ${NONE}, ${NONE}, ${shadow}`;
/** A ring as Tailwind computes it: its offset layer, the ring, and the empty layers round them. */
const twRing = (ring: string, offset = NONE) => `${NONE}, ${NONE}, ${offset}, ${ring}, ${NONE}`;
/** `focus-visible:ring-2 ring-border-focus-ring ring-offset-2`: a 2px ring past a 2px white gap. */
const OFFSET_RING = twRing('0 0 0 4px var(--ring)', '0 0 0 2px #fff');
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** The editor's web hooks: what its parts draw beyond React Native's styles. */
export const AGENT_CREATOR_HOOKS = {
  swatch: webDataSet({ bloomAgentSwatch: '' }),
  emotion: webDataSet({ bloomAgentEmotion: '' }),
  shape: webDataSet({ bloomAgentShape: '' }),
  shapeTrack: webDataSet({ bloomAgentShapeTrack: '' }),
  colorField: webDataSet({ bloomAgentColorField: '' }),
  hueRail: webDataSet({ bloomAgentHueRail: '' }),
  hex: webDataSet({ bloomAgentHex: '' }),
} as const;

const STYLE_ID = 'bloom-agent-creator';
const CSS = `[data-bloom-agent-swatch]{cursor:pointer;outline-style:none;transition-property:transform, translate, scale, rotate;transition-timing-function:cubic-bezier(0, 0, 0.2, 1);transition-duration:150ms}
@media (hover: hover){[data-bloom-agent-swatch]:hover{scale:110% 110%}}
[data-bloom-agent-swatch]:focus-visible{box-shadow:${OFFSET_RING}}
[data-bloom-agent-emotion]{cursor:pointer;outline-style:none;transition-property:border-color,box-shadow;transition-timing-function:${EASE};transition-duration:150ms}
@media (hover: hover){[data-bloom-agent-emotion]:hover{box-shadow:${twRing('0 0 0 2px currentcolor')}}}
[data-bloom-agent-emotion]:focus-visible{box-shadow:${twRing('0 0 0 2px var(--ring)')}}
[data-bloom-agent-shape]{cursor:grab;outline-style:none;transition-property:color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;transition-timing-function:${EASE};transition-duration:150ms}
[data-bloom-agent-shape]:active{cursor:grabbing}
[data-bloom-agent-shape][aria-selected="true"]{box-shadow:${twRing('0 0 0 1px var(--border)')}}
[data-bloom-agent-shape-track]{touch-action:pan-y;-webkit-user-select:none;user-select:none;outline-style:none}
[data-bloom-agent-shape-track]:focus-visible{box-shadow:${twRing('inset 0 0 0 2px var(--ring)')}}
[data-bloom-agent-color-field]{cursor:crosshair;touch-action:none;outline-style:none}
[data-bloom-agent-hue-rail]{cursor:pointer;touch-action:none;outline-style:none}
[data-bloom-agent-color-field]:focus-visible,[data-bloom-agent-hue-rail]:focus-visible{box-shadow:${OFFSET_RING}}
[data-bloom-agent-hex]{height:32px;width:100%;min-width:0px;border-radius:10px;background-color:var(--popover);padding-inline:10px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:13px;color:var(--foreground);text-transform:uppercase;outline-style:none;box-shadow:${twRing('inset 0 0 0 2px transparent')};transition-property:background-color,box-shadow;transition-timing-function:${EASE};transition-duration:150ms}
[data-bloom-agent-hex]::placeholder{color:var(--muted-foreground)}
[data-bloom-agent-hex]:focus{background-color:var(--card);box-shadow:${twRing('inset 0 0 0 2px var(--ring)')}}`;

export function useAgentCreatorWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CSS);
  }, []);
}
