import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveListingPalette } from './shared';
import type { ListingSectionProps } from './types';

/**
 * One section of a listing page, so a page stacks them consistently.
 *
 *   frame      a 1px top hairline (neutral-200, dark neutral-800), 32 above and below the content
 *   title      title-3-semibold (`size="small"`: headline-semibold), a heading (level 2)
 *   subtitle   body-regular, text-secondary, 4 under the title
 *   action     right of the title block
 *   content    24 under the header
 */
function ListingSectionComponent({
  title,
  subtitle,
  size = 'medium',
  headingLevel = 2,
  action,
  divider = true,
  children,
  style,
  testID,
}: ListingSectionProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveListingPalette(theme), [theme]);
  const hasHeader = Boolean(title || subtitle || action);
  return (
    <View
      style={[
        {
          paddingTop: 32,
          paddingBottom: 32,
          gap: 24,
          borderTopWidth: divider ? 1 : 0,
          borderTopColor: palette.hairline,
        },
        style,
      ]}
      testID={testID}
    >
      {hasHeader ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            {title ? (
              <Text
                role="heading"
                aria-level={headingLevel}
                variant={size === 'medium' ? 'title-3-semibold' : 'headline-semibold'}
                style={{ color: palette.text }}
                testID={testID ? `${testID}-title` : undefined}
              >
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text variant="body-regular" style={{ color: palette.textSecondary }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export const ListingSection = memo(ListingSectionComponent);
ListingSection.displayName = 'ListingSection';
