import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { AddressRow } from '../address';
import { Chip } from '../chip';
import { EmptyState } from '../empty-state';
import { IconCircle } from '../icon-circle';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { FactList } from '../listing-actions/parts';
import { OrderStatusBar } from '../order-status';
import { surfaceTextOn, useSurfaceFill } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  ORDER_CONFIRMATION_GAP,
  ORDER_CONFIRMATION_ITEMS_LABEL,
  ORDER_CONFIRMATION_MARK,
  ORDER_CONFIRMATION_REFERENCE_LABEL,
  ORDER_CONFIRMATION_TITLE,
} from './constants';
import type { OrderConfirmationProps } from './types';

/**
 * A row nested inside this surface takes its own chrome off: `Item`'s
 * `paddingLeft`/`paddingRight`, in the LONGHANDS it writes, so the reset is
 * honoured by react-native-web's atomic sheet as well as by Yoga.
 */
const FLUSH_ROW = { paddingLeft: 0, paddingRight: 0 } as const;

/**
 * It is placed: what happened, which order it was, where it is going, what it
 * cost, and the two things you do next.
 *
 *   mark      a check on a success-tinted disc, 56. STATIC: `AnimatedCheck`
 *             draws itself on only when a caller kicks it through its ref, and
 *             a mark that is invisible until someone calls a method — or under
 *             reduce-motion — is not a mark. An app that wants the draw-on
 *             passes `<AnimatedCheck>` (and its `play()`) as `mark`.
 *   title     the "done" register — `EmptyState`'s own heading and line, which
 *             is the same block `auth-card` and every finished flow draw
 *   reference the order number as an outlined `Chip`, under its caption; it is
 *             a chip because it is the one string a reader will read back to
 *             someone on the phone, and a chip is the library's token
 *   status    `order-status`'s `OrderStatusBar` — the ONE tracking strip in the
 *             library, drawn here rather than copied
 *   address   `address`'s `AddressRow`, flush with the block's edges
 *   facts     the label/value box Bloom's action cards already draw
 *   items     a slot: an order line is a dish, a parcel or a seat, and each has
 *             a row family of its own
 *   actions   track it, get help
 *
 * ## It IS an `EmptyState`
 *
 * Not "looks like one": a mark, a heading, a line of explanation, a block of
 * content and up to two actions is exactly that family's shape, and a "done"
 * screen is the same object as a "nothing here" screen with a different reason
 * for existing. Building it a second time is how two centred columns with
 * different paddings ship in one library.
 *
 * ## It computes nothing
 *
 * Every amount, every time and every reading is a string the app formatted.
 */
function OrderConfirmationComponent({
  title = ORDER_CONFIRMATION_TITLE,
  description,
  mark,
  markSize = ORDER_CONFIRMATION_MARK,
  reference,
  referenceLabel = ORDER_CONFIRMATION_REFERENCE_LABEL,
  status,
  address,
  facts,
  items,
  itemsLabel = ORDER_CONFIRMATION_ITEMS_LABEL,
  action,
  secondaryAction,
  footer,
  variant = 'comfortable',
  accessibilityLabel,
  style,
  testID,
}: OrderConfirmationProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => surfaceTextOn(theme, surface), [theme, surface]);
  const success = useMemo(() => resolveAccentColors(theme.colors, 'success', 'subtle'), [theme]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const keyFacts = useMemo(
    () => (facts ?? []).map((fact) => ({ key: fact.id ?? fact.label, label: fact.label, value: fact.value })),
    [facts],
  );

  const caption = (text: string, part: string) => (
    <Text
      variant="caption-2-bold"
      testID={id(part)}
      style={{ color: paint.textSecondary, textTransform: 'uppercase' }}
    >
      {text}
    </Text>
  );

  const hasBody =
    reference != null || status != null || address != null || keyFacts.length > 0 || items != null;

  return (
    <EmptyState
      variant={variant}
      // The mark is read for PRESENCE: `mark={null}` draws none, which is what
      // a surface that already carries a brand header wants.
      illustration={
        mark !== undefined ? (
          mark
        ) : (
          // The disc and the glyph are a resolved PAIR (`resolveAccentColors`),
          // never one token with alpha appended — `IconCircle`'s own primary
          // pair overridden together, which is the one way its docs allow.
          <IconCircle
            icon={RiCheckLine}
            size="xl"
            style={{ width: markSize, height: markSize, backgroundColor: success.background }}
            iconStyle={{ color: success.foreground }}
          />
        )
      }
      title={title}
      description={description}
      action={action}
      secondaryAction={secondaryAction}
      footer={footer}
      accessibilityLabel={
        accessibilityLabel ??
        [title, reference ? `${referenceLabel} ${reference}` : undefined, description]
          .filter(Boolean)
          .join('. ')
      }
      style={style}
      testID={testID}
    >
      {hasBody ? (
        <View style={{ gap: ORDER_CONFIRMATION_GAP }}>
          {reference != null ? (
            <View style={{ alignItems: 'center', gap: 6 }}>
              {caption(referenceLabel, 'reference-label')}
              <Chip
                variant="outlined"
                size="large"
                // `Chip` pins itself to `alignSelf: 'flex-start'`, so a centred
                // parent does not centre it — it has to say so itself.
                style={{ alignSelf: 'center' }}
                accessibilityLabel={`${referenceLabel} ${reference}`}
                testID={id('reference')}
              >
                {reference}
              </Chip>
            </View>
          ) : null}

          {status ? <OrderStatusBar {...status} testID={status.testID ?? id('status')} /> : null}

          {address ? (
            <AddressRow
              title={address.title}
              subtitle={address.subtitle}
              kind={address.kind}
              icon={address.icon}
              badge={address.badge}
              meta={address.meta}
              style={FLUSH_ROW}
              testID={address.testID ?? id('address')}
            />
          ) : null}

          {keyFacts.length > 0 ? <FactList facts={keyFacts} testID={id('facts')} /> : null}

          {items != null ? (
            <View style={{ gap: 8 }}>
              {caption(itemsLabel, 'items-label')}
              <View testID={id('items')}>{items}</View>
            </View>
          ) : null}
        </View>
      ) : null}
    </EmptyState>
  );
}

export const OrderConfirmation = memo(OrderConfirmationComponent);
OrderConfirmation.displayName = 'OrderConfirmation';
