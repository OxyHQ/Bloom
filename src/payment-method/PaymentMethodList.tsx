import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { useFieldMembership } from '../field/membership';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiBankCardLine } from '../icons/remix/RiBankCardLine';
import { Item } from '../item';
import * as Skeleton from '../skeleton';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PaymentMethodRow } from './PaymentMethodRow';
import { PAYMENT_METHOD_GEOMETRY, PAYMENT_METHOD_LIST_GAP } from './constants';
import { resolvePaymentMethodPaint } from './shared';
import type { PaymentMethodEntry, PaymentMethodListProps } from './types';

/**
 * Written as a value rather than inline so the row's role stays one decision:
 * `PaymentMethodRow` translates it through `Item`, which is where the
 * role-to-ARIA-state mapping lives.
 */
const PICKER_ROW_ROLE = 'radio' as const;

/** The name a list falls back to when neither a caller nor a `Field` gives one. */
const LAST_RESORT_NAME = 'Payment methods';

/**
 * The saved methods, with the default marked, an add row, an empty state and a
 * loading state.
 *
 * THE VARIANT IS THE ANNOUNCED TREE, not a style. `list` is a set of methods a
 * reader is managing: a `list` of `listitem`s, each wrapping a button. `picker`
 * is a set they are choosing ONE of: a `radiogroup` of `radio`s carrying
 * `aria-checked`. Both roles exist on both platforms, which is why the picker
 * is a radio group rather than the listbox ARIA would suggest — React Native
 * has no `listbox`, and a role that reaches one platform is the silent half of
 * an accessibility bug.
 *
 * ## The picker is a `Field` MEMBER, not a hand-rolled radiogroup
 *
 * It resolves `useFieldMembership()` the way `RadioGroup` does, so a `Field`
 * around it names the group, describes it with its error, marks it invalid and
 * disables every row — and a row inside a disabled field cannot re-enable
 * itself, because `disabled` combines with `||` rather than deferring.
 *
 * That is the difference between this and the three families `docs/composition.mdx`
 * records as an open gap: writing `role="radiogroup"` is the easy half, and a
 * group nothing can name or disable is what is left when it is the only half
 * done.
 *
 * `accessibilityLabel` is the caller's and wins; the field's label is next;
 * `"Payment methods"` is the last resort, and it is a LAST resort rather than a
 * default because a default here would outrank the one string on screen the
 * user can actually read.
 *
 * ## The add row is not one of the choices
 *
 * "Add a payment method" is an action, not a method, so it is drawn OUTSIDE the
 * `radiogroup`. A `button` among the radios would be announced as part of the
 * choice and counted in "3 of 4".
 *
 *   rows     4 apart, at the row's own geometry
 *   loading  placeholder rows at the plate's own size, announced busy so a
 *            reader is told to wait rather than told nothing
 *   empty    a 32 glyph, a title and a line, centred with 32 of air — and the
 *            add row is still drawn under it, because an empty list is exactly
 *            when a reader needs it
 */
