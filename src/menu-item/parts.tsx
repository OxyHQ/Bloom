import React from 'react';
import { Image, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { Chip } from '../chip';
import type { BloomIconComponent } from '../icons/icon-component';
import { RiFireLine } from '../icons/remix/RiFireLine';
import { RiLeafLine } from '../icons/remix/RiLeafLine';
import { RiPlantLine } from '../icons/remix/RiPlantLine';
import { useImageResolver } from '../image-resolver/context';
import { resolvePhoto } from '../listing-card/shared';
import {
  MENU_ITEM_DIET_LABELS,
  MENU_ITEM_SPICE_MAX,
  MENU_ITEM_WASH_OPACITY,
} from './constants';
import { describeSpice, spiceLevel, uniqueDiets } from './shared';

import type { MenuItemDiet, MenuItemRowProps } from './types';

/**
 * The pieces a dish row and a dish sheet both draw, so the two cannot drift
 * apart. Internal: not on the family barrel.
 */

const IS_WEB = Platform.OS === 'web';

/** Only the two diets that are about what the dish is MADE OF carry a glyph. */
const DIET_GLYPH: Partial<Record<MenuItemDiet, BloomIconComponent>> = {
  vegetarian: RiLeafLine,
  vegan: RiPlantLine,
};

// ---------------------------------------------------------------------------

export interface MenuItemDietsProps {
  diets: ReadonlyArray<MenuItemDiet>;
  labels?: MenuItemRowProps['dietLabels'];
  /** The colour the pills sit on — a subtle chip's dark fill is translucent. */
  surface: string;
  /** The glyph's colour, painted by the caller: `Chip` renders `startIcon` as given. */
  glyphColor: string;
  glyph: number;
  /**
   * A node before the first pill, inside the SAME wrapping row — the heat
   * marks. It is a slot rather than a sibling row because a wrapping row nested
   * inside another row is one flex item that will not shrink below its content,
   * so the pills overflowed the text column instead of wrapping (measured at
   * 390, where "Gluten-free" ran off the card's edge).
   */
  leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The diet pills, in a wrapping row 6 apart. Duplicates are drawn once.
 *
 * `aria-hidden`: every word here is already in the row's own accessible name,
 * in full and in the same order, so announcing the pills too would say each
 * diet twice.
 */
export function MenuItemDiets({ diets, labels, surface, glyphColor, glyph, leading, style, testID }: MenuItemDietsProps) {
  const unique = uniqueDiets(diets);
  if (unique.length === 0 && leading == null) return null;
  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }, style]}
      testID={testID ? `${testID}-marks` : undefined}
    >
      {leading}
      {unique.map((diet) => {
        const Glyph = DIET_GLYPH[diet];
        return (
          <Chip
            key={diet}
            size="small"
            variant="subtle"
            color={Glyph ? 'success' : 'default'}
            surface={surface}
            startIcon={Glyph ? <Glyph width={glyph} height={glyph} fill={glyphColor} /> : undefined}
            testID={testID ? `${testID}-diet-${diet}` : undefined}
          >
            {labels?.[diet] ?? MENU_ITEM_DIET_LABELS[diet]}
          </Chip>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface MenuItemSpiceProps {
  /** `1`–`3`. Zero draws nothing. */
  level: number;
  label?: string;
  color: string;
  glyph: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The heat, as that many flames out of three.
 *
 * ONE accessible element with one name ("Spicy 2 of 3") — a run of three
 * identical glyphs announces nothing at all, and named individually it would
 * say "flame, flame" and leave the reader to count. Inside `MenuItemRow` it
 * sits in the marks row, which is `aria-hidden` because the ROW's own name
 * already says the heat in the same words; the name here is what makes the
 * component correct on its own, anywhere else.
 */
export function MenuItemSpice({ level, label, color, glyph, style, testID }: MenuItemSpiceProps) {
  const shown = spiceLevel(level);
  if (shown === 0) return null;
  return (
    <View
      accessible
      // `role="img"` on web only, the shape `Rating` uses: a plain `div` with an
      // `aria-label` and no role is not announced there, while on native
      // `accessible` + the label is already one node with one name.
      {...(IS_WEB ? { role: 'img' as const } : null)}
      accessibilityLabel={describeSpice(shown, label)}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 1 }, style]}
      testID={testID ? `${testID}-spice` : undefined}
    >
      {Array.from({ length: Math.min(shown, MENU_ITEM_SPICE_MAX) }, (_, index) => (
        <RiFireLine key={index} width={glyph} height={glyph} fill={color} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------

export interface MenuItemThumbProps {
  photo?: string;
  photoVariant?: string;
  /** The square's edge. */
  size: number;
  /** Its corner. */
  radius: number;
  /** Behind a photo that has not loaded, and behind a dish that has none. */
  placeholder: string;
  /** Laid over the photo while `washed` — the SURFACE, so the picture fades into the row. */
  wash: string;
  /** Washes the photo toward the row — a sold-out dish. */
  washed?: boolean;
  /** A node laid over the thumbnail's top-right — the basket count. */
  overlay?: React.ReactNode;
  testID?: string;
}

/**
 * The dish's square picture, or the plain placeholder square when it has none.
 *
 * Its geometry and its two colours arrive as PROPS rather than as a density and
 * a paint object, because `cart-panel` draws the same square at its own rung —
 * a basket line and a menu row are the same dish, and two implementations of
 * one square is how the wash ends up at two different opacities.
 */
export function MenuItemThumb({
  photo,
  photoVariant,
  size,
  radius,
  placeholder,
  wash,
  washed = false,
  overlay,
  testID,
}: MenuItemThumbProps) {
  const resolver = useImageResolver();
  const uri = photo ? resolvePhoto(photo, resolver, photoVariant) : undefined;
  return (
    <View
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: radius,
        backgroundColor: placeholder,
      }}
      testID={testID ? `${testID}-photo` : undefined}
    >
      <View style={{ flex: 1, borderRadius: radius, overflow: 'hidden' }}>
        {uri ? (
          <Image
            source={{ uri }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            style={{ width: '100%', height: '100%' }}
          />
        ) : null}
        {washed ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: wash,
              opacity: MENU_ITEM_WASH_OPACITY,
            }}
            testID={testID ? `${testID}-wash` : undefined}
          />
        ) : null}
      </View>
      {/*
        OUTSIDE the clipping box: the count sits on the thumbnail's corner and a
        badge clipped to the picture's radius loses its own edge.
      */}
      {overlay ? <View style={{ position: 'absolute', top: -6, right: -6 }}>{overlay}</View> : null}
    </View>
  );
}
