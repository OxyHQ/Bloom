import React from 'react';
import { View } from 'react-native';

import * as Skeleton from '../skeleton';
import { CHAT_ROW_GEOMETRY } from './shared';
import type { ChatListItemSkeletonProps } from './types';

/**
 * Placeholder rows with `ChatListItem`'s exact geometry, so the list does not
 * jump when the conversations arrive. The name and preview widths vary a little
 * per row — a block of identical bars reads as a table, not as a list of names.
 *
 * Hidden from assistive technology: announce loading once on the surrounding
 * region (`ChatList` does), not eight times.
 */
export function ChatListItemSkeleton({
  count = 1,
  density = 'comfortable',
  style,
  testID,
}: ChatListItemSkeletonProps) {
  const geo = CHAT_ROW_GEOMETRY[density];
  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={style}
      testID={testID}
    >
      {Array.from({ length: count }, (_, index) => {
        const nameWidth = 38 + ((index * 37) % 26);
        const previewWidth = 46 + ((index * 23) % 34);
        return (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: geo.height,
              paddingLeft: geo.paddingHorizontal,
              paddingRight: geo.paddingHorizontal,
            }}
            testID={testID ? `${testID}-row-${index}` : undefined}
          >
            <Skeleton.Circle size={geo.avatar} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: geo.gap, gap: geo.lineGap + 3 }}>
              <Skeleton.Box width={`${nameWidth}%`} height={12} borderRadius={4} />
              <Skeleton.Box width={`${previewWidth}%`} height={10} borderRadius={4} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: geo.lineGap + 3, marginLeft: geo.gap }}>
              <Skeleton.Box width={32} height={10} borderRadius={4} />
              <Skeleton.Box width={18} height={18} borderRadius={9} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
