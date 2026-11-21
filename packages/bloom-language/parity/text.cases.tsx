import type { ComponentType } from 'react';
import * as RN from 'react-native';
import { InlineMarkdown } from '@oxy.so/bloom/markdown';
import { tokens } from '@oxy.so/bloom/styles';
import {
  Blockquote,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Large,
  Lead,
  Muted,
  P,
  Small,
  Subtitle,
  Text,
  Title,
  TYPE_SCALE,
  type TextProps,
  type TypeScaleVariant,
} from '@oxy.so/bloom/typography';

import { COLORS, FONT_SIZE, LEADING } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import type { ColorName, FontSizeName, TextStyleName, TypeFamily, WeightName } from '../src/tokens';
import { type ParityCase, Themed } from './support/cases';

const paint = (role: ColorName) => COLORS[role].paint;

/** Every step of Bloom's type ramp, as `.font(family).weight(weight)`. */
const ramp: ParityCase[] = Object.keys(TYPE_SCALE).map((variant) => {
  const [, family, weight] = /^(.*)-(regular|medium|semibold|bold)$/.exec(variant) as string[];
  return {
    name: `font ${variant}`,
    language: () =>
      toElement(
        L.Text('Type')
          .font(family as TypeFamily)
          .weight(weight as WeightName),
      ),
    bloom: () => <Text variant={variant as TypeScaleVariant}>Type</Text>,
  };
});

/** Every size rung, and a weight and a leading with it. */
const sizes: ParityCase[] = (Object.keys(FONT_SIZE) as FontSizeName[]).flatMap((size) => [
  {
    name: `size ${size}`,
    language: () => toElement(L.Text('Size').font(size)),
    bloom: () => <Text style={{ fontSize: FONT_SIZE[size] }}>Size</Text>,
  },
  {
    name: `size ${size}, bold, relaxed`,
    language: () => toElement(L.Text('Size').font(size).weight('bold').leading('relaxed')),
    bloom: () => (
      <Text
        style={{
          fontSize: FONT_SIZE[size],
          fontWeight: '700',
          lineHeight: FONT_SIZE[size] * LEADING.relaxed,
        }}
      >
        Size
      </Text>
    ),
  },
]);

/** Every colour role as the text's ink, and the environment's. */
const inks: ParityCase[] = (Object.keys(COLORS) as ColorName[]).flatMap((role) => [
  {
    name: `foreground ${role}`,
    language: () => toElement(L.Text('Ink').foreground(role)),
    bloom: () => <Themed>{(c) => <Text style={{ color: c[paint(role)] }}>Ink</Text>}</Themed>,
  },
  {
    name: `foreground ${role} from the stack`,
    language: () => toElement(L.VStack(L.Text('Ink').font('body')).foreground(role)),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View>
            <Text variant="body-regular" style={{ color: c[paint(role)] }}>
              Ink
            </Text>
          </RN.View>
        )}
      </Themed>
    ),
  },
]);

const STYLES: Record<Exclude<TextStyleName, 'blockquote'>, ComponentType<TextProps>> = {
  title: Title,
  subtitle: Subtitle,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  paragraph: P,
  lead: Lead,
  large: Large,
  small: Small,
  muted: Muted,
};

/** Every typography component, alone and with a ramp font of its own. */
const textStyles: ParityCase[] = [
  ...(Object.keys(STYLES) as (keyof typeof STYLES)[]).flatMap((name) => {
    const Component = STYLES[name];
    return [
      {
        name: `textStyle ${name}`,
        language: () => toElement(L.Text('Styled').textStyle(name)),
        bloom: () => <Component>Styled</Component>,
      },
      {
        name: `textStyle ${name}, title-2 semibold, muted`,
        language: () =>
          toElement(
            L.Text('Styled').textStyle(name).font('title-2').weight('semibold').foreground('muted'),
          ),
        bloom: () => (
          <Themed>
            {(c) => (
              <Component variant="title-2-semibold" style={{ color: c.textSecondary }}>
                Styled
              </Component>
            )}
          </Themed>
        ),
      },
    ];
  }),
  {
    name: 'textStyle blockquote',
    language: () => toElement(L.Text('Quoted').textStyle('blockquote')),
    bloom: () => <Blockquote>Quoted</Blockquote>,
  },
  {
    name: 'textStyle blockquote, padded',
    language: () => toElement(L.Text('Quoted').textStyle('blockquote').padding('vertical', 'sm')),
    bloom: () => (
      <Blockquote style={{ paddingTop: tokens.space.sm, paddingBottom: tokens.space.sm }}>
        Quoted
      </Blockquote>
    ),
  },
];

const LONG = 'A line long enough to be cut where the truncation says';

