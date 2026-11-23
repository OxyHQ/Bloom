import { useEffect } from 'react';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { IS_WEB } from '../styles/platform';

/** Tailwind's `ring-2` as it computes: four empty shadows round a 2px ring. */
const RING = '0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 0 2px var(--ring), 0 0 #0000';

const STYLE_ID = 'bloom-agent-reply';
/**
 * What the web draws beyond React Native's styles, off the parts' `dataSet`
 * hooks: the reply's fit-content column and the body type its text inherits,
 * the identity row's inherited type, the keyboard rings of the identity row and
 * the profile's capsule, and the profile's press.
 */
const CSS = `[data-bloom-agent-reply]{width:fit-content;max-width:min(520px, calc(100% - 24px));font-size:14px;line-height:calc(20 / 14);letter-spacing:0px;font-weight:400}
[data-bloom-agent-reply-identity]{text-align:start;line-height:calc(18 / 13);letter-spacing:0px;outline-style:none}
[data-bloom-agent-profile]{outline-style:none}
[data-bloom-agent-reply-identity]:focus-visible{box-shadow:${RING}}
[data-bloom-agent-profile]:focus-visible [data-bloom-agent-profile-ring]{box-shadow:${RING}}
@media (prefers-reduced-motion:no-preference){[data-bloom-agent-profile]:active{scale:95% 95%}}`;

export function useAgentReplyWebCss(): void {
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CSS);
  }, []);
}
