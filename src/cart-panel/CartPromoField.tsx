import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { Chip } from '../chip';
import { Field } from '../field';
import { RiTicketLine } from '../icons/remix/RiTicketLine';
import { InputGroup, InputGroupAddon } from '../input-group';
import { useSurfaceFill } from '../styles/surface-levels';
import { TextFieldInput } from '../text-field';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { resolveCartPaint } from './shared';
import type { CartPromoFieldProps } from './types';

/** The ticket glyph in an applied code's pill, at the `xl` chip's icon rung. */
const PROMO_GLYPH = 16;

/**
 * A promo code: type it, apply it, and see it once it is on.
 *
 *   empty    `InputGroup` — a `TextFieldInput` with the apply button as a
 *            divided addon, so the code and the action share one shell and one
 *            focus ring
 *   applied  the input is REPLACED by a removable pill. A field still holding a
 *            code that has already been accepted invites a reader to press
 *            Apply again and wonder why nothing happened.
 *   rejected `error` on the `Field`, which paints the group invalid and wires
 *            `aria-describedby` to the message — both through the field
 *            contract rather than by hand.
 *
 * The apply button is disabled while the field is blank: an Apply that can only
 * fail is a control that teaches a reader to distrust it. Whether a code is
 * VALID is the app's to say, and it says it by handing back `error` or
 * `applied`.
 */
function CartPromoFieldComponent({
  value,
  onChangeText,
  onApply,
  applied,
  onRemove,
  removeLabel,
  label = 'Promo code',
  placeholder,
  applyLabel = 'Apply',
  error,
  disabled = false,
  style,
  testID,
}: CartPromoFieldProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveCartPaint(theme, surface), [theme, surface]);
  // The pill's glyph is painted by the caller — `Chip` renders `startIcon` as
  // given — so it is read from the same recipe the pill's own label comes from.
  const glyph = resolveAccentColors(theme.colors, 'success', 'subtle').foreground;

  if (applied) {
    return (
      <Field label={label} disabled={disabled} style={style} testID={testID}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Chip
            size="xl"
            variant="subtle"
            color="success"
            surface={paint.wash}
            startIcon={<RiTicketLine width={PROMO_GLYPH} height={PROMO_GLYPH} fill={glyph} />}
            onClose={disabled ? undefined : onRemove}
            closeLabel={removeLabel ?? `Remove ${applied}`}
            testID={testID ? `${testID}-applied` : undefined}
          >
            {applied}
          </Chip>
        </View>
      </Field>
    );
  }

  return (
    <Field label={label} error={error} disabled={disabled} style={style} testID={testID}>
      <InputGroup disabled={disabled} testID={testID ? `${testID}-group` : undefined}>
        <TextFieldInput
          label={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          disabled={disabled}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onApply}
          testID={testID ? `${testID}-input` : undefined}
        />
        <InputGroupAddon divider noPadding>
          <Button
            variant="ghost"
            size="small"
            onPress={onApply}
            disabled={disabled || value.trim() === ''}
            testID={testID ? `${testID}-apply` : undefined}
          >
            {applyLabel}
          </Button>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

export const CartPromoField = memo(CartPromoFieldComponent);
CartPromoField.displayName = 'CartPromoField';