function PaymentMethodListComponent({
  methods,
  selectedId,
  onSelect,
  variant = 'list',
  density = 'comfortable',
  disabled = false,
  onAdd,
  addLabel = 'Add a payment method',
  addIcon: AddIcon = RiAddLine,
  loading = false,
  loadingRows = 3,
  empty,
  emptyTitle = 'No saved payment methods',
  emptyDescription,
  emptyIcon: EmptyIcon = RiBankCardLine,
  accessibilityLabel,
  style,
  testID,
}: PaymentMethodListProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolvePaymentMethodPaint(theme, surface), [theme, surface]);
  const g = PAYMENT_METHOD_GEOMETRY[density];
  const picker = variant === 'picker';
  // The group is one control made of several, so a `Field` around it names the
  // GROUP and disables every row. `accessibilityLabel` is the caller's own name
  // and outranks the field's; `disabled` is a CONSTRAINT and combines.
  const field = useFieldMembership({ accessibilityLabel, disabled });
  const isDisabled = field.disabled;
  const name = field.accessibilityLabel ?? LAST_RESORT_NAME;

  // A disabled row keeps its press HANDLER and is handed `disabled` instead:
  // `Item` then renders a real disabled control, which still announces itself
  // as a radio and as unavailable. Withholding the handler would have made the
  // row a plain `View` — present, silent, and gone from the choice.
  const press = useCallback(
    (entry: PaymentMethodEntry) => (onSelect ? () => onSelect(entry.id) : undefined),
    [onSelect],
  );

  const addRow = onAdd ? (
    <Item
      title={addLabel}
      leading={
        <View
          testID={testID ? `${testID}-add-plate` : undefined}
          style={{
            width: g.plateWidth,
            height: g.plateHeight,
            borderRadius: g.plateRadius,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: paint.plate,
          }}
        >
          <AddIcon width={g.glyph} height={g.glyph} fill={paint.textSecondary} />
        </View>
      }
      onPress={isDisabled ? undefined : onAdd}
      disabled={isDisabled}
      density={density}
      accessibilityLabel={addLabel}
      testID={testID ? `${testID}-add` : undefined}
    />
  ) : null;

  if (loading) {
    return (
      <View
        aria-busy
        accessibilityLabel={name}
        testID={testID}
        style={[{ gap: PAYMENT_METHOD_LIST_GAP }, style]}
      >
        {Array.from({ length: loadingRows }, (_unused, index) => (
          <View
            key={index}
            testID={testID ? `${testID}-placeholder-${index}` : undefined}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <Skeleton.Box width={g.plateWidth} height={g.plateHeight} borderRadius={g.plateRadius} />
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Skeleton.Text style={{ width: '50%', lineHeight: 16 }} />
              <Skeleton.Text style={{ width: '32%', lineHeight: 14 }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (methods.length === 0) {
    return (
      <View testID={testID} style={[{ gap: PAYMENT_METHOD_LIST_GAP }, style]}>
        {empty ?? (
          <View
            testID={testID ? `${testID}-empty` : undefined}
            style={{ alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 16 }}
          >
            <EmptyIcon width={32} height={32} fill={paint.textTertiary} />
            <Text variant="body-medium" style={{ color: paint.text, textAlign: 'center' }}>
              {emptyTitle}
            </Text>
            {emptyDescription ? (
              <Text
                variant="body-2-regular"
                style={{ color: paint.textSecondary, textAlign: 'center' }}
              >
                {emptyDescription}
              </Text>
            ) : null}
          </View>
        )}
        {addRow}
      </View>
    );
  }

  const rows = methods.map((entry, index) => {
    const row = (
      <PaymentMethodRow
        key={entry.id}
        scheme={entry.scheme}
        masked={entry.masked}
        expiry={entry.expiry}
        kind={entry.kind}
        icon={entry.icon}
        image={entry.image}
        leading={entry.leading}
        isDefault={entry.isDefault}
        defaultLabel={entry.defaultLabel}
        state={entry.state}
        stateMessage={entry.stateMessage}
        action={entry.action}
        disabled={isDisabled || entry.disabled === true}
        density={density}
        accessibilityLabel={entry.accessibilityLabel}
        style={entry.style}
        onPress={press(entry)}
        {...(picker
          ? { role: PICKER_ROW_ROLE, selectable: true, selected: selectedId === entry.id }
          : {})}
        testID={entry.testID ?? (testID ? `${testID}-row-${index}` : undefined)}
      />
    );
    if (picker) return row;
    return (
      <View key={entry.id} role="listitem">
        {row}
      </View>
    );
  });

  if (picker) {
    return (
      <View style={[{ gap: PAYMENT_METHOD_LIST_GAP }, style]}>
        <View
          role="radiogroup"
          accessibilityRole="radiogroup"
          accessibilityLabel={name}
          aria-label={name}
          aria-describedby={field.describedBy}
          aria-invalid={field.invalid || undefined}
          // A `View` has no `disabled` prop for react-native-web to derive
          // `aria-disabled` from, and it never reads `accessibilityState`.
          aria-disabled={isDisabled || undefined}
          style={{ gap: PAYMENT_METHOD_LIST_GAP }}
          testID={testID}
        >
          {rows}
        </View>
        {addRow}
      </View>
    );
  }

  return (
    <View style={[{ gap: PAYMENT_METHOD_LIST_GAP }, style]}>
      <View role="list" accessibilityLabel={name} style={{ gap: PAYMENT_METHOD_LIST_GAP }} testID={testID}>
        {rows}
      </View>
      {addRow}
    </View>
  );
}

export const PaymentMethodList = memo(PaymentMethodListComponent);
PaymentMethodList.displayName = 'PaymentMethodList';
