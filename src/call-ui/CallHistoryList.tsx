import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Divider } from '../divider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CallHistoryRow } from './CallHistoryRow';
import { resolveCallPaint } from './shared';
import type { CallHistoryListProps } from './types';

/**
 * `CallHistoryList`: the call log, in day sections.
 *
 * Section headings are PRE-FORMATTED strings ("Today", "Last week"): deciding
 * what yesterday means needs a locale and a timezone the app has and a
 * component does not, and a heading that reads the device clock is wrong for
 * every user who is not in the timezone the data came from.
 *
 * An empty section is dropped rather than drawn with a heading and nothing
 * under it; `emptyState` covers the case where every section is empty.
 */

function CallHistoryListComponent({
  sections,
  onItemPress,
  onCallBack,
  divider = true,
  emptyState,
  header,
  footer,
  labels,
  style,
  testID,
}: CallHistoryListProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme), [theme]);
  const filled = sections.filter((section) => section.items.length > 0);

  return (
    <View style={[{ gap: 8 }, style]} testID={testID}>
      {header}
      {filled.length === 0
        ? emptyState
        : filled.map((section) => (
            <View key={section.id ?? section.title} style={{ gap: 2 }}>
              <Text
                variant="caption-1-semibold"
                style={{
                  color: paint.textSecondary,
                  paddingTop: 10,
                  paddingRight: 8,
                  paddingBottom: 4,
                  paddingLeft: 8,
                }}
                testID={testID ? `${testID}-section-${section.id ?? section.title}` : undefined}
              >
                {section.title}
              </Text>
              {section.items.map((item, index) => (
                <View key={item.id}>
                  <CallHistoryRow
                    {...item}
                    labels={item.labels ?? labels}
                    onPress={onItemPress === undefined ? undefined : () => onItemPress(item.id)}
                    onCallBack={onCallBack === undefined ? undefined : () => onCallBack(item.id)}
                    testID={testID ? `${testID}-item-${item.id}` : undefined}
                  />
                  {divider && index < section.items.length - 1 ? (
                    // The inset is PADDING on a wrapper, not a margin on the
                    // rule: `Divider` is `width: '100%'`, so a left margin
                    // pushes it past the list's right edge instead of shortening
                    // it — visible as a hairline escaping the card.
                    <View style={{ paddingLeft: 64, paddingRight: 8 }}>
                      <Divider />
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
      {footer}
    </View>
  );
}

export const CallHistoryList = memo(CallHistoryListComponent);
CallHistoryList.displayName = 'CallHistoryList';
