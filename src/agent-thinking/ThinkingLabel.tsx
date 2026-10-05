import { useEffect } from 'react';
import { Platform, type TextStyle } from 'react-native';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { withAlpha } from '../theme/color-utils';
import { Text, type TextProps } from '../typography';

const STYLE_ID = 'bloom-agent-thinking-web-css';
const LABEL_SELECTOR = '[data-bloom-agent-thinking-label]';
/**
 * `color` is `!important` because react-native-web writes the `Text`'s own
 * colour inline, and an inline declaration outranks any sheet rule without it.
 */
const WEB_CSS = `
@keyframes bloom-agent-thinking-shimmer {
  from { background-position: 200% center; }
  to { background-position: -100% center; }
}
${LABEL_SELECTOR} {
  color: transparent !important;
  background-image: linear-gradient(
    100deg,
    var(--bloom-agent-thinking-soft) 30%,
    var(--bloom-agent-thinking-tone) 50%,
    var(--bloom-agent-thinking-soft) 70%
  );
  background-position: 200% center;
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: bloom-agent-thinking-shimmer 2.6s linear infinite;
  will-change: background-position;
}
@media (prefers-reduced-motion: reduce) {
  ${LABEL_SELECTOR} {
    color: var(--bloom-agent-thinking-tone) !important;
    background-image: none;
    animation: none;
  }
}
`;

type ShimmerTextStyle = TextStyle & {
  '--bloom-agent-thinking-tone'?: string;
  '--bloom-agent-thinking-soft'?: string;
};

/** Shared thinking label; native and reduced motion retain the flat tone. */
export function ThinkingLabel({
  color,
  shimmer = true,
  variant = 'body-medium',
  style,
  ...props
}: TextProps & { color: string; shimmer?: boolean }) {
  const shimmering = Platform.OS === 'web' && shimmer;
  useEffect(() => {
    if (shimmering) adoptStyleSheet(STYLE_ID, WEB_CSS);
  }, [shimmering]);
  const labelStyle: ShimmerTextStyle = shimmering
    ? {
        color,
        '--bloom-agent-thinking-tone': color,
        '--bloom-agent-thinking-soft': withAlpha(color, 0.55),
      }
    : { color };
  return (
    <Text
      {...props}
      variant={variant}
      style={[labelStyle, style]}
      {...(shimmering ? { dataSet: { bloomAgentThinkingLabel: '' } } : {})}
    />
  );
}
