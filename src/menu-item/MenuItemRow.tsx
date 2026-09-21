import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { Badge } from '../badge';
import { Button } from '../button';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { Item } from '../item';
import { ListingPriceLines } from '../listing-card/parts';
import { Stepper } from '../stepper';
import { useSurfaceFill } from '../styles/surface-levels';
import { space } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MENU_ITEM_GEOMETRY } from './constants';
import { MenuItemDiets, MenuItemSpice, MenuItemThumb } from './parts';
import { composeMenuItemName, resolveMenuItemPaint, spiceLevel } from './shared';
import type { MenuItemRowProps } from './types';

/**
 * A dish in a menu: what it is, what it costs, and how to put one in the
 * basket.
 *
 *   leading   the square photo (72; 56 compact), washed while sold out, with
 *             the basket count over its corner when no `Stepper` is drawn
 *   body      the name + the diet pills and the flames; the description,
 *             clamped to two lines; the price line — an optional struck
 *             original price, then the price semibold
 *   trailing  a `Stepper` once something is in the basket and the app can
 *             change it, otherwise the round add button, and NOTHING while the
 *             dish is sold out
 *
 * It is `Item` with a dish's slots filled in. The row, the press target, the
 * hover wash, the density rungs and the a11y role translation are `Item`'s job
 * and this family owns no second copy of any of them; the price line is
 * `listing-card`'s `ListingPriceLines`, which already draws a struck original
 * price beside a current one.
 *
 * A PRESSABLE ROW AND ITS ADD CONTROL ARE SIBLINGS, NOT PARENT AND CHILD.
 * `Item`'s pressable form is a real `<button>` on web, a button inside a button
 * is invalid HTML, and a web click on the inner control ALSO opens the row
 * (native does not bubble a press, so this is a web-only failure that a native
 * run cannot find). So a row that both opens the dish and adds it splits into
 * the row and the control side by side — the same answer `address/AddressRow`
 * reaches, for the same reason. A row with no press target keeps its control in
 * `Item`'s trailing slot, where there is nothing to nest inside.
 *
 * THE QUANTITY IS DRAWN ONCE. With `onQuantityChange` it lives in the
 * `Stepper`, which is where a reader would change it; without, it is a count
 * over the photo. A badge beside a stepper showing the same number is two
 * controls that mean one thing.
 */
function MenuItemRowComponent(props: MenuItemRowProps) {
  const {
    name,
    description,
    price,
    originalPrice,
    photo,
    photoVariant,
    diets,
    dietLabels,
    spice,
    spiceLabel,
    quantity = 0,
    onQuantityChange,
    onAdd,
    addLabel,
    unavailable = false,
    unavailableLabel = 'Sold out',
    onPress,
    density = 'comfortable',
    accessibilityLabel,
    style,
    testID,
  } = props;

  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveMenuItemPaint(theme, surface), [theme, surface]);
  const g = MENU_ITEM_GEOMETRY[density];
  const compact = density === 'compact';
  const heat = spiceLevel(spice);
  const inBasket = quantity > 0;
  const stepper = inBasket && onQuantityChange != null && !unavailable;

  const control = unavailable ? null : stepper ? (
    <Stepper
      size="small"
      value={quantity}
      min={0}
      onValueChange={onQuantityChange!}
      accessibilityLabel={name}
      testID={testID ? `${testID}-stepper` : undefined}
    />
  ) : onAdd ? (
    <Button
      variant="secondary"
      size="small"
      iconOnly
      leadingIcon={RiAddLine}
      accessibilityLabel={addLabel ?? `Add ${name}`}
      onPress={onAdd}
      testID={testID ? `${testID}-add` : undefined}
    />
  ) : null;

  const media = (
    <MenuItemThumb
      photo={photo}
      photoVariant={photoVariant}
      size={g.thumb}
      radius={g.thumbRadius}
      placeholder={paint.thumb}
      wash={paint.wash}
      washed={unavailable}
      overlay={
        inBasket && !stepper ? (
          <Badge
            content={quantity}
            variant="solid"
            color="primary"
            size="medium"
            testID={testID ? `${testID}-quantity` : undefined}
          />
        ) : null
      }
      testID={testID}
    />
  );

  const body = (
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
      {/*
        THE NAME OWNS ITS LINE. It used to share one with the flames, and at 390
        — where a thumbnail and a stepper leave the text column about 50 wide —
        a one-line `Text` is `nowrap` on web, so the fixed 44px glyph run took
        what it needed and the name collapsed to ZERO rather than truncating:
        three flames and no dish. The marks are a row of their own, below the
        description, where the flames and the diet pills are the same kind of
        thing anyway.
      */}
      <Text
        variant={compact ? 'body-semibold' : 'headline-semibold'}
        numberOfLines={1}
        testID={testID ? `${testID}-name` : undefined}
        style={{ color: paint.text }}
      >
        {name}
      </Text>
      {description ? (
        <Text
          variant="body-2-regular"
          numberOfLines={2}
          testID={testID ? `${testID}-description` : undefined}
          style={{ color: paint.textSecondary }}
        >
          {description}
        </Text>
      ) : null}
      <MenuItemDiets
        diets={diets ?? []}
        labels={dietLabels}
        surface={surface}
        glyphColor={paint.diet}
        glyph={g.glyph}
        // `undefined` rather than an element that renders nothing: the row is
        // drawn at all only when there is something in it, and an empty element
        // still counts as a mark.
        leading={
          heat > 0 ? (
            <MenuItemSpice
              level={heat}
              label={spiceLabel}
              color={paint.spice}
              glyph={g.glyph}
              testID={testID}
            />
          ) : undefined
        }
        style={{ marginTop: 2 }}
        testID={testID}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, minWidth: 0 }}>
        <ListingPriceLines
          lines={[{ price, originalPrice }]}
          size={compact ? 'small' : 'medium'}
          color={paint.text}
          secondaryColor={paint.textSecondary}
          style={{ flexShrink: 1, minWidth: 0 }}
          testID={testID ? `${testID}-price` : undefined}
        />
        {unavailable ? (
          <Text
            variant="body-2-medium"
            numberOfLines={1}
            testID={testID ? `${testID}-unavailable` : undefined}
            style={{ color: paint.textSecondary }}
          >
            {unavailableLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const splitControl = control != null && onPress != null && !unavailable;

  const row = (
    <Item
      leading={media}
      trailing={splitControl ? null : control}
      onPress={unavailable ? undefined : onPress}
      disabled={unavailable}
      density={density}
      accessibilityLabel={accessibilityLabel ?? composeMenuItemName(props)}
      // `paddingRight`, never `paddingHorizontal`: `Item` writes the longhand
      // for the reason its own file records, and a shorthand here would outrank
      // it on web and not on native.
      style={splitControl ? { paddingRight: space.sm } : style}
      testID={testID}
    >
      {body}
    </Item>
  );

  if (!splitControl) return row;

  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', paddingRight: space.lg }, style]}
      testID={testID ? `${testID}-split` : undefined}
    >
      {/*
        `Item`'s `style` lands on its CONTENT view, inside the `Pressable` that
        is actually this row's flex child — so `flex: 1` written there would sit
        one node below where the layout happens. The flex goes on a wrapper the
        parent CAN see. (`address/AddressRow` records the same measurement.)
      */}
      <View style={{ flex: 1, minWidth: 0 }}>{row}</View>
      {control}
    </View>
  );
}

export const MenuItemRow = memo(MenuItemRowComponent);
MenuItemRow.displayName = 'MenuItemRow';
