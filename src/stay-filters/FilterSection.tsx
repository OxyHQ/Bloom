import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { FilterSectionProps } from './types';

/**
 * One block of a filters surface.
 *
 *   padding      32 above and below
 *   title        headline-semibold, text-primary, `role="heading"`
 *   description  body-regular, text-secondary, 4 under the title
 *   content      24 under the heading block
 *   divider      1px hairline under the section, neutral-200 (dark neutral-800)
 *                — `Divider`'s stop, the same one `StepperRow` draws
 *
 * No horizontal padding: the surface the sections stack in owns the side inset,
 * so a section lines up with that surface's own header and footer.
 */
function FilterSectionComponent({
  title,
  description,
  children,
  divider = true,
  accessibilityLabel,
  style,
  testID,
}: FilterSectionProps) {
  const theme = useTheme();
  const name = accessibilityLabel ?? (typeof title === 'string' ? title : undefined);

  return (
    <View
      testID={testID}
      role="group"
      accessibilityLabel={name}
      style={[
        {
          paddingTop: 32,
          paddingBottom: 32,
          borderBottomWidth: divider ? 1 : 0,
          borderBottomColor: theme.colors.border,
        },
        style,
      ]}
    >
      <View style={{ gap: 4 }}>
        {typeof title === 'string' ? (
          <Text variant="headline-semibold" role="heading" aria-level={3} style={{ color: theme.colors.text }}>
            {title}
          </Text>
        ) : (
          title
        )}
        {description == null ? null : typeof description === 'string' ? (
          <Text variant="body-regular" style={{ color: theme.colors.textSecondary }}>
            {description}
          </Text>
        ) : (
          description
        )}
      </View>
      {children == null ? null : <View style={{ marginTop: 24 }}>{children}</View>}
    </View>
  );
}

export const FilterSection = memo(FilterSectionComponent);
FilterSection.displayName = 'FilterSection';
