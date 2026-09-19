/**
 * ONE resolution of field membership, for every control that opts in.
 *
 * `useFieldControl()` hands a control the field's ids and state; applying them
 * is four separate decisions, and each has a direction that is silently wrong:
 *
 *   the NAME         defers to the field   (`??`) — a control inside a labelled
 *                                          field must not announce nothing
 *   the CONSTRAINTS  combine with the field (`||`) — `disabled` and `invalid`
 *                                          restrict, so a control cannot opt out
 *   the ID           is the field's        (`??` the caller's own, which wins)
 *   `describedBy`    is a LIST, so the two are joined rather than one chosen
 *
 * Fifteen families resolving that by hand is fifteen chances to write `??` where
 * `||` belongs — and the failure is silent in both directions: a control that
 * re-enables itself inside a disabled field looks fine and a field-labelled
 * control that announces nothing looks fine too. So it is a function, for the
 * same reason `useInheritedControl` is one.
 *
 * `TextFieldInput` is the one family that resolves the same rule inline, because
 * it also reconciles the text-field shell's own context and its standalone
 * branch. It is not exempt from the RULE: `FieldMembership.test.tsx` asserts the
 * observable properties for every family, so the two implementations cannot
 * disagree about what a field means without going red.
 *
 * ## The name, and why placement decides it
 *
 * A control's own label is either STACKED above it (`TextField`, `Textarea`:
 * the field's label and the control's label are two spellings of one thing, and
 * a `Field` around it should win) or ADJACENT to it (a checkbox's caption, a
 * radio's option text: the words the user reads AS the control, which the
 * announced name must match). Getting that backwards makes a screen reader say
 * one thing while the eye reads another, so it is a declared property of the
 * family rather than a guess this hook could make.
 *
 * A control with neither — `Switch`, `Slider`, a progress bar — can be named by
 * NOTHING but the field, which is the case this hook exists for.
 */
import { useMemo } from 'react';

import { useFieldControl } from './context';

/** Where the control renders its own label, which decides which name wins. */
export type FieldLabelPlacement = 'stacked' | 'adjacent';

export interface FieldMembershipInput {
  /** The name the caller wrote on the control. Always wins. */
  accessibilityLabel?: string;
  /** The control's own label, when it has one. */
  label?: string;
  /**
   * Whether that label sits above the control (`stacked`, the default — the
   * field's label is the same thing said twice, so the field wins) or beside it
   * as the control's visible text (`adjacent` — it wins, so the announced name
   * and the words on screen cannot disagree).
   */
  labelPlacement?: FieldLabelPlacement;
  /** The control's own `disabled`. Combined with the field's, never replaced. */
  disabled?: boolean;
  /** The control's own invalid state. Combined with the field's. */
  invalid?: boolean;
  /** The control's own `required`. Combined with the field's. */
  required?: boolean;
  /** An id the caller wrote on the control. Outranks the field's. */
  nativeID?: string;
  /** An `aria-describedby` the caller wrote. JOINED with the field's, not replaced. */
  describedBy?: string;
}

export interface FieldMembership {
  /** Whether there is an enclosing `Field` at all. */
  inField: boolean;
  /** The id to render, or `undefined` when neither side has one. */
  nativeID?: string;
  /** The accessible name to render, or `undefined` when nothing names it. */
  accessibilityLabel?: string;
  /** The `aria-describedby` id list, or `undefined` when there is nothing to describe it. */
  describedBy?: string;
  /** The effective disabled state: the control's OR the field's. */
  disabled: boolean;
  /** The effective invalid state: the control's OR the field's. */
  invalid: boolean;
  /** The effective required state: the control's OR the field's. */
  required: boolean;
}

/**
 * Resolve what an enclosing `Field` contributes to one control.
 *
 * ```tsx
 * const field = useFieldMembership({ accessibilityLabel, label, labelPlacement: 'adjacent', disabled });
 * <Pressable
 *   nativeID={field.nativeID}
 *   accessibilityLabel={field.accessibilityLabel}
 *   aria-describedby={field.describedBy}
 *   aria-invalid={field.invalid || undefined}
 *   disabled={field.disabled}
 * />
 * ```
 *
 * Outside a `Field` it returns the control's own values unchanged, so a control
 * can call it unconditionally.
 */
export function useFieldMembership(input: FieldMembershipInput = {}): FieldMembership {
  const field = useFieldControl();
  const {
    accessibilityLabel,
    label,
    labelPlacement = 'stacked',
    disabled = false,
    invalid = false,
    required = false,
    nativeID,
    describedBy,
  } = input;

  const fieldLabel = field?.labelText;
  const fieldDescribedBy = field?.describedBy;
  const fieldControlId = field?.controlId;
  const fieldDisabled = field?.disabled === true;
  const fieldInvalid = field?.invalid === true;
  const fieldRequired = field?.required === true;

  return useMemo<FieldMembership>(() => {
    const own = label ?? undefined;
    const name =
      accessibilityLabel ??
      (labelPlacement === 'adjacent' ? (own ?? fieldLabel) : (fieldLabel ?? own));

    // An id LIST: a control that already points at its own hint keeps it, and
    // the field's error is added rather than swapped in. Duplicates are
    // dropped — an id named twice is read twice by some screen readers.
    const described = [describedBy, fieldDescribedBy].filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );
    const uniqueDescribed = Array.from(new Set(described.flatMap((ids) => ids.split(/\s+/))));

    return {
      inField: field != null,
      nativeID: nativeID ?? fieldControlId,
      accessibilityLabel: name,
      describedBy: uniqueDescribed.length > 0 ? uniqueDescribed.join(' ') : undefined,
      disabled: disabled || fieldDisabled,
      invalid: invalid || fieldInvalid,
      required: required || fieldRequired,
    };
  }, [
    field,
    accessibilityLabel,
    label,
    labelPlacement,
    disabled,
    invalid,
    required,
    nativeID,
    describedBy,
    fieldLabel,
    fieldDescribedBy,
    fieldControlId,
    fieldDisabled,
    fieldInvalid,
    fieldRequired,
  ]);
}
