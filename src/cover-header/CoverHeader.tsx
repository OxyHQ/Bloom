import React, { memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { CoverImage } from './CoverImage';
import type { CoverHeaderProps } from './types';

const DEFAULT_POSITION = { x: 0.5, y: 0.5 };

/**
 * A cover band with content rising into its bottom edge — a profile's banner
 * and the avatar that overlaps it.
 *
 *   cover     absolute over the top `coverHeight`, clipped, background-tertiary
 *             under the photo; the FIRST child
 *   content   in flow, `paddingTop: coverHeight - overlap`; the LAST child
 *
 * The overlap is made by layout, not by moving anything: the band is taken out
 * of flow and the content starts `overlap` short of its bottom edge. No
 * negative margin, no transform, no zIndex. The content is the later sibling,
 * so it paints over the band on iOS, Android and web alike, and the measured
 * height is the real one — a list header or a sticky section after it starts
 * exactly where the content ends.
 */
function CoverHeaderComponent({
  coverSource,
  coverPosition = DEFAULT_POSITION,
  cover,
  coverHeight = 170,
  overlap = 45,
  coverStyle,
  contentStyle,
  children,
  style,
  testID,
}: CoverHeaderProps) {
  const theme = useTheme();
  const rise = Math.min(Math.max(overlap, 0), coverHeight);

  return (
    <View testID={testID} style={[{ position: 'relative', width: '100%' }, style]}>
      <View
        testID={testID ? `${testID}-cover` : undefined}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: coverHeight,
            overflow: 'hidden',
            backgroundColor: theme.colors.backgroundTertiary,
          },
          coverStyle,
        ]}>
        {cover ??
          (coverSource ? (
            <CoverImage
              source={coverSource}
              position={coverPosition}
              testID={testID ? `${testID}-cover-image` : undefined}
            />
          ) : null)}
      </View>
      <View
        testID={testID ? `${testID}-content` : undefined}
        style={[{ position: 'relative', width: '100%' }, contentStyle, { paddingTop: coverHeight - rise }]}>
        {children}
      </View>
    </View>
  );
}

export const CoverHeader = memo(CoverHeaderComponent);
CoverHeader.displayName = 'CoverHeader';
