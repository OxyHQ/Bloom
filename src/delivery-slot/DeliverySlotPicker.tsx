import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { EmptyState } from '../empty-state';
import { Field } from '../field';
import { useFieldControl } from '../field/context';
import { useFieldMembership } from '../field/membership';
import { RiFlashlightLine } from '../icons/remix/RiFlashlightLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import * as Skeleton from '../skeleton';
import { DeliverySlotDays } from './DeliverySlotDays';
import { DeliverySlotOption } from './DeliverySlotOption';
import {
  DELIVERY_ASAP_LABEL,
  DELIVERY_DAY_LABEL,
  DELIVERY_DOT,
  DELIVERY_EMPTY_DESCRIPTION,
  DELIVERY_EMPTY_TITLE,
  DELIVERY_FIELD_LABEL,
  DELIVERY_OPTION_GAP,
  DELIVERY_OPTION_RADIUS,
  DELIVERY_SECTION_GAP,
  DELIVERY_SOLD_OUT_LABEL,
} from './constants';
import { joinDeliveryParts, windowDetail, windowName } from './shared';
import type { DeliverySlotPickerProps } from './types';

/**
 * INTERNAL — the two groups, inside the field, so they can READ it.
 *
 * It is a separate component and not the body of `DeliverySlotPicker` for one
 * mechanical reason: `useFieldMembership()` reads the context a `Field`
 * publishes, and a component cannot read a context it renders itself. Splitting
 * here is what makes the picker a real member of the field contract — the
 * field's label names the group, and the field's `disabled` reaches every day
 * and every window and cannot be opted out of.
 */
type DeliverySlotGroupsProps = Omit<
  DeliverySlotPickerProps,
  'description' | 'error' | 'required' | 'style'
> &
  Required<
    Pick<
      DeliverySlotPickerProps,
      'dayLabel' | 'emptyTitle' | 'emptyDescription' | 'soldOutLabel' | 'loadingRows'
    >
  >;

function DeliverySlotGroups({
  label,
  days,
  day,
  onDayChange,
  dayLabel,
  windows,
  value,
  onValueChange,
  asap,
  disabled,
  loading,
  loadingRows,
  empty,
  emptyTitle,
  emptyDescription,
  tierLabels,
  soldOutLabel,
  fadeColor,
  testID,
}: DeliverySlotGroupsProps) {
  // The NAME defers to the field (`??`) and `disabled` combines with it (`||`)
  // — the two directions `field/membership.ts` exists to stop every family
  // getting backwards.
  const field = useFieldMembership({ accessibilityLabel: label, disabled });
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const off = field.disabled;

  const options = useMemo(
    () =>
      windows.map((w) => ({
        window: w,
        detail: windowDetail(w, tierLabels, soldOutLabel),
        name: windowName(w, tierLabels, soldOutLabel),
      })),
    [windows, tierLabels, soldOutLabel],
  );

  const asapRow = asap ? (
    <DeliverySlotOption
      key="asap"
      label={asap.label ?? DELIVERY_ASAP_LABEL}
      detail={asap.soldOut ? soldOutLabel : joinDeliveryParts([asap.eta, asap.note])}
      price={asap.price}
      icon={asap.icon ?? RiFlashlightLine}
      selected={asap.id === value}
      disabled={off || asap.disabled === true || asap.soldOut === true}
      onPress={onValueChange ? () => onValueChange(asap.id) : undefined}
      accessibilityLabel={asap.accessibilityLabel}
      testID={asap.testID ?? id('asap')}
    />
  ) : null;

  const body = loading ? (
    <View aria-busy accessibilityLabel={field.accessibilityLabel} testID={id('loading')} style={{ gap: DELIVERY_OPTION_GAP }}>
      {Array.from({ length: loadingRows }, (_unused, index) => (
        <View
          key={index}
          testID={id(`placeholder-${index}`)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: DELIVERY_OPTION_RADIUS,
          }}
        >
          <Skeleton.Circle size={DELIVERY_DOT} />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Skeleton.Text style={{ width: '40%', lineHeight: 16 }} />
            <Skeleton.Text style={{ width: '60%', lineHeight: 14 }} />
          </View>
        </View>
      ))}
    </View>
  ) : options.length === 0 && asapRow == null ? (
    (empty ?? (
      <EmptyState
        variant="compact"
        icon={RiTimeLine}
        title={emptyTitle}
        description={emptyDescription}
        testID={id('empty')}
      />
    ))
  ) : (
    <View
      role="radiogroup"
      accessibilityLabel={field.accessibilityLabel}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      aria-disabled={off || undefined}
      testID={id('windows')}
      style={{ gap: DELIVERY_OPTION_GAP }}
    >
      {asapRow}
      {options.map(({ window: w, detail, name }) => (
        <DeliverySlotOption
          key={w.id}
          label={w.label}
          detail={detail}
          price={w.price}
          selected={w.id === value}
          disabled={off || w.disabled === true || w.soldOut === true}
          onPress={onValueChange ? () => onValueChange(w.id) : undefined}
          accessibilityLabel={name}
          testID={w.testID ?? id(w.id)}
        />
      ))}
    </View>
  );

  return (
    <View style={{ gap: DELIVERY_SECTION_GAP }}>
      <DeliverySlotDays
        days={days}
        value={day}
        onChange={onDayChange}
        accessibilityLabel={dayLabel}
        disabled={off}
        fadeColor={fadeColor}
        testID={id('days')}
      />
      {body}
    </View>
  );
}

