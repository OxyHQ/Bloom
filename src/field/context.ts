/**
 * FIELD MEMBERSHIP — what a `Field` tells the control inside it, so the label,
 * the description and the error are wired to it rather than merely stacked
 * above and below it.
 *
 * ## What was missing
 *
 * `Field` drew the three pieces and rendered `children` untouched. Every
 * association — the id the label points at, the `aria-describedby` that makes a
 * screen reader read the error, the invalid state, the disabled state — was the
 * app's to wire by hand, on every field, and the failure when it was not wired
 * is silent: the field LOOKS associated, because the parts are in the right
 * places and the error is red.
 *
 * ## The contract
 *
 * `Field` publishes ids and state; a control that can accept them calls
 * {@link useFieldControl} and applies them. Opt-IN, not magic: an arbitrary
 * child cannot be given behaviour by being wrapped, and a container that
 * inspected its children's types to decide what to do with them would be the
 * thing `docs/composition.mdx` argues against. A control that does not read the
 * context renders exactly as it did before.
 *
 * ## The ids are stable across SSR
 *
 * From `useId`, seeded by the caller's `nativeID` when it gave one. A
 * module-scope counter would number the server's render and the client's
 * hydration differently, so the `for` attribute React sent and the `id` it
 * re-rendered would stop matching — which is invisible until someone clicks a
 * label.
 *
 * ## One control or several
 *
 * A field with ONE control gives it the field's id, and the error is described
 * BY that control. A field with several (a radio set, a date's three inputs)
 * must not: three inputs sharing one id is invalid HTML, and an error attached
 * to each of them is read three times. `multiple` switches the field to a
 * labelled `group` and publishes no control id at all — the group carries the
 * name and the description, and each control keeps its own.
 *
 * ## What does NOT travel here
 *
 * The VALUE, the validation and the submission. Bloom owns presentation and
 * association; an app's form library owns the data. A context that also carried
 * the value would make `Field` a form framework, which is the one thing this is
 * not.
 */
import { createContext, useContext } from 'react';

export interface FieldControlValue {
  /**
   * The id the single control should carry, so the label's `for` points at it.
   * `undefined` in a `multiple` field, where each control keeps its own.
   */
  controlId?: string;
  /** The label's own id — for a control that names itself by reference. */
  labelId?: string;
  /**
   * The id list for `aria-describedby`: the description, or the error when
   * there is one. `undefined` when the field has neither.
   */
  describedBy?: string;
  /**
   * The label as TEXT, when the field's label is a string.
   *
   * This is the cross-platform half of naming. On web a `<label for>` is a real
   * association and the control needs no name of its own; React Native has no
   * equivalent, so the control has to carry the name, and the name it should
   * carry is the one the user can see. A control that has both its own label
   * prop and this should prefer this — otherwise the visible label and the
   * announced name can disagree, which is worse than either alone.
   */
  labelText?: string;
  /** Whether the field is currently in its error state. */
  invalid: boolean;
  /** Whether the field is marked required. */
  required: boolean;
  /**
   * The field's disabled state.
   *
   * A CONSTRAINT, not a default: a control inside a disabled field must not be
   * able to re-enable itself, so a consumer applies this with `||` against its
   * own prop rather than with `??`.
   */
  disabled: boolean;
}

const FieldControlContext = createContext<FieldControlValue | null>(null);
FieldControlContext.displayName = 'BloomFieldControlContext';

/** @internal The provider `Field` renders. */
export const FieldControlProvider = FieldControlContext.Provider;

/**
 * The enclosing `Field`'s association, or `null` outside one.
 *
 * ```tsx
 * const field = useFieldControl();
 * <TextInput
 *   nativeID={field?.controlId ?? nativeID}
 *   aria-describedby={field?.describedBy}
 *   aria-invalid={field?.invalid || isInvalid || undefined}
 *   accessibilityLabel={field?.labelText ?? label}
 *   editable={!(field?.disabled || disabled)}
 * />
 * ```
 */
export function useFieldControl(): FieldControlValue | null {
  return useContext(FieldControlContext);
}
