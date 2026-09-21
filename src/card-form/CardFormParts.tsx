import React, { memo, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { View } from 'react-native';

import { FieldControlProvider, type FieldControlValue } from '../field/context';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import { TextField, TextFieldHint, TextFieldInput, TextFieldLabel } from '../text-field';
import { TEXT_FIELD_RADIUS } from '../text-field/shared';
import { CARD_FORM_LABELS, CARD_FORM_PLACEHOLDERS } from './constants';
import {
  applyCardExpiryEdit,
  applyCardNumberEdit,
  cardDigits,
  matchCardScheme,
  normaliseCardExpiry,
  normaliseCardNumber,
  schemeGroups,
  schemeMaxDigits,
  schemeSecurityCodeLength,
} from './shared';
import { useCardFormPart, type CardFormPartMembership } from './use-card-form-part';
import type {
  CardFormCountryProps,
  CardFormExpiryProps,
  CardFormNameProps,
  CardFormNumberProps,
  CardFormPostcodeProps,
  CardFormSecurityCodeProps,
} from './types';

/**
 * WHAT THE BOX RE-PUBLISHES TO THE PRIMITIVE INSIDE IT.
 *
 * `TextFieldInput` and `SelectTrigger` read the enclosing `Field` themselves,
 * and `TextFieldInput` resolves its name as `field.labelText ?? label` — a
 * chain with no step for a name the CALLER wrote. Left alone, a box's
 * `accessibilityLabel` would be outranked by the container's label, which is
 * the one direction `docs/composition.mdx` says must never be reversed, and the
 * rule would be resolved twice on two different inputs.
 *
 * So the box resolves membership ONCE, through `useCardFormPart`, and
 * re-publishes the answer: the same id, the same described ids (its own message
 * already joined), the same invalid, required and disabled state — and NO
 * `labelText`, because the name has been decided and the primitive must not
 * decide it again.
 *
 * This is a re-publication, not a shadow: everything the field said still
 * reaches the control, and the state that RESTRICTS has already been combined
 * with `||`, so nothing inside can re-enable itself.
 */
function republish(member: CardFormPartMembership): FieldControlValue {
  return {
    controlId: member.nativeID,
    describedBy: member.describedBy,
    invalid: member.invalid,
    required: member.required,
    disabled: member.disabled,
  };
}

/**
 * The shell every text box shares: the label row (with room for the mark at its
 * end), the field chrome, and the box's own message under it.
 */
function PartShell({
  member,
  label,
  error,
  mark,
  children,
  style,
  testID,
}: {
  member: CardFormPartMembership;
  label?: string;
  error?: string;
  mark?: ReactNode;
  children: ReactNode;
  style?: CardFormNumberProps['style'];
  testID?: string;
}) {
  return (
    <View style={[{ width: '100%', minWidth: 0 }, style]} testID={testID}>
      {label || mark ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            minWidth: 0,
          }}
        >
          {label ? (
            <TextFieldLabel required={member.required}>{label}</TextFieldLabel>
          ) : (
            <View />
          )}
          {mark}
        </View>
      ) : null}
      <FieldControlProvider value={republish(member)}>{children}</FieldControlProvider>
      {member.hasError ? (
        <TextFieldHint invalid nativeID={member.errorId}>
          {error}
        </TextFieldHint>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  The number
// ---------------------------------------------------------------------------

/**
 * The card number: grouped as it is typed, **never re-grouped behind the
 * caret** (the rule, and why it matters, is in `shared.ts`), with the scheme
 * detected from the digits and reported up.
 *
 * It holds nothing. `value` is the string the caller owns, `onValueChange` is
 * the already-grouped string to store, and no copy of either survives this
 * component.
 */
function CardFormNumberComponent({
  value = '',
  onValueChange,
  label,
  accessibilityLabel,
  error,
  invalid,
  disabled,
  required,
  placeholder,
  autoFocus,
  nativeID,
  onFocus,
  onBlur,
  schemes,
  scheme: schemeProp,
  onSchemeChange,
  mark,
  style,
  testID,
}: CardFormNumberProps) {
  const member = useCardFormPart({
    accessibilityLabel,
    label,
    error,
    invalid,
    disabled,
    required,
    nativeID,
    fallbackName: CARD_FORM_LABELS.number,
  });
  const digits = cardDigits(value);
  const detected = useMemo(
    () => schemeProp ?? matchCardScheme(digits, schemes),
    [schemeProp, digits, schemes],
  );
  const groups = schemeGroups(detected);
  const maxDigits = schemeMaxDigits(detected);

  // Reported by ID, not by identity: a caller that rebuilds its `schemes` array
  // each render hands back a fresh match object every time, and an effect keyed
  // on the object would report a change that did not happen.
  const schemeId = detected?.id;
  const lastSchemeId = useRef(schemeId);
  useEffect(() => {
    if (lastSchemeId.current === schemeId) return;
    lastSchemeId.current = schemeId;
    onSchemeChange?.(detected);
    // `detected` is derived from `schemeId`, which is the dependency that can
    // actually change; listing it too would re-run this on every new array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeId]);

  const handleChange = useCallback(
    (next: string) => {
      onValueChange?.(applyCardNumberEdit(value, next, groups, maxDigits));
    },
    [onValueChange, value, groups, maxDigits],
  );

  const handleBlur = useCallback(() => {
    const tidy = normaliseCardNumber(value, groups);
    if (tidy !== value) onValueChange?.(tidy);
    onBlur?.();
  }, [onValueChange, value, groups, onBlur]);

  return (
    <PartShell member={member} label={label} error={error} mark={mark} style={style} testID={testID}>
      <TextField invalid={member.invalid} disabled={member.disabled}>
        <TextFieldInput
          label={member.name}
          nativeID={member.nativeID}
          aria-describedby={member.describedBy}
          aria-required={member.required || undefined}
          value={value}
          onChangeText={handleChange}
          onBlur={handleBlur}
          onFocus={onFocus}
          invalid={member.invalid}
          disabled={member.disabled}
          placeholder={placeholder ?? null}
          autoFocus={autoFocus}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="cc-number"
          textContentType="creditCardNumber"
          testID={testID ? `${testID}-input` : undefined}
        />
      </TextField>
    </PartShell>
  );
}

export const CardFormNumber = memo(CardFormNumberComponent);
CardFormNumber.displayName = 'CardFormNumber';

// ---------------------------------------------------------------------------
//  The expiry
// ---------------------------------------------------------------------------

/** The expiry: two digits, a slash, two digits — under the same caret rule. */
function CardFormExpiryComponent({
  value = '',
  onValueChange,
  label,
  accessibilityLabel,
  error,
  invalid,
  disabled,
  required,
  placeholder,
  autoFocus,
  nativeID,
  onFocus,
  onBlur,
  style,
  testID,
}: CardFormExpiryProps) {
  const member = useCardFormPart({
    accessibilityLabel,
    label,
    error,
    invalid,
    disabled,
    required,
    nativeID,
    fallbackName: CARD_FORM_LABELS.expiry,
  });

  const handleChange = useCallback(
    (next: string) => onValueChange?.(applyCardExpiryEdit(value, next)),
    [onValueChange, value],
  );
  const handleBlur = useCallback(() => {
    const tidy = normaliseCardExpiry(value);
    if (tidy !== value) onValueChange?.(tidy);
    onBlur?.();
  }, [onValueChange, value, onBlur]);

  return (
    <PartShell member={member} label={label} error={error} style={style} testID={testID}>
      <TextField invalid={member.invalid} disabled={member.disabled}>
        <TextFieldInput
          label={member.name}
          nativeID={member.nativeID}
          aria-describedby={member.describedBy}
          aria-required={member.required || undefined}
          value={value}
          onChangeText={handleChange}
          onBlur={handleBlur}
          onFocus={onFocus}
          invalid={member.invalid}
          disabled={member.disabled}
          placeholder={placeholder ?? CARD_FORM_PLACEHOLDERS.expiry}
          autoFocus={autoFocus}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="cc-exp"
          testID={testID ? `${testID}-input` : undefined}
        />
      </TextField>
    </PartShell>
  );
}

export const CardFormExpiry = memo(CardFormExpiryComponent);
CardFormExpiry.displayName = 'CardFormExpiry';

// ---------------------------------------------------------------------------
//  The security code
// ---------------------------------------------------------------------------

/**
 * The security code. `length` is the scheme's, because the only thing this box
 * knows about a code is how many digits it has.
 */
function CardFormSecurityCodeComponent({
  value = '',
  onValueChange,
  label,
  accessibilityLabel,
  error,
  invalid,
  disabled,
  required,
  placeholder,
  autoFocus,
  nativeID,
  onFocus,
  onBlur,
  length = schemeSecurityCodeLength(),
  secure = false,
  style,
  testID,
}: CardFormSecurityCodeProps) {
  const member = useCardFormPart({
    accessibilityLabel,
    label,
    error,
    invalid,
    disabled,
    required,
    nativeID,
    fallbackName: CARD_FORM_LABELS.securityCode,
  });

  const handleChange = useCallback(
    (next: string) => onValueChange?.(cardDigits(next).slice(0, length)),
    [onValueChange, length],
  );

  return (
    <PartShell member={member} label={label} error={error} style={style} testID={testID}>
      <TextField invalid={member.invalid} disabled={member.disabled}>
        <TextFieldInput
          label={member.name}
          nativeID={member.nativeID}
          aria-describedby={member.describedBy}
          aria-required={member.required || undefined}
          value={value}
          onChangeText={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          invalid={member.invalid}
          disabled={member.disabled}
          placeholder={placeholder ?? CARD_FORM_PLACEHOLDERS.securityCode}
          autoFocus={autoFocus}
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="cc-csc"
          secureTextEntry={secure}
          maxLength={length}
          testID={testID ? `${testID}-input` : undefined}
        />
      </TextField>
    </PartShell>
  );
}

export const CardFormSecurityCode = memo(CardFormSecurityCodeComponent);
CardFormSecurityCode.displayName = 'CardFormSecurityCode';

// ---------------------------------------------------------------------------
//  The name and the postcode — plain text, formatted by nothing
// ---------------------------------------------------------------------------

/** The name on the card. Never reformatted: a name is not a number. */
function CardFormNameComponent({
  value = '',
  onValueChange,
  label,
  accessibilityLabel,
  error,
  invalid,
  disabled,
  required,
  placeholder,
  autoFocus,
  nativeID,
  onFocus,
  onBlur,
  style,
  testID,
}: CardFormNameProps) {
  const member = useCardFormPart({
    accessibilityLabel,
    label,
    error,
    invalid,
    disabled,
    required,
    nativeID,
    fallbackName: CARD_FORM_LABELS.name,
  });

  return (
    <PartShell member={member} label={label} error={error} style={style} testID={testID}>
      <TextField invalid={member.invalid} disabled={member.disabled}>
        <TextFieldInput
          label={member.name}
          nativeID={member.nativeID}
          aria-describedby={member.describedBy}
          aria-required={member.required || undefined}
          value={value}
          onChangeText={onValueChange}
          onBlur={onBlur}
          onFocus={onFocus}
          invalid={member.invalid}
          disabled={member.disabled}
          placeholder={placeholder ?? null}
          autoFocus={autoFocus}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="name"
          textContentType="name"
          testID={testID ? `${testID}-input` : undefined}
        />
      </TextField>
    </PartShell>
  );
}

export const CardFormName = memo(CardFormNameComponent);
CardFormName.displayName = 'CardFormName';

/**
 * The billing postcode. Not uppercased, not stripped of spaces, not validated:
 * postcodes are alphanumeric in most of the world and spaced differently in all
 * of it, and a component that "tidied" one would be wrong somewhere.
 */
function CardFormPostcodeComponent({
  value = '',
  onValueChange,
  label,
  accessibilityLabel,
  error,
  invalid,
  disabled,
  required,
  placeholder,
  autoFocus,
  nativeID,
  onFocus,
  onBlur,
  style,
  testID,
}: CardFormPostcodeProps) {
  const member = useCardFormPart({
    accessibilityLabel,
    label,
    error,
    invalid,
    disabled,
    required,
    nativeID,
    fallbackName: CARD_FORM_LABELS.postcode,
  });

  return (
    <PartShell member={member} label={label} error={error} style={style} testID={testID}>
      <TextField invalid={member.invalid} disabled={member.disabled}>
        <TextFieldInput
          label={member.name}
          nativeID={member.nativeID}
          aria-describedby={member.describedBy}
          aria-required={member.required || undefined}
          value={value}
          onChangeText={onValueChange}
          onBlur={onBlur}
          onFocus={onFocus}
          invalid={member.invalid}
          disabled={member.disabled}
          placeholder={placeholder ?? null}
          autoFocus={autoFocus}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="postal-code"
          textContentType="postalCode"
          testID={testID ? `${testID}-input` : undefined}
        />
      </TextField>
    </PartShell>
  );
}

export const CardFormPostcode = memo(CardFormPostcodeComponent);
CardFormPostcode.displayName = 'CardFormPostcode';

// ---------------------------------------------------------------------------
//  The country
// ---------------------------------------------------------------------------

/**
 * The billing country, as a `Select` — Bloom's own, so the trigger carries the
 * field wiring `SelectTrigger` already implements and the list gets the
 * keyboard model and the overlay stacking with it.
 *
 * The countries are the CALLER'S list. Bloom ships none here for the same
 * reason `phone-input` keeps its own out of the root barrel: a country list is
 * data an app curates, sorts and translates.
 */
function CardFormCountryComponent({
  value,
  onValueChange,
  label,
  accessibilityLabel,
  error,
  invalid,
  disabled,
  required,
  nativeID,
  countries,
  placeholder = 'Select a country',
  style,
  testID,
}: CardFormCountryProps) {
  const member = useCardFormPart({
    accessibilityLabel,
    label,
    error,
    invalid,
    disabled,
    required,
    nativeID,
    fallbackName: CARD_FORM_LABELS.country,
  });
  const items = useMemo(() => countries.map((country) => ({ ...country })), [countries]);

  return (
    <View style={[{ width: '100%', minWidth: 0 }, style]} testID={testID}>
      {label ? <TextFieldLabel required={member.required}>{label}</TextFieldLabel> : null}
      <FieldControlProvider value={republish(member)}>
        <Select value={value} onValueChange={onValueChange} disabled={member.disabled}>
          <SelectTrigger
            label={member.name}
            disabled={member.disabled}
            // The trigger sits BESIDE a text box on the same line, and a pill
            // next to a 10-radius box reads as two different controls. It is
            // the override `SelectTrigger` documents for exactly this — a
            // trigger embedded in another control — and it is the field's own
            // radius, not a number picked here.
            fieldStyle={{ borderRadius: TEXT_FIELD_RADIUS }}
            testID={testID ? `${testID}-trigger` : undefined}
          >
            <SelectValue placeholder={placeholder} />
            <SelectIcon />
          </SelectTrigger>
          <SelectContent
            label={member.name}
            items={items}
            renderItem={(item) => (
              <SelectItem value={item.value} label={item.label}>
                <SelectItemIndicator />
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            )}
          />
        </Select>
      </FieldControlProvider>
      {member.hasError ? (
        <TextFieldHint invalid nativeID={member.errorId}>
          {error}
        </TextFieldHint>
      ) : null}
    </View>
  );
}

export const CardFormCountry = memo(CardFormCountryComponent);
CardFormCountry.displayName = 'CardFormCountry';
