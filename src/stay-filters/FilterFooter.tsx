import React, { memo } from 'react';
import { View } from 'react-native';

import { Button, LinkButton } from '../button';

import { useTheme } from '../theme/use-theme';
import { useMessages } from '../locale/messages';
import { STAY_FILTERS_MESSAGES } from './messages';
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
  clearLabel: clearLabelProp,
  clearDisabled = false,
  loading = false,
  applyDisabled = false,
  style,
  testID,
}: FilterFooterProps) {
  const { messages } = useMessages(STAY_FILTERS_MESSAGES);
  const clearLabel = clearLabelProp ?? messages.clearAll;
  const theme = useTheme();

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
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        },
        style,
      ]}
    >
      <LinkButton
        linkTone="text"
        underline="rest"
        size="sm"
        textVariant="body-semibold"
        style={{ paddingTop: 6, paddingBottom: 6, marginTop: -6, marginBottom: -6 }}
        onPress={onClear}
        disabled={clearDisabled}
        testID={testID ? `${testID}-clear` : undefined}
      >
        {clearLabel}
      </LinkButton>
      <Button
        size="lg"
        onPress={onApply}
        loading={loading}
        disabled={applyDisabled}
        accessibilityLabel={resultsLabel}
        testID={testID ? `${testID}-apply` : undefined}
        tone="accent"
        appearance="solid"
      >
        {resultsLabel}
      </Button>
    </View>
  );
}

export const FilterFooter = memo(FilterFooterComponent);
FilterFooter.displayName = 'FilterFooter';
