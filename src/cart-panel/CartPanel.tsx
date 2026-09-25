import React, { memo, useMemo } from 'react';
import { Image, View } from 'react-native';

import {
  AdmonitionContent,
  AdmonitionIcon,
  AdmonitionRoot,
  AdmonitionRow,
  AdmonitionText,
} from '../admonition';
import { Button } from '../button';
import { Divider } from '../divider';
import { RiShoppingBag3Line } from '../icons/remix/RiShoppingBag3Line';
import { RiStore2Line } from '../icons/remix/RiStore2Line';
import { useImageResolver } from '../image-resolver/context';
import { Item } from '../item';
import { resolvePhoto } from '../listing-card/shared';
import { PriceSummary } from '../price-breakdown';
import { Meter } from '../stat-bar';
import { useSurfaceFill } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CartLine } from './CartLine';
import { CartPromoField } from './CartPromoField';
import { CartTipPicker } from './CartTipPicker';
import { CART_BLOCK_GAP, CART_GEOMETRY, CART_LINE_GAP, CART_METER_HEIGHT } from './constants';
import { resolveCartPaint, type CartPaint } from './shared';
import type { CartMinimumOrder, CartPanelProps } from './types';

/**
 * The basket, and what it costs.
 *
 *   vendor    one row: the shop's picture, its name and its delivery line. A
 *             basket belongs to exactly ONE vendor, which is why it is a header
 *             and not a field on every line.
 *   lines     a `list` of `CartLine`s
 *   tip       `CartTipPicker`
 *   promo     `CartPromoField`
 *   shortfall the minimum-order warning, drawn directly above the totals —
 *             beside the number it is about, not at the top where it is read
 *             before there is a total to compare it to
 *   totals    `price-breakdown`'s `PriceSummary`, handed straight through
 *   footer    one `Button`, full width
 *
 * IT IS CONTENT, NOT A SURFACE. Inline in a desktop sidebar it is dropped in a
 * `Card`; on a phone it is what a `BottomSheet` holds. It paints no background
 * of its own and claims no edge, so the same tree works in both — and every
 * colour it does paint is read RELATIVE to whatever it was dropped on
 * (`styles/surface-levels.ts`), because a hairline picked for a card disappears
 * on a sheet.
 *
 * IT ADDS NOTHING UP. Subtotal, delivery, service, discount, tip and total are
 * `PriceLine`s the app formatted, drawn by the ONE breakdown Bloom has. There
 * is no second summary in here, and the shortfall `message` is a sentence the
 * app wrote rather than a subtraction this component performed.
 */