const behaviour: ParityCase[] = [
  {
    name: 'lines',
    language: () => toElement(L.Text(LONG).font('body').lines(2)),
    bloom: () => (
      <Text variant="body-regular" numberOfLines={2} ellipsizeMode="tail">
        {LONG}
      </Text>
    ),
  },
  ...(['head', 'middle', 'tail', 'clip'] as const).map((mode) => ({
    name: `lines, truncation ${mode}`,
    language: () => toElement(L.Text(LONG).lines(1).truncation(mode)),
    bloom: () => (
      <Text numberOfLines={1} ellipsizeMode={mode}>
        {LONG}
      </Text>
    ),
  })),
  {
    name: 'selectable',
    language: () => toElement(L.Text('Copy me').selectable()),
    bloom: () => <Text selectable>Copy me</Text>,
  },
  {
    name: 'not selectable',
    language: () => toElement(L.Text('Keep me').selectable(false)),
    bloom: () => <Text selectable={false}>Keep me</Text>,
  },
  ...(['start', 'center', 'end', 'justify'] as const).map((align) => ({
    name: `textAlign ${align}`,
    language: () => toElement(L.Text('Aligned').textAlign(align)),
    bloom: () => (
      <Text
        style={{
          textAlign: (
            { start: 'left', center: 'center', end: 'right', justify: 'justify' } as const
          )[align],
        }}
      >
        Aligned
      </Text>
    ),
  })),
  {
    name: 'italic, underline, strikethrough, uppercase',
    language: () =>
      toElement(L.Text('Marked').italic().underline().strikethrough().textCase('uppercase')),
    bloom: () => (
      <Text
        style={{
          fontStyle: 'italic',
          textDecorationLine: 'underline line-through',
          textTransform: 'uppercase',
        }}
      >
        Marked
      </Text>
    ),
  },
  ...(['lowercase', 'capitalize'] as const).map((textCase) => ({
    name: `textCase ${textCase}`,
    language: () => toElement(L.Text('Cased').textCase(textCase)),
    bloom: () => <Text style={{ textTransform: textCase }}>Cased</Text>,
  })),
  {
    name: 'a header, named',
    language: () =>
      toElement(L.Text('Inbox').font('title-1').role('header').label('Inbox, 3 unread')),
    bloom: () => (
      <Text
        variant="title-1-regular"
        accessibilityRole="header"
        accessibilityLabel="Inbox, 3 unread"
      >
        Inbox
      </Text>
    ),
  },
  {
    name: 'a box on text',
    language: () => toElement(L.Text('Boxed').font('body-2').padding('md').background('surface')),
    bloom: () => (
      <Themed>
        {(c) => (
          <Text
            variant="body-2-regular"
            style={{
              paddingTop: tokens.space.md,
              paddingBottom: tokens.space.md,
              paddingStart: tokens.space.md,
              paddingEnd: tokens.space.md,
              backgroundColor: c.backgroundSecondary,
            }}
          >
            Boxed
          </Text>
        )}
      </Themed>
    ),
  },
];

/** Spans and links, against Bloom's inline Markdown, which draws both inside a text. */
const inline: ParityCase[] = [
  {
    name: 'a semibold span',
    language: () => toElement(L.Text('Read ', L.Text('this').weight('semibold'), ' first')),
    bloom: () => (
      <Text>
        <InlineMarkdown source="Read **this** first" />
      </Text>
    ),
  },
  {
    name: 'an italic and a struck span',
    language: () =>
      toElement(L.Text(L.Text('soft').italic(), ' and ', L.Text('gone').strikethrough())),
    bloom: () => (
      <Text>
        <InlineMarkdown source="*soft* and ~~gone~~" />
      </Text>
    ),
  },
  {
    name: 'a link span',
    language: () =>
      toElement(
        L.Text('Read the ', L.Text('terms').link('https://oxy.so/terms'), '.').font('body'),
      ),
    bloom: () => (
      <Text variant="body-regular">
        <InlineMarkdown source="Read the [terms](https://oxy.so/terms)." />
      </Text>
    ),
  },
  {
    name: 'a span of a heading keeps the heading’s type',
    language: () =>
      toElement(L.Text('Hello ', L.Text('world').foreground('primary')).textStyle('h2')),
    bloom: () => (
      <Themed>
        {(c) => (
          <H2>
            Hello <RN.Text style={{ color: c.primary }}>world</RN.Text>
          </H2>
        )}
      </Themed>
    ),
  },
];

/** The rungs that name what apps render today: off-ramp weights, Tailwind's leadings. */
const named: ParityCase[] = [
  ...(['light', 'extrabold'] as const).map((weight) => ({
    name: `body, ${weight}`,
    language: () => L.Text('Weighed').font('body').weight(weight),
    bloom: () => (
      <Text variant="body-regular" style={{ fontWeight: weight === 'light' ? '300' : '800' }}>
        Weighed
      </Text>
    ),
  })),
  ...(['close', 'easy'] as const).map((leading) => ({
    name: `size md, leading ${leading}`,
    language: () => L.Text('Lines').font('md').leading(leading),
    bloom: () => <Text style={{ fontSize: 15, lineHeight: 15 * LEADING[leading] }}>Lines</Text>,
  })),
].map((c) => ({ ...c, language: () => toElement(c.language()) }));

export const TEXT_CASES: ParityCase[] = [
  ...named,
  ...ramp,
  ...sizes,
  ...inks,
  ...textStyles,
  ...behaviour,
  ...inline,
];
