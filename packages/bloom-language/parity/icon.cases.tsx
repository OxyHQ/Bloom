import type { ComponentType } from 'react';
import * as RN from 'react-native';
import * as icons from '@oxy.so/bloom/icons';
import type { Props as IconProps, sizes } from '@oxy.so/bloom/icons/shared';
import { tokens } from '@oxy.so/bloom/styles';
import { withAlpha } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

import { COLORS, ICON_SIZE } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { defineTokens, type ColorName, type IconSizeName } from '../src/tokens';
import { type ParityCase, Themed } from './support/cases';

type BloomIcon = ComponentType<IconProps>;

/** Every icon Bloom ships (`@oxy.so/bloom/icons`): Remix, its Simple Icons brand marks and its own set. */
export const BLOOM_ICONS: [string, BloomIcon][] = Object.entries(icons).filter(([name]) =>
  /^(Ri|Si)[A-Z0-9]|Icon$/.test(name),
) as [string, BloomIcon][];

const paint = (role: ColorName) => COLORS[role].paint;

const every: ParityCase[] = BLOOM_ICONS.map(([name, Glyph]) => ({
  name: name,
  language: () => toElement(L.Icon(Glyph).size('md').foreground('primary')),
  bloom: () => <Themed>{(c) => <Glyph size="md" fill={c.primary} />}</Themed>,
}));

const [, Heart] = BLOOM_ICONS.find(([name]) => name === 'RiHeart3Line') as [string, BloomIcon];

/** A numeric rung (`'18'`): an exact side carried over from apps, not one of Bloom's names. */
const exact = (size: IconSizeName) => /^\d+$/.test(size);

const rungs: ParityCase[] = (Object.keys(ICON_SIZE) as IconSizeName[]).map((size) => ({
  name: `size ${size}`,
  language: () => toElement(L.Icon(Heart).size(size)),
  // A numeric rung is the side an app writes as the glyph's width and height.
  bloom: () => (
    <Themed>
      {(c) =>
        exact(size) ? (
          <Heart width={ICON_SIZE[size]} height={ICON_SIZE[size]} fill={c.text} />
        ) : (
          <Heart size={size as keyof typeof sizes} fill={c.text} />
        )
      }
    </Themed>
  ),
}));

const inks: ParityCase[] = (Object.keys(COLORS) as ColorName[]).flatMap((role) => [
  {
    name: `foreground ${role}`,
    language: () => toElement(L.Icon(Heart).foreground(role)),
    bloom: () => <Themed>{(c) => <Heart size="md" fill={c[paint(role)]} />}</Themed>,
  },
  {
    name: `foreground ${role} from the stack`,
    language: () => toElement(L.HStack(L.Icon(Heart).size('sm')).foreground(role)),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View style={{ flexDirection: 'row' }}>
            <Heart size="sm" fill={c[paint(role)]} />
          </RN.View>
        )}
      </Themed>
    ),
  },
]);

const row = defineTokens({
  iconSize: { context: 13 },
  color: { brand: '#1877f2', white: 'white', veil: 'rgba(255,255,255,0.72)' },
});

const placed: ParityCase[] = [
  {
    // An app's brand colour: the hex it declares, the same in both schemes.
    name: 'a glyph and a box in an app colour',
    language: () =>
      toElement(
        L.HStack(L.Icon(Heart).size('sm'))
          .foreground(row.color.brand)
          .border(row.color.brand, 'thin'),
      ),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row', borderWidth: 1, borderColor: '#1877f2' }}>
        <Heart size="sm" fill="#1877f2" />
      </RN.View>
    ),
  },
  {
    // A colour name and an rgba() are the string itself on every platform, as a fill written out is.
    name: 'glyphs, text and a box in a named and an rgba() app colour',
    language: () =>
      toElement(
        L.HStack(L.Icon(Heart).size('sm').foreground(row.color.white), L.Text('a'))
          .foreground(row.color.veil)
          .background(row.color.white)
          .border(row.color.veil, 'thin'),
      ),
    bloom: () => (
      <RN.View
        style={{
          flexDirection: 'row',
          backgroundColor: 'white',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.72)',
        }}
      >
        <Heart size="sm" fill="white" />
        <Text style={{ color: 'rgba(255,255,255,0.72)' }}>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'an app token size',
    language: () => toElement(L.Icon(Heart).size(row.iconSize.context)),
    bloom: () => <Themed>{(c) => <Heart width={13} height={13} fill={c.text} />}</Themed>,
  },
  {
    name: 'a box around a glyph',
    language: () =>
      toElement(
        L.Icon(Heart).size('sm').padding('xs').background('surface').corner('full').clipped(),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View
            style={{
              paddingTop: tokens.space.xs,
              paddingBottom: tokens.space.xs,
              paddingStart: tokens.space.xs,
              paddingEnd: tokens.space.xs,
              backgroundColor: c.backgroundSecondary,
              borderRadius: tokens.borderRadius.full,
              overflow: 'hidden',
            }}
          >
            <Heart size="sm" fill={c.text} />
          </RN.View>
        )}
      </Themed>
    ),
  },
  {
    name: 'a named glyph',
    language: () => toElement(L.Icon(Heart).label('Liked').role('image')),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View accessibilityLabel="Liked" accessibilityRole="image">
            <Heart size="md" fill={c.text} />
          </RN.View>
        )}
      </Themed>
    ),
  },
];

/** Sizes, inks and placement on one glyph; `ICON_CASES_EVERY` draws every icon. */
/** An icon in an ink at a named opacity: its fill at that alpha, as Bloom's `withAlpha` writes it. */
const translucent: ParityCase[] = [
  {
    name: 'foreground muted/70',
    language: () => toElement(L.HStack(L.Icon(Heart)).foreground('muted/70')),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View style={{ flexDirection: 'row' }}>
            <Heart size="md" fill={withAlpha(c.textSecondary, 0.7)} />
          </RN.View>
        )}
      </Themed>
    ),
  },
];

export const ICON_CASES: ParityCase[] = [...rungs, ...inks, ...translucent, ...placed];
export const ICON_CASES_EVERY: ParityCase[] = every;