/**
 * When: a day, then a window of that day — or the next courier.
 *
 *   field    standalone, the whole picker IS a `Field` (`multiple`), so one
 *            label names the choice, one `error` puts it in its invalid state,
 *            and one `disabled` reaches the strip and every option. Dropped
 *            inside somebody else's `Field` it renders no second one and reads
 *            theirs instead.
 *   days     `DeliverySlotDays`, a `radiogroup` of day tiles
 *   options  16 under the strip; a `radiogroup` of `DeliverySlotOption`s 8
 *            apart, the ASAP option at the head of it
 *   loading  placeholder rows announced as busy — the windows are RELOADED when
 *            the day changes, and an empty list during that reload reads as
 *            "nothing left today"
 *   empty    `EmptyState` at the panel rung
 *
 * ## It is a selection, so it is a radio group
 *
 * Not a set of pressables that happen to look selected. The difference is what
 * a screen reader says: a `radiogroup` announces the name of the choice and
 * "3 of 7", and each row announces whether it is the chosen one. Pressables
 * announce seven unrelated buttons, one of which is drawn differently.
 *
 * ## It computes nothing
 *
 * Every window, every price and every reading is a string the app formatted.
 * The only ordering this family does is the order it was handed.
 */
function DeliverySlotPickerComponent({
  label,
  description,
  error,
  required,
  disabled,
  dayLabel = DELIVERY_DAY_LABEL,
  emptyTitle = DELIVERY_EMPTY_TITLE,
  emptyDescription = DELIVERY_EMPTY_DESCRIPTION,
  soldOutLabel = DELIVERY_SOLD_OUT_LABEL,
  loadingRows = 3,
  style,
  testID,
  ...rest
}: DeliverySlotPickerProps) {
  // Is there already a `Field` around us? A picker dropped into somebody's form
  // must not make a SECOND one: two fields means two labels above one control
  // and an error the outer field describes and the inner one does not.
  //
  // Reading the context here is safe — `Field` is rendered BELOW this node, so
  // what this sees is the enclosing one — and the branch is a render decision,
  // not a conditional hook.
  const enclosing = useFieldControl();

  const groups = (
    <DeliverySlotGroups
      {...rest}
      label={label}
      disabled={disabled}
      dayLabel={dayLabel}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      soldOutLabel={soldOutLabel}
      loadingRows={loadingRows}
      testID={testID}
    />
  );

  // Inside somebody's field, the field owns the label, the hint and the error —
  // and `label` stays undefined by default so the field's own label is what
  // names the group. Standalone, the picker IS the field and supplies its own.
  if (enclosing) return <View style={style}>{groups}</View>;

  return (
    <Field
      label={label ?? DELIVERY_FIELD_LABEL}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      multiple
      style={style}
      testID={testID}
    >
      {groups}
    </Field>
  );
}

export const DeliverySlotPicker = memo(DeliverySlotPickerComponent);
DeliverySlotPicker.displayName = 'DeliverySlotPicker';
