import type React from 'react';
import { memo } from 'react';
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
.bloom-rating-display { min-width:28px; text-align:right; font-family:var(--bloom-font-sans); font-size:${semibold.fontSize}px; line-height:${semibold.lineHeight}px; font-weight:${semibold.fontWeight}; font-variant-numeric:tabular-nums; }
}`;
/** With a fixed label width the bar takes the free space. */
const FLEX_TRACK = { flex: 1, minWidth: 0 } as const;
export const RatingBar = memo(function RatingBar({
  label,
  value,
  reveal,
  max = 5,
  display,
  labelWidth,
  style,
  testID,
  labelStyle,
  displayStyle,
  trackStyle,
  fillStyle,
}: RatingBarProps) {
  useInteractiveWebCss('bloom-rating-bar', CSS);
  const theme = useTheme();
  const vars = {
    '--bloom-rating-text': theme.colors.text,
    '--bloom-rating-label-width': `${labelWidth ?? 0}px`,
  } as React.CSSProperties;
  return (
    <div
      className="bloom-rating-bar"
      style={{ ...vars, ...resolveNativeWebStyle(style) }}
      data-testid={testID}
    >
      <span
        className="bloom-rating-label"
        style={resolveNativeWebStyle(labelStyle)}
        data-fixed={labelWidth !== undefined ? '' : undefined}
        aria-hidden
      >
        {label}
      </span>
      <Meter
        reveal={reveal}
        value={value}
        max={max > 0 ? max : 1}
        height={4}
        width={labelWidth === undefined ? 96 : undefined}
        accessibilityLabel={label}
        valueText={display}
        testID={testID ? `${testID}-bar` : undefined}
        fillTestID={testID ? `${testID}-fill` : undefined}
        style={[labelWidth !== undefined && FLEX_TRACK, trackStyle]}
        fillStyle={fillStyle}
      />
      {display != null && (
        <span
          className="bloom-rating-display"
          style={resolveNativeWebStyle(displayStyle)}
          aria-hidden
        >
          {display}
        </span>
      )}
    </div>
  );
});