function VendorHeader({
  name,
  photo,
  photoVariant,
  meta,
  onPress,
  tile,
  paint,
  testID,
}: {
  name: string;
  photo?: string;
  photoVariant?: string;
  meta?: string;
  onPress?: () => void;
  tile: number;
  paint: CartPaint;
  testID?: string;
}) {
  const resolver = useImageResolver();
  const uri = photo ? resolvePhoto(photo, resolver, photoVariant) : undefined;
  return (
    <Item
      title={name}
      subtitle={meta}
      onPress={onPress}
      accessibilityLabel={meta ? `${name}, ${meta}` : name}
      leading={
        <View
          style={{
            width: tile,
            height: tile,
            borderRadius: tile / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: paint.tile,
          }}
          testID={testID ? `${testID}-vendor-tile` : undefined}
        >
          {uri ? (
            <Image
              source={{ uri }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <RiStore2Line width={tile / 2} height={tile / 2} fill={paint.textSecondary} />
          )}
        </View>
      }
      testID={testID ? `${testID}-vendor` : undefined}
    />
  );
}

function MinimumNotice({
  minimum,
  fill,
  track,
  testID,
}: {
  minimum: CartMinimumOrder;
  fill: string;
  track: string;
  testID?: string;
}) {
  const { message, progress } = minimum;
  return (
    <AdmonitionRoot type="warning">
      <AdmonitionRow>
        <AdmonitionIcon />
        <AdmonitionContent>
          <AdmonitionText>{message}</AdmonitionText>
          {progress ? (
            <Meter
              value={progress.value}
              max={progress.max}
              height={CART_METER_HEIGHT}
              fill={fill}
              track={track}
              accessibilityLabel={progress.accessibilityLabel}
              valueText={progress.valueText}
              testID={testID ? `${testID}-minimum-meter` : undefined}
            />
          ) : null}
        </AdmonitionContent>
      </AdmonitionRow>
    </AdmonitionRoot>
  );
}

function EmptyBasket({
  title,
  description,
  paint,
  testID,
}: {
  title: string;
  description?: string;
  paint: CartPaint;
  testID?: string;
}) {
  return (
    <View
      style={{ alignItems: 'center', gap: 8, paddingTop: 24, paddingBottom: 24 }}
      testID={testID ? `${testID}-empty` : undefined}
    >
      <RiShoppingBag3Line width={32} height={32} fill={paint.textGraphical} />
      <Text variant="headline-semibold" style={{ color: paint.text, textAlign: 'center' }}>
        {title}
      </Text>
      {description ? (
        <Text variant="body-2-regular" style={{ color: paint.textSecondary, textAlign: 'center' }}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

function CartPanelComponent({
  vendorName,
  vendorPhoto,
  vendorPhotoVariant,
  vendorMeta,
  onPressVendor,
  lines,
  onLineQuantityChange,
  onLineRemove,
  removeInStepper = false,
  minimumOrder,
  tip,
  promo,
  summary,
  onCheckout,
  checkoutLabel = 'Go to checkout',
  checkoutDisabled = false,
  empty,
  emptyTitle = 'Your basket is empty',
  emptyDescription = 'Add something from the menu and it will show up here.',
  density = 'comfortable',
  accessibilityLabel = 'Basket',
  style,
  testID,
}: CartPanelProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveCartPaint(theme, surface), [theme, surface]);
  const g = CART_GEOMETRY[density];
  const warning = useMemo(() => resolveAccentColors(theme.colors, 'warning', 'solid'), [theme]);
  const hasLines = lines.length > 0;

  return (
    <View style={[{ gap: CART_BLOCK_GAP }, style]} testID={testID}>
      <View style={{ gap: CART_LINE_GAP }}>
        <VendorHeader
          name={vendorName}
          photo={vendorPhoto}
          photoVariant={vendorPhotoVariant}
          meta={vendorMeta}
          onPress={onPressVendor}
          tile={g.vendorTile}
          paint={paint}
          testID={testID}
        />
        <Divider color={paint.rule} />
        {hasLines ? (
          <View
            role="list"
            accessibilityLabel={accessibilityLabel}
            aria-label={accessibilityLabel}
            style={{ gap: CART_LINE_GAP }}
            testID={testID ? `${testID}-lines` : undefined}
          >
            {lines.map((line) => (
              <CartLine
                key={line.id}
                name={line.name}
                options={line.options}
                note={line.note}
                price={line.price}
                originalPrice={line.originalPrice}
                secondaryPrice={line.secondaryPrice}
                quantity={line.quantity}
                photo={line.photo}
                photoVariant={line.photoVariant}
                unavailable={line.unavailable}
                unavailableLabel={line.unavailableLabel}
                density={density}
                onQuantityChange={
                  onLineQuantityChange
                    ? (quantity: number) => onLineQuantityChange(line.id, quantity)
                    : undefined
                }
                onRemove={onLineRemove ? () => onLineRemove(line.id) : undefined}
                removeInStepper={removeInStepper}
                testID={testID ? `${testID}-line-${line.id}` : undefined}
              />
            ))}
          </View>
        ) : (
          (empty ?? (
            <EmptyBasket
              title={emptyTitle}
              description={emptyDescription}
              paint={paint}
              testID={testID}
            />
          ))
        )}
      </View>

      {hasLines && tip ? <CartTipPicker {...tip} testID={tip.testID ?? (testID ? `${testID}-tip` : undefined)} /> : null}
      {hasLines && promo ? (
        <CartPromoField {...promo} testID={promo.testID ?? (testID ? `${testID}-promo` : undefined)} />
      ) : null}

      {hasLines && minimumOrder ? (
        <MinimumNotice
          minimum={minimumOrder}
          fill={warning.background}
          track={paint.rule}
          testID={testID}
        />
      ) : null}

      {hasLines && summary ? (
        <PriceSummary
          lines={summary.lines}
          total={summary.total}
          collapsible={summary.collapsible}
          defaultExpanded={summary.defaultExpanded}
          testID={testID ? `${testID}-summary` : undefined}
        />
      ) : null}

      {hasLines && onCheckout ? (
        <Button
          variant="primary"
          size="large"
          fullWidth
          disabled={checkoutDisabled}
          onPress={onCheckout}
          testID={testID ? `${testID}-checkout` : undefined}
        >
          {checkoutLabel}
        </Button>
      ) : null}
    </View>
  );
}

export const CartPanel = memo(CartPanelComponent);
CartPanel.displayName = 'CartPanel';
