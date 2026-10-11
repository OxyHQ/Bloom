import React from 'react';
import { Platform, type StyleProp, type TextStyle } from 'react-native';
import { Text } from '../typography';
import { resolveNativeWebStyle } from '../styles/resolve-native-web-style';

/** The animated label and its measuring copy share one typography owner.
 * RNW's unlayered Text reset would outrank a caller's layered recipe, so the
 * web class slot uses a span. Native delegates class interop to Bloom Text. */
export function FollowLabel({
  children,
  className,
  style,
  numberOfLines,
}: {
  children: string;
  className?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  if (Platform.OS === 'web' && className?.trim()) {
    return (
      <span
        className={className}
        style={{
          display: 'block',
          fontFamily: 'var(--bloom-font-sans)',
          ...(numberOfLines === 1 && {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }),
          ...resolveNativeWebStyle(style),
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <Text variant="body-semibold" className={className} style={style} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}
