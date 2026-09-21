import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { PaymentMethodMark } from '../payment-method';
import {
  CardFormCountry,
  CardFormExpiry,
  CardFormName,
  CardFormNumber,
  CardFormPostcode,
  CardFormSecurityCode,
} from './CardFormParts';
import { CARD_FORM_EMPTY_VALUE, CARD_FORM_GAP, CARD_FORM_LABELS } from './constants';
import { matchCardScheme, cardDigits, schemeSecurityCodeLength } from './shared';
import type { CardFormFieldName, CardFormProps, CardFormValue } from './types';

/**
 * THE WHOLE CARD, AND NONE OF THE CARD.
 *
 * This is an input surface and nothing else. It does not validate a live
 * primary account number beyond its length and its check digit, it ships no
 * table of schemes, it stores nothing, logs nothing and opens no connection.
 * The value belongs to the app and goes to the app's own payment SDK; what this
 * draws is six boxes, their grouping, their caret behaviour and their messages.
 * `docs/card-form.mdx` says it where a consumer will read it, and it is the
 * first thing that page says.
 *
 * ## The layout
 *
 *   number             full width, the detected mark at the end of its label row
 *   expiry · code      one line, equal halves, 12 apart
 *   name               full width, when `fields.name` (default on)
 *   country · postcode one line, when either is asked for
 *
 * The pair rows are `flexBasis: 0` rather than a minimum width, so a narrow
 * container shrinks them evenly instead of overflowing — a card form is drawn
 * in a sheet as often as on a page.
 *
 * ## Every box is a `Field` member in its own right
 *
 * Each part reads `useFieldMembership()`, so any one of them can be put in a
 * `Field` and take its label, id, description, error and disabled state.
 *
 * **A `Field` around the WHOLE form must be `multiple`.** A single-control
 * field publishes one control id, and six inputs carrying one id is invalid
 * HTML and an error announced six times. `multiple` makes the field a labelled
 * `group`, publishes no id, and each box keeps its own — which is the shape
 * this form is.
 */
function CardFormComponent({
  value,
  defaultValue,
  onValueChange,
  schemes,
  onSchemeChange,
  errors,
  labels,
  fields,
  countries,
  disabled,
  required,
  autoFocus,
  secureSecurityCode = false,
  accessibilityLabel,
  style,
  testID,
}: CardFormProps) {
  const controlled = useMemo(
    () => (value === undefined ? undefined : { ...CARD_FORM_EMPTY_VALUE, ...value }),
    [value],
  );
  const initial = useRef<CardFormValue>({ ...CARD_FORM_EMPTY_VALUE, ...defaultValue });
  const [current, setCurrent] = useControllableState<CardFormValue>({
    value: controlled,
    defaultValue: initial.current,
    onChange: onValueChange,
  });

  const set = useCallback(
    (key: CardFormFieldName) => (next: string) => setCurrent({ ...current, [key]: next }),
    [setCurrent, current],
  );

  const digits = cardDigits(current.number);
  const scheme = useMemo(() => matchCardScheme(digits, schemes), [digits, schemes]);

  // Reported by ID: a caller that rebuilds `schemes` each render hands back a
  // fresh match object every time, and an effect keyed on the object would
  // report a change that did not happen.
  const schemeId = scheme?.id;
  const lastSchemeId = useRef(schemeId);
  useEffect(() => {
    if (lastSchemeId.current === schemeId) return;
    lastSchemeId.current = schemeId;
    onSchemeChange?.(scheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeId]);

  const word = (key: CardFormFieldName): string => labels?.[key] ?? CARD_FORM_LABELS[key];
  const showName = fields?.name !== false;
  const showPostcode = fields?.postcode === true;
  const showCountry = fields?.country === true && countries !== undefined;
  const pair = { flexBasis: 0, flexGrow: 1, minWidth: 0 } as const;

  return (
    <View
      style={[{ width: '100%', gap: CARD_FORM_GAP }, style]}
      {...(accessibilityLabel ? { role: 'group' as const, accessibilityLabel } : {})}
      testID={testID}
    >
      <CardFormNumber
        value={current.number}
        onValueChange={set('number')}
        label={word('number')}
        error={errors?.number}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        schemes={schemes}
        scheme={scheme}
        mark={
          // The SCHEME'S NAME as text on a neutral plate — never its logo.
          // `payment-method` owns that rule and this form borrows the component
          // rather than drawing a second plate of its own.
          <PaymentMethodMark
            kind="card"
            scheme={scheme?.name}
            icon={scheme?.icon}
            image={scheme?.image}
            density="compact"
            testID={testID ? `${testID}-mark` : undefined}
          />
        }
        testID={testID ? `${testID}-number` : undefined}
      />

      <View style={{ flexDirection: 'row', gap: CARD_FORM_GAP, minWidth: 0 }}>
        <View style={pair}>
          <CardFormExpiry
            value={current.expiry}
            onValueChange={set('expiry')}
            label={word('expiry')}
            error={errors?.expiry}
            disabled={disabled}
            required={required}
            testID={testID ? `${testID}-expiry` : undefined}
          />
        </View>
        <View style={pair}>
          <CardFormSecurityCode
            value={current.securityCode}
            onValueChange={set('securityCode')}
            label={scheme?.securityCodeLabel ?? word('securityCode')}
            error={errors?.securityCode}
            disabled={disabled}
            required={required}
            length={schemeSecurityCodeLength(scheme)}
            secure={secureSecurityCode}
            testID={testID ? `${testID}-security-code` : undefined}
          />
        </View>
      </View>

      {showName ? (
        <CardFormName
          value={current.name}
          onValueChange={set('name')}
          label={word('name')}
          error={errors?.name}
          disabled={disabled}
          required={required}
          testID={testID ? `${testID}-name` : undefined}
        />
      ) : null}

      {showCountry || showPostcode ? (
        <View style={{ flexDirection: 'row', gap: CARD_FORM_GAP, minWidth: 0 }}>
          {showCountry ? (
            <View style={pair}>
              <CardFormCountry
                value={current.country}
                onValueChange={set('country')}
                label={word('country')}
                error={errors?.country}
                disabled={disabled}
                required={required}
                countries={countries}
                testID={testID ? `${testID}-country` : undefined}
              />
            </View>
          ) : null}
          {showPostcode ? (
            <View style={pair}>
              <CardFormPostcode
                value={current.postcode}
                onValueChange={set('postcode')}
                label={word('postcode')}
                error={errors?.postcode}
                disabled={disabled}
                required={required}
                testID={testID ? `${testID}-postcode` : undefined}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export const CardForm = memo(CardFormComponent);
CardForm.displayName = 'CardForm';
