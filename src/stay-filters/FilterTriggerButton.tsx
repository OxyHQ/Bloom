import { useBloomAppearance } from '../appearance';
import React, { memo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { RiEqualizerLine } from '../icons/remix/RiEqualizerLine';
import { useMessages } from '../locale/messages';
import { STAY_FILTERS_MESSAGES } from './messages';
import type { FilterTriggerButtonProps } from './types';

/**
 * The button that opens the filters surface: Bloom's `outline` `Button` with
 * `RiEqualizerLine` before "Filters", and — while `count > 0` — a solid
 * text-colour count `Badge` over its top-right corner.
 *
 * The badge is a drawn number, so the button's name carries it too
 * ("Filters, 3 applied").
 */
function FilterTriggerButtonComponent({
  count = 0,
  onPress,
  label: labelProp,
  accessibilityLabel,
  size: sizeProp,
  disabled,
  style,
  testID,
}: FilterTriggerButtonProps) {
  const { size: inheritedSize } = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'neutral' });
  const size = inheritedSize;

  const { messages } = useMessages(STAY_FILTERS_MESSAGES);
  const label = labelProp ?? messages.filters;
  const applied = count > 0;
  const name = accessibilityLabel ?? (applied ? messages.filtersApplied(label, count) : label);

  const button = (
    <Button

      size={size}
      leadingIcon={RiEqualizerLine}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={name}
      testID={testID} tone="neutral" appearance="outline"
    >
      {label}
    </Button>
  );

  return (
    <View style={[{ alignSelf: 'flex-start' }, style]}>
      {applied ? (
        <Badge content={count} max={99} color="default" variant="solid" placement="top-right">
          {button}
        </Badge>
      ) : (
        button
      )}
    </View>
  );
}

export const FilterTriggerButton = memo(FilterTriggerButtonComponent);
FilterTriggerButton.displayName = 'FilterTriggerButton';
