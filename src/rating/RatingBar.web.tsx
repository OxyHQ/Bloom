import React, { memo } from 'react';
import { Meter } from '../stat-bar/index.web';
import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { useTheme } from '../theme/use-theme';
import { TYPE_SCALE } from '../typography/scale';
import type { RatingBarProps } from './types';
const regular = TYPE_SCALE['body-regular'];
const semibold = TYPE_SCALE['body-semibold'];
const CSS = `@layer base {
.bloom-rating-bar { box-sizing:border-box; flex-shrink:0; display:flex; flex-direction:row; align-items:center; gap:12px; min-width:0; color:var(--bloom-rating-text); }
.bloom-rating-label { display:block; flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:var(--bloom-font-sans); font-size:${regular.fontSize}px; line-height:${regular.lineHeight}px; font-weight:${regular.fontWeight}; letter-spacing:${regular.letterSpacing}px; }
.bloom-rating-label[data-fixed] { flex:none; width:var(--bloom-rating-label-width); }
.bloom-rating-track-flex { flex:1; min-width:0; }
.bloom-rating-display { min-width:28px; text-align:right; font-family:var(--bloom-font-sans); font-size:${semibold.fontSize}px; line-height:${semibold.lineHeight}px; font-weight:${semibold.fontWeight}; font-variant-numeric:tabular-nums; }
}`;
export const RatingBar = memo(function RatingBar({ label, value, max = 5, display, labelWidth, style, testID,
  className, labelClassName, displayClassName, trackClassName, fillClassName }: RatingBarProps) {
  useInteractiveWebCss('bloom-rating-bar', CSS);
  const theme = useTheme();
  const vars = { '--bloom-rating-text': theme.colors.text, '--bloom-rating-label-width': `${labelWidth ?? 0}px` } as React.CSSProperties;
  return <div className={['bloom-rating-bar', className].filter(Boolean).join(' ')} style={{ ...vars, ...resolveNativeWebStyle(style) }} data-testid={testID}>
    <span className={['bloom-rating-label', labelClassName].filter(Boolean).join(' ')} data-fixed={labelWidth !== undefined ? '' : undefined} aria-hidden>{label}</span>
    <Meter value={value} max={max > 0 ? max : 1} height={4} width={labelWidth === undefined ? 96 : undefined} accessibilityLabel={label} valueText={display}
      testID={testID ? `${testID}-bar` : undefined} fillTestID={testID ? `${testID}-fill` : undefined}
      className={['bloom-rating-track', labelWidth !== undefined ? 'bloom-rating-track-flex' : '', trackClassName].filter(Boolean).join(' ')} fillClassName={fillClassName} />
    {display != null && <span className={['bloom-rating-display', displayClassName].filter(Boolean).join(' ')} aria-hidden>{display}</span>}
  </div>;
});
