import React from 'react';
import { View } from 'react-native';

import { Card } from '../card';
import * as Skeleton from '../skeleton';
import { NOTE_CARD_GEOMETRY } from './shared';
import type { NoteCardSkeletonProps } from './types';

/**
 * The card's placeholder, in the card's own geometry — same padding, same
 * radius, same rhythm — so a board does not reflow when the notes arrive.
 *
 * It is a separate export as well as `NoteCard`'s `loading` branch: a list that
 * knows it is fetching ten notes renders ten of these and never constructs ten
 * empty note objects to satisfy a required `title`.
 */
export function NoteCardSkeleton({ density = 'grid', lines, style, testID }: NoteCardSkeletonProps) {
  const geo = NOTE_CARD_GEOMETRY[density];
  const row = density === 'row';
  const count = lines ?? (row ? 1 : 3);

  return (
    <Card
      variant="outlined"
      radius={geo.radius}
      style={{ padding: geo.padding, minHeight: geo.minHeight }}
      testID={testID}
    >
      <View
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Skeleton.Box width="62%" height={16} borderRadius={6} />
        <View style={{ marginTop: geo.gap + 2, gap: 6 }}>
          {Array.from({ length: count }, (_, index) => (
            <Skeleton.Box
              key={index}
              width={index === count - 1 ? '58%' : '100%'}
              height={11}
              borderRadius={5}
              blend
            />
          ))}
        </View>
        <View style={{ marginTop: geo.gap + 4, flexDirection: 'row', gap: 8 }}>
          <Skeleton.Box width={56} height={12} borderRadius={6} blend />
          <Skeleton.Box width={72} height={12} borderRadius={6} blend />
        </View>
      </View>
    </Card>
  );
}
NoteCardSkeleton.displayName = 'NoteCardSkeleton';
