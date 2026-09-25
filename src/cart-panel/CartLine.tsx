import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { GlyphButton } from '../button';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { Item } from '../item';
import { ListingPriceLines } from '../listing-card/parts';
import { MenuItemThumb } from '../menu-item/parts';
import { Stepper } from '../stepper';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CART_GEOMETRY } from './constants';
import { composeCartLineName, optionsLine, resolveCartPaint } from './shared';
import type { CartLineProps } from './types';

/**
 * One thing in the basket: what it is, what was chosen for it, how many, and
 * what that comes to.
 *
 *   leading   the square photo (56; 44 compact), washed while it is sold out
 *   body      the name; the chosen options on one quiet line; the note; then
 *             the quantity control and remove, side by side
 *   trailing  the price, right-aligned, with an optional struck original
 *
 * BY DEFAULT THE STEPPER DOES NOT REMOVE. Its floor is 1, and removing is its
 * own control with its own name — a stepper that deletes the line when you
 * press `−` once too often is a destructive action behind an arithmetic one.
 * `removeInStepper` opts into the storefront pattern instead: at 1 the `−`
 * becomes a trash button NAMED as removal (`Stepper`'s `onRemove`), and the
 * separate remove control is not drawn. A sold-out line keeps the separate
 * control, because its stepper is disabled and could not remove anything.
 *
 * The row is never pressable, which is what lets the controls live in it: a
 * pressable `Item` is a real `<button>` on web and a control inside one is
 * invalid HTML whose click also fires the row. Opening a basket line to edit it
 * is `MenuItemOptions` in a sheet, reached from the name — not from the whole
 * row, which is mostly controls.
 *
 * A SOLD-OUT LINE IS QUIETENED, NOT DISABLED. The photo washes and the name
 * drops to the secondary rung, but the row itself keeps full opacity: the one
 * thing a reader needs on a line that cannot be delivered is REMOVE, and a
 * control drawn at half opacity that still fires is exactly the affordance this
 * library refuses elsewhere. The stepper is the one that goes disabled, because
 * changing how many of a sold-out dish you want is the action with no meaning.
 */
function CartLineComponent(props: CartLineProps) {
  const {
    name,
    options,
    note,
    price,
    originalPrice,
    quantity,
    photo,
    photoVariant,
    unavailable = false,
    unavailableLabel = 'Sold out',
    onQuantityChange,
    onRemove,
    removeLabel,
    removeInStepper = false,
    density = 'comfortable',
    accessibilityLabel,
    style,
    testID,
  } = props;

  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveCartPaint(theme, surface), [theme, surface]);
  const g = CART_GEOMETRY[density];
  const compact = density === 'compact';
  const chosen = optionsLine(options);
  const removeName = removeLabel ?? `Remove ${name}`;
  // The stepper carries removal only when it is live; a disabled stepper
  // (sold out) cannot, and the line still needs its remove control.
  const stepperRemoves = removeInStepper && onRemove !== undefined && onQuantityChange !== undefined && !unavailable;

  return (
    <Item
      role="listitem"
      density={density}
      accessibilityLabel={accessibilityLabel ?? composeCartLineName(props)}
      leading={
        <MenuItemThumb
          photo={photo}
          photoVariant={photoVariant}
          size={g.thumb}
          radius={g.thumbRadius}
          placeholder={paint.tile}
          wash={paint.wash}
          washed={unavailable}
          testID={testID}
        />
      }
      trailing={
        <View style={{ alignItems: 'flex-end', minWidth: 0 }}>
          <ListingPriceLines
            lines={[{ price, originalPrice }]}
            size={compact ? 'small' : 'medium'}
            color={paint.text}
            secondaryColor={paint.textSecondary}
            testID={testID ? `${testID}-price` : undefined}
          />
        </View>
      }
      style={style}
      testID={testID}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          variant={compact ? 'body-2-semibold' : 'body-semibold'}
          numberOfLines={2}
          testID={testID ? `${testID}-name` : undefined}
          style={{ color: unavailable ? paint.textSecondary : paint.text }}
        >
          {name}
        </Text>
        {chosen ? (
          <Text
            variant="body-2-regular"
            numberOfLines={2}
            testID={testID ? `${testID}-options` : undefined}
            style={{ color: paint.textSecondary }}
          >
            {chosen}
          </Text>
        ) : null}
        {note ? (
          <Text
            variant="body-2-regular"
            numberOfLines={2}
            testID={testID ? `${testID}-note` : undefined}
            style={{ color: paint.textTertiary }}
          >
            {note}
          </Text>
        ) : null}
        {unavailable ? (
          <Text
            variant="body-2-medium"
            testID={testID ? `${testID}-unavailable` : undefined}
            style={{ color: paint.textSecondary }}
          >
            {unavailableLabel}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {onQuantityChange ? (
            <Stepper
              size="small"
              value={quantity}
              min={1}
              disabled={unavailable}
              onValueChange={onQuantityChange}
              onRemove={stepperRemoves ? onRemove : undefined}
              removeLabel={stepperRemoves ? removeName : undefined}
              accessibilityLabel={name}
              testID={testID ? `${testID}-stepper` : undefined}
            />
          ) : (
            <Text
              variant="body-2-regular"
              testID={testID ? `${testID}-quantity` : undefined}
              style={{ color: paint.textSecondary, fontVariant: ['tabular-nums'] }}
            >
              {`×${quantity}`}
            </Text>
          )}
          {onRemove && !stepperRemoves ? (
            <GlyphButton
              size={32}
              icon={RiDeleteBinLine}
              accessibilityLabel={removeName}
              onPress={onRemove}
              testID={testID ? `${testID}-remove` : undefined}
            />
          ) : null}
        </View>
      </View>
    </Item>
  );
}

export const CartLine = memo(CartLineComponent);
CartLine.displayName = 'CartLine';
