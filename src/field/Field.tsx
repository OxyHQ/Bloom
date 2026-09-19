import React, { memo, useId, useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '../typography';
import { Label } from '../label';
import { atoms as a } from '../styles';
import { TEXT_FIELD_STACK_GAP, useTextFieldPalette } from '../text-field/shared';
import { FieldControlProvider, type FieldControlValue } from './context';
import type { FieldProps } from './types';

/**
 * The field stack — `Label`, the control, `HintText` — around ANY control.
 *
 * Standalone form-field wrapper: an optional `Label`, the control (passed as
 * `children`), and a description **or** error message below it. Composes
 * Bloom's `Label`. Unlike `TextField` — which bakes its label/error into the
 * input chrome — `Field` wraps any arbitrary control (a `Switch`, a
 * `SegmentedControl`, a custom picker, etc.).
 *
 * ── IT ASSOCIATES, IT DOES NOT ONLY STACK ───────────────────────────────────
 *
 * The three pieces are wired to the control through `field/context.ts`: the
 * control's id, `aria-describedby` for whichever of description/error is
 * showing, the invalid state, the required state and the disabled state. A
 * control opts in by reading `useFieldControl()`; one that does not renders
 * exactly as before. Ids are generated from `useId` when the caller gives no
 * `nativeID`, so they survive SSR and hydration.
 *
 * `multiple` is the several-controls case — a radio set, a date's three boxes.
 * The field becomes a labelled `group` and stops handing out a control id,
 * because one id on three inputs is invalid and one error described by three
 * inputs is read three times.
 */
/** `HintText`: 4px under the control (`gap-1`) plus its own 1px `pt-px`. */
const hintStyle = { marginTop: TEXT_FIELD_STACK_GAP, paddingTop: 1 } as const;

const FieldComponent = function Field({
  children,
  label,
  description,
  error,
  required = false,
  disabled = false,
  multiple = false,
  nativeID,
  style,
  testID,
}: FieldProps) {
  const palette = useTextFieldPalette();
  const hasError = typeof error === 'string' && error.length > 0;
  // `useId` is the seed only when the caller gave no id, so an explicit
  // `nativeID` still owns every derived id and a consumer that wired its own
  // `aria-describedby` keeps working.
  const generated = useId().replace(/[^a-zA-Z0-9]/g, '');
  const base = nativeID ?? `bloom-field-${generated}`;
  const labelID = `${base}-label`;
  const descriptionID = `${base}-description`;
  const errorID = `${base}-error`;
  const hasDescription = !hasError && description != null;

  const field = useMemo<FieldControlValue>(
    () => ({
      controlId: multiple ? undefined : base,
      labelId: label != null ? labelID : undefined,
      // In a `multiple` field the GROUP is described, not each control: an
      // error pointed at by three inputs is announced three times.
      describedBy: multiple
        ? undefined
        : hasError
          ? errorID
          : hasDescription
            ? descriptionID
            : undefined,
      labelText: typeof label === 'string' ? label : undefined,
      invalid: hasError,
      required,
      disabled,
    }),
    [multiple, base, label, labelID, hasError, errorID, hasDescription, descriptionID, required, disabled],
  );

  return (
    <FieldControlProvider value={field}>
      <View
        style={[a.w_full, style]}
        testID={testID}
        // A group only when it holds several controls. A `group` around one
        // control is a wrapper a screen reader has to step into for nothing,
        // and it competes with the control's own name.
        role={multiple ? 'group' : undefined}
        aria-labelledby={multiple && label != null ? labelID : undefined}
        aria-describedby={
          multiple ? (hasError ? errorID : hasDescription ? descriptionID : undefined) : undefined
        }
      >
        {label != null ? (
          <Label nativeID={labelID} htmlFor={multiple ? null : base} required={required} disabled={disabled}>
            {label}
          </Label>
        ) : null}

        {children}

        {hasError ? (
          <Text
            variant="caption-1-medium"
            nativeID={errorID}
            accessibilityRole="alert"
            style={[hintStyle, { color: palette.error }]}>
            {error}
          </Text>
        ) : description != null ? (
          <Text
            variant="caption-1-medium"
            nativeID={descriptionID}
            style={[hintStyle, { color: disabled ? palette.placeholder : palette.hint }]}>
            {description}
          </Text>
        ) : null}
      </View>
    </FieldControlProvider>
  );
};

export const Field = memo(FieldComponent);
Field.displayName = 'Field';
