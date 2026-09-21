import React, { memo, type ReactNode } from 'react';
import { View } from 'react-native';

import { AddressRow } from '../address';
import { Divider } from '../divider';
import { PriceSummary } from '../price-breakdown';
import {
  SurfaceLevelProvider,
  surfaceFillVars,
  useSurfaceLevel,
  useSurfaceLevelValue,
  type SurfaceLevel,
} from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CheckoutConfirm } from './CheckoutConfirm';
import { CheckoutSummaryRow } from './CheckoutSummaryRow';
import {
  CHECKOUT_GROUP_RADIUS,
  CHECKOUT_PRICE_PADDING,
  CHECKOUT_ROW_ICON,
  CHECKOUT_SECTION_GAP,
} from './constants';
import { checkoutRowName } from './shared';
import type { CheckoutSummaryLine, CheckoutSummaryProps } from './types';

/** The style that takes `Item`'s own chrome back off a row nested inside a row. */
const NESTED_ROW_STYLE = {
  // The LONGHANDS `Item` itself writes, on both axes. `Item`'s base uses
  // `paddingVertical` for the vertical pair and `paddingLeft`/`paddingRight`
  // for the horizontal one; overriding a shorthand with longhands (or the other
  // way round) is honoured by Yoga and silently dropped by react-native-web,
  // whose atomic sheet ranks `padding-block` above `padding-top` whatever the
  // array's order — so the reset would have worked on native only.
  paddingVertical: 0,
  paddingLeft: 0,
  paddingRight: 0,
  minHeight: 0,
} as const;

/**
 * Review and confirm: where it goes, when, how it is paid, what it costs, and
 * the note to the seller — each shown as its chosen value, each opening the
 * thing that changes it.
 *
 *   group    one surface rung above whatever it was dropped on, radius 16, a
 *            hairline, with 1px rules between rows
 *   rows     `CheckoutSummaryRow`, in the order a buyer checks them
 *   totals   `price-breakdown`'s `PriceSummary`, inside the group under a rule,
 *            16 all round
 *   confirm  `CheckoutConfirm`, 20 under the group and OUTSIDE it: the group is
 *            a list of decisions and the button is the consequence
 *
 * ## What this family does not own
 *
 * The totals are `PriceSummary` and nothing else — no second breakdown, no
 * arithmetic, and every amount is a string the app formatted. The address row
 * is `address`'s own `AddressRow`. Tracking, afterwards, is `order-status`.
 * The payment row is a SLOT: the payment-method row is its own family, and a
 * placeholder drawn here would be a second spelling of it.
 *
 * ## Why the address row nests
 *
 * `AddressRow` is `Item` with an address's slots filled in — the tile, the
 * badge beside the title, the name joined from the row's own text. Reaching for
 * it here rather than redrawing two lines is the whole point; it goes INSIDE
 * the summary row's value column with `leading={null}` (the row already drew
 * the gutter, which is the case `AddressRow` documents) and with `Item`'s
 * padding reset, so there is one row's chrome rather than two.
 */
function CheckoutSummaryComponent({
  title = 'Review your order',
  address,
  delivery,
  payment,
  note,
  extras,
  price,
  confirm,
  children,
  accessibilityLabel,
  style,
  testID,
}: CheckoutSummaryProps) {
  const theme = useTheme();
  const level = useSurfaceLevelValue();
  const own = useSurfaceLevel(1);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const line = (row: CheckoutSummaryLine, fallbackIcon: CheckoutSummaryLine['icon'], key: string) => (
    <CheckoutSummaryRow
      key={row.id ?? key}
      label={row.label}
      icon={row.icon ?? fallbackIcon}
      value={row.value}
      placeholder={row.placeholder}
      detail={row.detail}
      badge={row.badge}
      onPress={row.onPress}
      disabled={row.disabled}
      accessibilityHint={row.accessibilityHint}
      accessibilityLabel={row.accessibilityLabel}
      testID={row.testID ?? id(key)}
    />
  );

  const rows: ReactNode[] = [];
  if (address) {
    const label = address.label ?? 'Deliver to';
    rows.push(
      <CheckoutSummaryRow
        key="address"
        label={label}
        icon={address.icon ?? CHECKOUT_ROW_ICON.address}
        onPress={address.onPress}
        disabled={address.disabled}
        accessibilityHint={address.accessibilityHint}
        accessibilityLabel={checkoutRowName(
          label,
          [address.title, address.subtitle].filter(Boolean).join(', '),
        )}
        testID={address.testID ?? id('address')}
        content={
          <AddressRow
            title={address.title}
            subtitle={address.subtitle}
            kind={address.kind}
            badge={address.badge}
            leading={null}
            style={NESTED_ROW_STYLE}
            testID={id('address-row')}
          />
        }
      />,
    );
  }
  if (delivery) rows.push(line(delivery, CHECKOUT_ROW_ICON.delivery, 'delivery'));
  if (payment != null) rows.push(<View key="payment">{payment}</View>);
  if (note) rows.push(line(note, CHECKOUT_ROW_ICON.note, 'note'));
  if (extras) {
    extras.forEach((row, index) => rows.push(line(row, undefined, `extra-${index}`)));
  }

  // One rung above the ambient surface, and PUBLISHED, so the rows inside
  // resolve their tiles off the group's real fill rather than off the page's.
  const raised = Math.min(3, level + 1) as SurfaceLevel;

  return (
    <View testID={testID} style={style}>
      {title != null ? (
        <Text
          variant="title-3-semibold"
          role="heading"
          aria-level={2}
          testID={id('title')}
          style={{ color: theme.colors.text, marginBottom: 12 }}
        >
          {title}
        </Text>
      ) : null}

      <View
        role="group"
        accessibilityLabel={accessibilityLabel ?? title ?? 'Order summary'}
        testID={id('group')}
        style={[
          {
            borderRadius: CHECKOUT_GROUP_RADIUS,
            borderWidth: 1,
            borderColor: own.border,
            backgroundColor: own.background,
            overflow: 'hidden',
          },
          surfaceFillVars(own.background),
        ]}
      >
        <SurfaceLevelProvider level={raised} fill={own.background}>
          {rows.map((row, index) => (
            <React.Fragment key={index}>
              {index > 0 ? <Divider color={own.border} /> : null}
              {row}
            </React.Fragment>
          ))}
          {price ? (
            <>
              {rows.length > 0 ? <Divider color={own.border} /> : null}
              <View style={{ padding: CHECKOUT_PRICE_PADDING }}>
                <PriceSummary {...price} testID={price.testID ?? id('price')} />
              </View>
            </>
          ) : null}
        </SurfaceLevelProvider>
      </View>

      {children != null ? <View style={{ marginTop: CHECKOUT_SECTION_GAP }}>{children}</View> : null}

      {confirm ? (
        <CheckoutConfirm
          {...confirm}
          style={[{ marginTop: CHECKOUT_SECTION_GAP }, confirm.style]}
          testID={confirm.testID ?? id('confirm')}
        />
      ) : null}
    </View>
  );
}

export const CheckoutSummary = memo(CheckoutSummaryComponent);
CheckoutSummary.displayName = 'CheckoutSummary';
