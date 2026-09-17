import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveMessageBubblePaint } from './shared';
import type { DateSeparatorProps } from './types';

/**
 * The centred day pill between two days of a transcript.
 *
 * `label` is PRE-FORMATTED — "Today", "Yesterday", "12 March". Nothing here
 * reads the clock or knows a locale: what counts as today depends on the
 * reader's timezone and on whether the app has settled its own day boundary,
 * and a component that guessed would be wrong in exactly the cases that matter.
 */
function DateSeparatorComponent({ label, style, testID }: DateSeparatorProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMessageBubblePaint(theme), [theme]);
  return (
    <View
      style={[{ alignItems: 'center', paddingTop: 8, paddingBottom: 8 }, style]}
      testID={testID}
    >
      <View
        style={{
          borderRadius: 999,
          backgroundColor: paint.pillFill,
          paddingTop: 3,
          paddingBottom: 3,
          paddingLeft: 10,
          paddingRight: 10,
        }}
      >
        <Text variant="caption-1-medium" style={{ color: paint.pillText }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export const DateSeparator = memo(DateSeparatorComponent);
DateSeparator.displayName = 'DateSeparator';
