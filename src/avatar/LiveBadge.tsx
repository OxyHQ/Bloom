import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Z_INDEX } from '../styles/z-index';

export type LiveBadgeVariant = 'tiny' | 'small';

interface LiveBadgeProps {
  /** Size variant — `'tiny'` for small avatars, `'small'` for larger ones. */
  variant: LiveBadgeVariant;
  /** Text shown inside the pill (already localized by the caller). */
  label: string;
  /** Pill background color (defaults come from the theme `negative` token). */
  backgroundColor: string;
  /** Pill text color (defaults come from the theme `negativeForeground` token). */
  textColor: string;
}

/**
 * Small red "LIVE" pill that hangs off the bottom-center of an Avatar. Internal
 * to the avatar family — not exported from the package. Modeled on Bluesky's
 * live indicator: full-width absolute wrapper, center-aligned, `bottom: -5` so
 * the pill protrudes below the avatar (the Avatar container is `overflow:
 * 'visible'`).
 */
const LiveBadgeComponent: React.FC<LiveBadgeProps> = ({
  variant,
  label,
  backgroundColor,
  textColor,
}) => {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.pill, { backgroundColor }]}>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.text,
            { color: textColor, fontSize: variant === 'small' ? 10 : 7 },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: Z_INDEX.raised,
    pointerEvents: 'none',
  },
  pill: {
    paddingVertical: 1,
    paddingHorizontal: 3,
    borderRadius: 4,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export const LiveBadge = memo(LiveBadgeComponent);
LiveBadge.displayName = 'LiveBadge';
