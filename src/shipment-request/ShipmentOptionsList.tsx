import React, { memo, useMemo } from 'react';
import { View, type TextStyle } from 'react-native';

import { Chip } from '../chip';
import { SettingsListGroup, SettingsListItem } from '../settings-list';
import { Switch } from '../switch';
import { TextFieldLabel } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { SHIPMENT_OPTIONS_LABELS, SHIPMENT_REQUEST_GEOMETRY } from './constants';
import { joinShipmentName, toggleShipmentExtra } from './shared';
import type { ShipmentOptionsListProps } from './types';

/**
 * The answers that change what a job costs.
 *
 * Three groups, and the CONTROL is the difference between them:
 *
 *   extras  independent of each other, so each is a `SettingsListItem` with a
 *           `Switch` and its own price at the end of the row. A switch is the
 *           control for "and also this"
 *   access  exactly one is true — a place is on the ground, up stairs, or has a
 *           lift — so they are a `radiogroup` of chips, and choosing one
 *           unchooses the rest without the user having to
 *   window  the same, over collection times
 *
 * **A PRICE HERE IS A STRING.** `"+€12.00"`, `"Included"` — drawn where the
 * option is and never added to anything. The running total belongs to
 * `PriceSummary`, which is what `ShipmentRequestForm` puts under this.
 *
 * **A SWITCH DRAWS NO TEXT**, so each one is named with its row's title and its
 * price: the caption beside a switch is a SIBLING on both platforms, and a
 * screen reader that reads only the control announces "switch, off".
 */

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

function ShipmentOptionsListComponent({
  extras,
  selectedExtras = [],
  onExtrasChange,
  accessOptions,
  access = null,
  onAccessChange,
  windows,
  window: windowId = null,
  onWindowChange,
  labels: labelOverrides,
  disabled = false,
  style,
  testID,
}: ShipmentOptionsListProps) {
  const theme = useTheme();
  const labels = useMemo(() => ({ ...SHIPMENT_OPTIONS_LABELS, ...labelOverrides }), [labelOverrides]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const chosen = new Set(selectedExtras);

  const priceText = (price: string | undefined) =>
    price === undefined ? null : (
      <Text
        variant="body-2-medium"
        numberOfLines={1}
        style={[{ color: theme.colors.textSecondary }, TABULAR]}
      >
        {price}
      </Text>
    );

  return (
    <View testID={testID} style={[{ gap: SHIPMENT_REQUEST_GEOMETRY.controlGap }, style]}>
      {extras?.length ? (
        <View style={{ gap: 8 }} testID={id('extras')}>
          <TextFieldLabel>{labels.extras}</TextFieldLabel>
          <SettingsListGroup>
            {extras.map((extra) => {
              const on = chosen.has(extra.key);
              const blocked = disabled || extra.disabled === true;
              const name = joinShipmentName([extra.title, extra.description, extra.price]);
              return (
                <SettingsListItem
                  key={extra.key}
                  icon={
                    extra.icon ? (
                      <extra.icon width={20} height={20} fill={theme.colors.text} />
                    ) : undefined
                  }
                  title={extra.title}
                  description={extra.description}
                  disabled={blocked}
                  // The ROW is not the control. A pressable row wrapping a
                  // switch is two targets for one answer, and on web the outer
                  // one is a button containing a checkbox.
                  showChevron={false}
                  rightElement={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {priceText(extra.price)}
                      <Switch
                        checked={on}
                        onCheckedChange={() =>
                          onExtrasChange?.(toggleShipmentExtra(extras, selectedExtras, extra.key))
                        }
                        disabled={blocked}
                        accessibilityLabel={name}
                        testID={id(`extra-${extra.key}`)}
                      />
                    </View>
                  }
                />
              );
            })}
          </SettingsListGroup>
        </View>
      ) : null}

      {accessOptions?.length ? (
        <View style={{ gap: 8 }}>
          <TextFieldLabel>{labels.access}</TextFieldLabel>
          <View
            role="radiogroup"
            accessibilityLabel={labels.access}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: SHIPMENT_REQUEST_GEOMETRY.chipGap,
            }}
            testID={id('access')}
          >
            {accessOptions.map((option) => (
              <Chip
                key={option.value}
                role="radio"
                size="xl"
                variant="outlined"
                selected={access === option.value}
                disabled={disabled || option.disabled}
                leadingIcon={option.icon}
                onPress={() => onAccessChange?.(option.value)}
                accessibilityLabel={joinShipmentName([option.label, option.price])}
                testID={id(`access-${option.value}`)}
              >
                {joinShipmentName([option.label, option.price], ' · ')}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}

      {windows?.length ? (
        <View style={{ gap: 8 }}>
          <TextFieldLabel>{labels.window}</TextFieldLabel>
          <View
            role="radiogroup"
            accessibilityLabel={labels.window}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: SHIPMENT_REQUEST_GEOMETRY.chipGap,
            }}
            testID={id('window')}
          >
            {windows.map((option) => (
              <Chip
                key={option.id}
                role="radio"
                size="xl"
                variant="outlined"
                selected={windowId === option.id}
                disabled={disabled || option.disabled}
                onPress={() => onWindowChange?.(option.id)}
                accessibilityLabel={joinShipmentName([option.label, option.price])}
                testID={id(`window-${option.id}`)}
              >
                {joinShipmentName([option.label, option.price], ' · ')}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export const ShipmentOptionsList = memo(ShipmentOptionsListComponent);
ShipmentOptionsList.displayName = 'ShipmentOptionsList';
