import { useMemo, type ReactNode } from 'react';

import { FieldControlProvider, useFieldControl, type FieldControlValue } from './context';

/**
 * The enclosing `Field`'s CONSTRAINTS, re-published without its ASSOCIATION.
 *
 * A composite — a picker of cards, a calculator of four inputs — joins a field
 * at ONE node: its root takes the field's id, its name and its
 * `aria-describedby` through `useFieldMembership()`. The parts inside it are
 * members too, and left alone each one reads the same context and takes the
 * same three things:
 *
 *   the ID           on every part — one id on six nodes is invalid HTML, and
 *                    the label's `for` points at whichever the browser finds
 *   the ERROR        described by every part — read once per part
 *   the NAME         every `TextFieldInput` inside announces the FIELD's label,
 *                    so "Property price" and "Interest rate" both say "Mortgage"
 *
 * `multiple` does not cure the third: it withholds the id and the description,
 * but `labelText` still travels. So the composite wraps its parts in this, and
 * they see a field that carries only what RESTRICTS — `disabled`, `invalid`,
 * `required`. They still freeze with the field and cannot re-enable themselves
 * (each applies these with `||`, as before); they keep their own names, and the
 * id and the error are said once, by the root.
 *
 * Same re-publication as `card-form`'s `republish()`, with the association
 * withheld rather than redirected: there, each box IS the member and gets its
 * own id; here the root is, and the parts are not.
 *
 * Outside a `Field` it publishes nothing — the parts see no field, exactly as
 * they would without it — so a composite can render it unconditionally. Inside
 * one, a part that branches on "is there a field at all" (`DeliverySlotPicker`
 * rendering a second `Field` of its own) sees one: this is still membership,
 * only without the parts that belong to the root.
 */
export function FieldConstraintScope({ children }: { children: ReactNode }) {
  const field = useFieldControl();
  const inField = field != null;
  const disabled = field?.disabled === true;
  const invalid = field?.invalid === true;
  const required = field?.required === true;
  // The provider is rendered either way, so a field appearing or going away
  // changes a value rather than the tree, and the parts do not remount.
  const value = useMemo<FieldControlValue | null>(
    () => (inField ? { disabled, invalid, required } : null),
    [inField, disabled, invalid, required],
  );
  return <FieldControlProvider value={value}>{children}</FieldControlProvider>;
}
