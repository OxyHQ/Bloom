import React from 'react';
import { View } from 'react-native';

import * as Skeleton from '../skeleton';
import { MAIL_ROW_GEOMETRY } from './shared';
import type { MailListSkeletonProps } from './types';

/**
 * Placeholder rows with `MailRow`'s exact geometry, so the list does not jump
 * when the mail arrives. The widths vary a little per row — a block of
 * identical bars reads as a table, not as a list of subjects.
 *
 * Hidden from assistive technology: announce loading ONCE on the surrounding
 * region (`MailList` does, with `aria-busy`), not eight times.
 */
export function MailListSkeleton({
  count = 1,
  density = 'comfortable',
  style,
  testID,
}: MailListSkeletonProps) {
  const geo = MAIL_ROW_GEOMETRY[density];
  const compact = density === 'compact';
  return (
    <View aria-hidden importantForAccessibility="no-hide-descendants" style={style} testID={testID}>
      {Array.from({ length: count }, (_, index) => {
        const senderWidth = 38 + ((index * 37) % 26);
        const subjectWidth = 52 + ((index * 23) % 30);
        const snippetWidth = 60 + ((index * 17) % 28);
        return (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: geo.minHeight,
              ...(geo.height === undefined ? null : { height: geo.height }),
              paddingTop: geo.paddingVertical,
              paddingBottom: geo.paddingVertical,
              paddingLeft: geo.paddingHorizontal,
              paddingRight: geo.paddingHorizontal,
            }}
            testID={testID ? `${testID}-row-${index}` : undefined}
          >
            <Skeleton.Circle size={geo.avatar} />
            {compact ? (
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  marginLeft: geo.gap,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: geo.gap,
                }}
              >
                <Skeleton.Box width={geo.senderWidth} height={10} borderRadius={4} />
                <Skeleton.Box width={`${subjectWidth}%`} height={10} borderRadius={4} />
              </View>
            ) : (
              <View style={{ flex: 1, minWidth: 0, marginLeft: geo.gap, gap: geo.lineGap + 6 }}>
                <Skeleton.Box width={`${senderWidth}%`} height={12} borderRadius={4} />
                <Skeleton.Box width={`${subjectWidth}%`} height={10} borderRadius={4} />
                <Skeleton.Box width={`${snippetWidth}%`} height={10} borderRadius={4} />
              </View>
            )}
            <View style={{ marginLeft: geo.gap }}>
              <Skeleton.Box width={28} height={10} borderRadius={4} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
