import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { useTheme } from '../theme/use-theme';
import { FilterTextButton } from './FilterTextButton';
import type { FilterFooterProps } from './types';

/**
 * The action bar under a filters surface.
 *
 *   bar     1px hairline on top (neutral-200, dark neutral-800), page
 *           background, py 16 px 24
 *   left    "Clear all" — underlined body-semibold text-primary
 *   right   primary `Button` at `large`, labelled by `resultsLabel`; `loading`
 *           is the Button's own loading state (spinner, width kept, presses
 *           ignored) while the count is fetched
 *
 * It is sticky by PLACEMENT, not by positioning: render it after the scrolling
 * body, outside it, so it stays put while the sections scroll (see the docs).
 */
function FilterFooterComponent({
  resultsLabel,
  onApply,
  onClear,
  clearLabel = 'Clear all',
  clearDisabled = false,
  loading = false,
  applyDisabled = false,
  style,
  testID,
}: FilterFooterProps) {
  const theme = useTheme();
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 24,
          paddingRight: 24,
          borderTopWidth: 1,
          borderTopColor: theme.isDark ? neutral[800] : neutral[200],
          backgroundColor: theme.colors.background,
        },
        style,
      ]}
    >
      <FilterTextButton
        label={clearLabel}
        onPress={onClear}
        disabled={clearDisabled}
        testID={testID ? `${testID}-clear` : undefined}
      />
      <Button
        variant="primary"
        size="large"
        onPress={onApply}
        loading={loading}
        disabled={applyDisabled}
        accessibilityLabel={resultsLabel}
        testID={testID ? `${testID}-apply` : undefined}
      >
        {resultsLabel}
      </Button>
    </View>
  );
}

export const FilterFooter = memo(FilterFooterComponent);
FilterFooter.displayName = 'FilterFooter';
