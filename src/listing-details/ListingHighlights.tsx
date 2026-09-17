import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveListingPalette } from './shared';
import type { ListingHighlightsProps } from './types';

/**
 * A listing's standout facts: rows of icon + title + description.
 *
 *   row          gap 16, rows 24 apart, top-aligned
 *   icon         24 / 28 (default) / 32, text-primary
 *   title        headline-semibold, text-primary
 *   description  body-regular, text-secondary, 2px under the title
 */
function ListingHighlightsComponent({ items, iconSize = 28, style, testID }: ListingHighlightsProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  return (
    <View role="list" style={[{ gap: 24 }, style]} testID={testID}>
      {items.map(({ icon: Icon, title, description }, index) => (
        <View
          key={`${title}-${index}`}
          role="listitem"
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}
          testID={testID ? `${testID}-item-${index}` : undefined}
        >
          <View
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={{ width: iconSize, alignItems: 'center', paddingTop: 2 }}
          >
            <Icon width={iconSize} height={iconSize} fill={palette.text} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="headline-semibold" style={{ color: palette.text }}>
              {title}
            </Text>
            {description ? (
              <Text variant="body-regular" style={{ color: palette.textSecondary }}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export const ListingHighlights = memo(ListingHighlightsComponent);
ListingHighlights.displayName = 'ListingHighlights';
