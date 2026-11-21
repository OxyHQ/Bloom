import type { ComponentType } from 'react';
import * as RN from 'react-native';
import * as icons from '@oxy.so/bloom/icons';
import type { Props as IconProps, sizes } from '@oxy.so/bloom/icons/shared';
import { tokens } from '@oxy.so/bloom/styles';
import { withAlpha } from '@oxy.so/bloom/theme';

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

const rungs: ParityCase[] = (Object.keys(ICON_SIZE) as IconSizeName[]).map((size) => ({
  name: `size ${size}`,
  language: () => toElement(L.Icon(Heart).size(size)),
  bloom: () => <Themed>{(c) => <Heart size={size as keyof typeof sizes} fill={c.text} />}</Themed>,
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

const row = defineTokens({ iconSize: { context: 13 } });

const placed: ParityCase[] = [
  {
    name: 'an app token size',
    language: () => toElement(L.Icon(Heart).size(row.iconSize.context)),
    bloom: () => <Themed>{(c) => <Heart width={13} height={13} fill={c.text} />}</Themed>,
  },
  {
    name: 'a box around a glyph',
    language: () =>
      toElement(L.Icon(Heart).size('sm').padding('xs').background('surface').corner('full')),
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
/** An icon in an ink at a named opacity: its fill at that alpha (on the web, the mix Bloom's paint writes). */
const translucent: ParityCase[] = [
  {
    name: 'foreground muted/faded',
    language: () => toElement(L.HStack(L.Icon(Heart)).foreground('muted/faded')),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View style={{ flexDirection: 'row' }}>
            <Heart
              size="md"
              fill={
                RN.Platform.OS === 'web'
                  ? `color-mix(in srgb, ${c.textSecondary} 70%, transparent)`
                  : withAlpha(c.textSecondary, 0.7)
              }
            />
          </RN.View>
        )}
      </Themed>
    ),
  },
];

export const ICON_CASES: ParityCase[] = [...rungs, ...inks, ...translucent, ...placed];
export const ICON_CASES_EVERY: ParityCase[] = every;
