import { useId } from 'react';

import { useFieldMembership, type FieldMembership } from '../field/membership';

export interface CardFormPartMembership extends FieldMembership {
  /** The announced name, with the box's own last resort already applied. */
  name: string;
  /** Whether this box has a message of its own. */
  hasError: boolean;
  /** The id that message carries, so `aria-describedby` can point at it. */
  errorId: string;
}

export interface CardFormPartInput {
  accessibilityLabel?: string;
  label?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  nativeID?: string;
  /** What the box announces when neither the caller nor a `Field` names it. */
  fallbackName: string;
}

/**
 * ONE resolution of a card box's field membership, for the six boxes.
 *
 * Each box is a `Field` member in its own right — a caller can put any one of
 * them in a `Field` and get the field's name, id, description, error and
 * disabled state — and resolving that six times by hand is six chances to write
 * `??` where `||` belongs, which is the exact failure `field/membership.ts`
 * exists to remove.
 *
 * The box's own default name is applied AFTER membership, never as the input to
 * it: a literal handed to `useFieldMembership` as the caller's name would
 * outrank the field's label, which is the one string on screen the user can
 * read.
 *
 * The box's own error id is JOINED with the field's rather than replacing it,
 * because `aria-describedby` is a list — a box with its own message inside a
 * field that also has one announces both.
 */
export function useCardFormPart({
  accessibilityLabel,
  label,
  error,
  invalid = false,
  disabled = false,
  required = false,
  nativeID,
  fallbackName,
}: CardFormPartInput): CardFormPartMembership {
  const generated = useId().replace(/[^a-zA-Z0-9]/g, '');
  const errorId = `bloom-card-form-${generated}-error`;
  const hasError = typeof error === 'string' && error !== '';
  const member = useFieldMembership({
    accessibilityLabel,
    label,
    disabled,
    invalid: invalid || hasError,
    required,
    nativeID,
    describedBy: hasError ? errorId : undefined,
  });
  return {
    ...member,
    name: member.accessibilityLabel ?? fallbackName,
    hasError,
    errorId,
  };
}
