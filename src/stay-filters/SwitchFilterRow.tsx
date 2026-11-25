import React, { memo } from 'react';
import { View } from 'react-native';

import { Switch } from '../switch';
import { useColorTokens } from '../theme/color-tokens';
import { Text } from '../typography';
import type { SwitchFilterRowProps } from './types';

/**
 * An on/off filter ("Instant Book"): title (body-medium, text-primary) over an
 * optional description (body-regular, text-secondary) on the left, Bloom's
 * `Switch` on the right, 16 between them and the pair vertically centred.
 *
 * The caption beside a switch is a SIBLING, never its label, so the switch is
 * named explicitly — by `accessibilityLabel`, or the string `title`.
 */
function SwitchFilterRowComponent({
  title,
  description,
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
  style,
  testID,
}: SwitchFilterRowProps) {
  const tokens = useColorTokens();
  const name = accessibilityLabel ?? (typeof title === 'string' ? title : undefined);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 16 }, style]}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {typeof title === 'string' ? (
          <Text variant="body-medium" style={{ color: tokens.foreground }}>
            {title}
          </Text>
        ) : (
          title
        )}
        {description == null ? null : typeof description === 'string' ? (
          <Text variant="body-regular" style={{ color: tokens.mutedForeground }}>
            {description}
          </Text>
        ) : (
          description
        )}
      </View>
      <Switch
        checked={value}
        onCheckedChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={name}
        testID={testID}
      />
    </View>
  );
}

export const SwitchFilterRow = memo(SwitchFilterRowComponent);
SwitchFilterRow.displayName = 'SwitchFilterRow';
