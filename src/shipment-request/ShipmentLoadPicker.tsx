import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { useContainerWidth } from '../hooks/use-container-width';
import { resolveSelectionPaint, SelectionCard } from '../listing-editor/SelectionCard';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { StepperRow } from '../stepper';
import { TextField, TextFieldHint, TextFieldInput, TextFieldLabel, TextFieldSuffix } from '../text-field';
import { Textarea } from '../textarea';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { SHIPMENT_LOAD_KINDS, SHIPMENT_LOAD_LABELS, SHIPMENT_LOAD_SIZES, SHIPMENT_REQUEST_GEOMETRY } from './constants';
import { joinShipmentName, sanitizeWeight } from './shared';
import type { ShipmentLoadPickerProps, ShipmentLoadSize } from './types';

/**
 * What is being moved, how big it is, how heavy and how many.
 *
 *   kind      the editor's selectable cards, one answer: a 44 icon tile, the
 *             kind at `headline-semibold`, what it covers under it, a radio
 *             indicator on the right
 *   size      a `SegmentedControl` of single letters, with the chosen rung's
 *             sentence under it — four words never fit in one control at phone
 *             width, and a control whose every option carries a sentence is a
 *             list, not a segmented control
 *   weight    a `TextField` with its unit as a `TextFieldSuffix`, beside the
 *             quantity from 480 wide and stacked under it below
 *   quantity  a `StepperRow` from 1
 *   notes     an auto-resizing `Textarea`, drawn only when asked for
 *
 * **THE VALUE IS ONE OBJECT AND IT ARRIVES WHOLE.** `onValueChange` is called
 * with the next `ShipmentLoad`, never with a patch: a form that merges patches
 * in four places has four chances to drop a field, and this one has none.
 *
 * **THE UNIT IS NOT PART OF THE VALUE.** `weight` holds digits and at most one
 * dot (`sanitizeWeight`), so an app parses a number; the "kg" beside it is
 * drawn, announced, and never stored.
 *
 * Validation is the app's. `errors` is keyed by field and each message sits
 * under its own control, in the error colour — the kind's under the cards.
 */

function ShipmentLoadPickerComponent({
  value,
  onValueChange,
  kinds = SHIPMENT_LOAD_KINDS,
  sizes = SHIPMENT_LOAD_SIZES,
  notes = false,
  maxQuantity = 20,
  errors = {},
  labels: labelOverrides,
  disabled = false,
  style,
  testID,
}: ShipmentLoadPickerProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveSelectionPaint(theme), [theme]);
  const labels = useMemo(() => ({ ...SHIPMENT_LOAD_LABELS, ...labelOverrides }), [labelOverrides]);
  const { width, onLayout } = useContainerWidth();
  const wide = width === null || width >= SHIPMENT_REQUEST_GEOMETRY.narrowWidth;
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const chosenSize = sizes.find((size) => size.value === value.size);

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[{ gap: SHIPMENT_REQUEST_GEOMETRY.controlGap }, style]}
    >
      <View style={{ gap: 8 }}>
        <TextFieldLabel>{labels.kind}</TextFieldLabel>
        <View
          role="radiogroup"
          accessibilityLabel={labels.kind}
          style={{ gap: 12 }}
          testID={id('kind')}
        >
          {kinds.map((kind) => (
            <SelectionCard
              key={kind.value}
              selection="single"
              selected={value.kind === kind.value}
              onPress={() => {
                if (value.kind !== kind.value) onValueChange({ ...value, kind: kind.value });
              }}
              title={kind.label}
              description={kind.description}
              icon={kind.icon}
              compact={!wide}
              disabled={disabled || kind.disabled === true}
              accessibilityLabel={joinShipmentName([kind.label, kind.description])}
              testID={id(`kind-${kind.value}`)}
            />
          ))}
        </View>
        {errors.kind ? (
          <TextFieldHint isInvalid>{errors.kind}</TextFieldHint>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <TextFieldLabel>{labels.size}</TextFieldLabel>
        {/* `''` is "nothing chosen yet": the control's value is required, and a
            sentinel that matches no segment is the honest way to say a
            single-choice control has not been answered. */}
        <SegmentedControl<ShipmentLoadSize | ''>
          type="radio"
          label={labels.size}
          value={value.size ?? ''}
          onValueChange={(size) => {
            if (size !== '') onValueChange({ ...value, size });
          }}
          disabled={disabled}
          style={{ alignSelf: 'stretch' }}
          testID={id('size')}
        >
          {sizes.map((size) => (
            <SegmentedControlItem
              key={size.value}
              value={size.value}
              disabled={disabled || size.disabled}
              accessibilityLabel={joinShipmentName([size.label, size.detail])}
              testID={id(`size-${size.value}`)}
            >
              <SegmentedControlItemText>{size.label}</SegmentedControlItemText>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        {chosenSize?.detail ? (
          <Text
            variant="body-2-regular"
            style={{ color: paint.textSecondary }}
            testID={id('size-detail')}
          >
            {chosenSize.detail}
          </Text>
        ) : null}
        {errors.size ? (
          <TextFieldHint isInvalid>{errors.size}</TextFieldHint>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: wide ? 'row' : 'column',
          // The stepper has no label above it, so on a wide form the two
          // columns line up on their BOTTOM edge — the field and the counter,
          // not the field and the word above it.
          alignItems: wide ? 'flex-end' : 'stretch',
          gap: SHIPMENT_REQUEST_GEOMETRY.controlGap,
        }}
      >
        <View
          style={[
            { gap: 8 },
            wide ? { width: SHIPMENT_REQUEST_GEOMETRY.weightWidth } : null,
          ]}
        >
          <TextFieldLabel>{labels.weight}</TextFieldLabel>
          <TextField isInvalid={!!errors.weight} disabled={disabled}>
            <TextFieldInput
              label={labels.weight}
              placeholder={null}
              value={value.weight}
              onChangeText={(text) => onValueChange({ ...value, weight: sanitizeWeight(text) })}
              keyboardType="decimal-pad"
              inputMode="decimal"
              isInvalid={!!errors.weight}
              disabled={disabled}
              testID={id('weight')}
            />
            <TextFieldSuffix label={labels.weightUnit}>{labels.weightUnit}</TextFieldSuffix>
          </TextField>
          {errors.weight ? (
            <TextFieldHint isInvalid>{errors.weight}</TextFieldHint>
          ) : null}
        </View>

        <View style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: 8 }}>
          <StepperRow
            title={labels.quantity}
            value={value.quantity}
            onValueChange={(quantity) => onValueChange({ ...value, quantity })}
            min={1}
            max={maxQuantity}
            formatValue={labels.quantityValue}
            size="small"
            disabled={disabled}
            style={{ paddingTop: 0, paddingBottom: 0 }}
            testID={id('quantity')}
          />
          {errors.quantity ? (
            <TextFieldHint isInvalid>{errors.quantity}</TextFieldHint>
          ) : null}
        </View>
      </View>

      {notes ? (
        <Textarea
          label={labels.notes}
          placeholder={labels.notesPlaceholder}
          value={value.notes ?? ''}
          onChangeText={(text) => onValueChange({ ...value, notes: text })}
          rows={3}
          autoResize
          maxRows={6}
          disabled={disabled}
          testID={id('notes')}
        />
      ) : null}
    </View>
  );
}

export const ShipmentLoadPicker = memo(ShipmentLoadPickerComponent);
ShipmentLoadPicker.displayName = 'ShipmentLoadPicker';
