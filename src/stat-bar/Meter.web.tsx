import React, { memo } from 'react';
import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { useTheme } from '../theme/use-theme';
import { meterFraction, meterValue, resolveMeterColors } from './shared';
import type { AnyMeterProps } from './types';
import { useMeterReveal } from './use-meter-reveal.web';

const CSS = `@layer base {
.bloom-meter-track { display:block; flex-shrink:0; box-sizing:border-box; width:var(--bloom-meter-width,100%); height:var(--bloom-meter-height); border-radius:var(--bloom-meter-radius); background:var(--bloom-meter-track); overflow:hidden; }
.bloom-meter-fill { display:block; box-sizing:border-box; height:100%; border-radius:var(--bloom-meter-radius); background:var(--bloom-meter-fill); }
.bloom-meter-fill[data-transition] { transition:width var(--bloom-meter-ms,0ms) var(--bloom-meter-easing,ease-out) var(--bloom-meter-delay,0ms); }
@media(prefers-reduced-motion:reduce) { .bloom-meter-fill[data-transition] { transition:none; } }
}`;

export const Meter = memo(function Meter(props: AnyMeterProps) {
  useInteractiveWebCss('bloom-meter-classes', CSS);
  const theme = useTheme();
  const colors = resolveMeterColors(theme);
  const { value, reveal, max = 1, height = 6, radius = height / 2, width, fill = colors.fill, track = colors.track,
    transitionMs = 0, style, testID, fillTestID = testID ? `${testID}-fill` : undefined, className, fillClassName } = props;
  const motion = useMeterReveal(meterFraction(value, max), reveal);
  const vars = {
    '--bloom-meter-width': width == null ? '100%' : `${width}px`,
    '--bloom-meter-height': `${height}px`, '--bloom-meter-radius': `${radius}px`,
    '--bloom-meter-track': track, '--bloom-meter-fill': fill, '--bloom-meter-ms': `${reveal ? motion.duration : transitionMs}ms`,
    ...(reveal ? { '--bloom-meter-delay': `${motion.delay}ms`, '--bloom-meter-easing': motion.easing } : {}),
  } as React.CSSProperties;
  const contents = <div className={['bloom-meter-fill', fillClassName].filter(Boolean).join(' ')}
    data-transition={(reveal ? motion.duration : transitionMs) > 0 ? '' : undefined} data-testid={fillTestID} style={{ width: `${reveal ? motion.fraction * 100 : meterFraction(value, max) * 100}%` }} />;
  const root = { className: ['bloom-meter-track', className].filter(Boolean).join(' '), style: { ...vars, ...resolveNativeWebStyle(style) }, 'data-testid': testID };
  if (props.decorative) return <div {...root} aria-hidden>{contents}</div>;
  return <div {...root} role="progressbar" aria-label={props.accessibilityLabel} aria-valuemin={0} aria-valuemax={max}
    aria-valuenow={meterValue(value, max)} aria-valuetext={props.valueText}>{contents}</div>;
});
