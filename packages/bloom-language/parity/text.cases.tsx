import type { ComponentType } from 'react';
import * as RN from 'react-native';
import { InlineMarkdown } from '@oxy.so/bloom/markdown';
import { tokens } from '@oxy.so/bloom/styles';
import { type ThemeColors, withAlpha } from '@oxy.so/bloom/theme';
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
  fontFamilyStyle,
  type TextProps,
  type TypeScaleVariant,
} from '@oxy.so/bloom/typography';

import {
  COLORS,
  FONT_SIZE,
  LEADING,
  LEADING_PX,
  TRACKING,
  TRACKING_PX,
} from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import type { ColorName, FontSizeName, TextStyleName, TypeFamily, WeightName } from '../src/tokens';
import { type ParityCase, Themed, ThemedRgb } from './support/cases';
import { BaseFontText } from './support/base-font';

/** Web CSS react-native-web passes through, which React Native's style types do not name. */
const webCss = (style: Record<string, string>) => style as RN.TextStyle;

/**
 * A leading or tracking that is a ratio of the size, as an app's class draws
 * it: on native NativeWind's compiler writes it rounded to two decimals
 * (`leading-[1.375]` at 15px is 20.63), the browser computes the exact product.
 */
const ofSize = (size: number, ratio: number) =>
  RN.Platform.OS === 'web' ? size * ratio : Math.round(size * ratio * 100) / 100;

const paint = (role: ColorName) => COLORS[role].paint as keyof ThemeColors;
/** The roles of the theme's palette (the surface fill has its own cases, surface-fill.cases.tsx). */
const PALETTE_ROLES = (Object.keys(COLORS) as ColorName[]).filter(
  (role) => COLORS[role].web !== null,
);

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
          lineHeight: ofSize(FONT_SIZE[size], LEADING.relaxed),
        }}
      >
        Size
      </Text>
    ),
  },
]);

/** Every colour role as the text's ink, and the environment's. */
const inks: ParityCase[] = PALETTE_ROLES.flatMap((role) => [
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
  {
    name: 'digits of one width',
    language: () => toElement(L.Text('1,024').monospacedDigit()),
    bloom: () => <Text style={{ fontVariant: ['tabular-nums'] }}>1,024</Text>,
  },
  {
    name: 'a web line that breaks anywhere',
    language: () => toElement(L.Text('0x7f3a9c2e1b').wordBreak('all')),
    // Tailwind's break-all is web CSS: React Native has no word breaking to set.
    bloom: () => (
      <Text style={RN.Platform.OS === 'web' ? webCss({ wordBreak: 'break-all' }) : undefined}>
        0x7f3a9c2e1b
      </Text>
    ),
  },
  {
    name: 'a web line that breaks a long word',
    language: () => toElement(L.Text('https://oxy.so/a/very/long/path').wordBreak('words')),
    bloom: () => (
      <Text style={RN.Platform.OS === 'web' ? webCss({ overflowWrap: 'break-word' }) : undefined}>
        https://oxy.so/a/very/long/path
      </Text>
    ),
  },
  {
    name: 'text only a screen reader reads',
    language: () => toElement(L.Text('3 results').accessibilityOnly()),
    bloom: () => (
      <Text
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          paddingTop: 0,
          paddingBottom: 0,
          paddingStart: 0,
          paddingEnd: 0,
          marginTop: -1,
          marginBottom: -1,
          marginStart: -1,
          marginEnd: -1,
          overflow: 'hidden',
          borderWidth: 0,
          ...(RN.Platform.OS === 'web'
            ? webCss({ clipPath: 'inset(50%)', whiteSpace: 'nowrap' })
            : null),
        }}
      >
        3 results
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
    bloom: () => (
      <Text style={{ fontSize: 15, lineHeight: ofSize(15, LEADING[leading]) }}>Lines</Text>
    ),
  })),
  // Tailwind's `text-base` (16/24), `text-lg` (18/28) and `text-[11px]`, as apps set them.
  {
    name: 'text-base: size 16, leading normal',
    language: () => L.Text('Base').font('16').leading('normal'),
    bloom: () => <Text style={{ fontSize: 16, lineHeight: 24 }}>Base</Text>,
  },
  {
    name: 'text-lg: size 18, leading 28px',
    language: () => L.Text('Large').font('18').leading('28px'),
    bloom: () => <Text style={{ fontSize: 18, lineHeight: 28 }}>Large</Text>,
  },
  // Bloom's `text-caption` (11/14), Tailwind's `text-xl` (20/28), `text-2xl` (24/32) and `text-[14px]`.
  {
    name: 'text-caption: size 11, leading 14px',
    language: () => L.Text('Caption').font('11').leading('14px'),
    bloom: () => <Text style={{ fontSize: 11, lineHeight: 14 }}>Caption</Text>,
  },
  {
    name: 'text-xl: size xl, leading 28px',
    language: () => L.Text('Title').font('xl').leading('28px'),
    bloom: () => <Text style={{ fontSize: 20, lineHeight: 28 }}>Title</Text>,
  },
  {
    name: 'text-2xl: size 24, leading 32px',
    language: () => L.Text('Head').font('24').leading('32px'),
    bloom: () => <Text style={{ fontSize: 24, lineHeight: 32 }}>Head</Text>,
  },
  {
    name: 'text-[14px]: size 14',
    language: () => L.Text('Body').font('14'),
    bloom: () => <Text style={{ fontSize: 14 }}>Body</Text>,
  },
  {
    name: 'text-[11px]: size 11',
    language: () => L.Text('Small').font('11'),
    bloom: () => <Text style={{ fontSize: 11 }}>Small</Text>,
  },
  // The sizes Mention writes outside the ramp.
  ...(['9', '12.5', '28', '42', '96'] as const).map((size) => ({
    name: `size ${size}`,
    language: () => L.Text('Sized').font(size),
    bloom: () => <Text style={{ fontSize: Number(size) }}>Sized</Text>,
  })),
].map((c) => ({ ...c, language: () => toElement(c.language()) }));

/**
 * A role at a named opacity, as an app draws `text-muted-foreground/70` today:
 * the colour at that alpha (on the web Tailwind's mix with transparent, which
 * the browser draws as the colour at the mix's alpha; react-native-web takes
 * no `color-mix()` inline, so this side writes the colour).
 */
const translucent: ParityCase[] = (
  [
    ['muted/70', 'textSecondary', 0.7],
    ['primary/30', 'primary', 0.3],
    ['destructive/10', 'destructive', 0.1],
  ] as const
).map(([token, key, amount]) => ({
  name: `foreground ${token}`,
  language: () => toElement(L.Text('Ink').foreground(token)),
  bloom: () => (
    <ThemedRgb>{(c) => <Text style={{ color: withAlpha(c[key], amount) }}>Ink</Text>}</ThemedRgb>
  ),
}));

/** Tracking, in em of the size as Tailwind's `tracking-*`; and Bloom's monospaced face (`font-mono`). */
const tracked: ParityCase[] = [
  ...(Object.keys(TRACKING) as (keyof typeof TRACKING)[]).map((tracking) => ({
    name: `size md, tracking ${tracking}`,
    language: () => toElement(L.Text('Track').font('md').tracking(tracking)),
    bloom: () => (
      <Text style={{ fontSize: 15, letterSpacing: ofSize(15, TRACKING[tracking]) }}>Track</Text>
    ),
  })),
  ...(Object.keys(TRACKING_PX) as (keyof typeof TRACKING_PX)[]).map((tracking) => ({
    name: `size md, tracking ${tracking}`,
    language: () => toElement(L.Text('Track').font('md').tracking(tracking)),
    bloom: () => <Text style={{ fontSize: 15, letterSpacing: TRACKING_PX[tracking] }}>Track</Text>,
  })),
  ...(Object.keys(LEADING_PX) as (keyof typeof LEADING_PX)[]).map((leading) => ({
    name: `size md, leading ${leading}`,
    language: () => toElement(L.Text('Lines').font('md').leading(leading)),
    bloom: () => <Text style={{ fontSize: 15, lineHeight: LEADING_PX[leading] }}>Lines</Text>,
  })),
  {
    name: 'caption-1, tracking wider (uppercase labels)',
    language: () => toElement(L.Text('Label').font('caption-1').tracking('wider')),
    bloom: () => (
      <Text variant="caption-1-regular" style={{ letterSpacing: ofSize(12, 0.05) }}>
        Label
      </Text>
    ),
  },
  // No font: the leading and the tracking measure from Bloom Text's own 13px, which stays unwritten.
  {
    name: 'no font, leading relaxed and tracking wide',
    language: () => toElement(L.Text('Default').leading('relaxed').tracking('wide')),
    bloom: () => (
      <Text
        style={{
          lineHeight: ofSize(13, LEADING.relaxed),
          letterSpacing: ofSize(13, TRACKING.wide),
        }}
      >
        Default
      </Text>
    ),
  },
  {
    name: 'no font, a leading from the stack',
    language: () => toElement(L.VStack(L.Text('Default')).leading('close')),
    bloom: () => (
      <RN.View>
        <Text style={{ lineHeight: ofSize(13, LEADING.close) }}>Default</Text>
      </RN.View>
    ),
  },
  {
    name: 'font mono',
    language: () => toElement(L.Text('const x = 1').font('mono')),
    bloom: () => <Text style={fontFamilyStyle('mono')}>const x = 1</Text>,
  },
  {
    name: 'body in mono, from the stack',
    language: () => toElement(L.VStack(L.Text('code')).font('body').font('mono')),
    bloom: () => (
      <RN.View>
        <Text variant="body-regular" style={fontFamilyStyle('mono')}>
          code
        </Text>
      </RN.View>
    ),
  },
  {
    name: 'a mono size rung keeps its size',
    language: () => toElement(L.Text('12').font('mono').font('xs')),
    bloom: () => <Text style={{ fontSize: 12, ...fontFamilyStyle('mono') }}>12</Text>,
  },
  {
    // Mention's camera countdown: Tailwind's text-8xl in bold, in the display face.
    name: 'a numeric size in the display face',
    language: () =>
      toElement(
        L.Text('3').font('96').leading('96px').weight('bold').foreground('white').font('display'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <Text
            style={{
              ...fontFamilyStyle('display'),
              color: c[paint('white')],
              fontSize: 96,
              lineHeight: 96,
              fontWeight: '700',
            }}
          >
            3
          </Text>
        )}
      </Themed>
    ),
  },
  {
    name: 'the display face, then a size, from the stack',
    language: () => toElement(L.VStack(L.Text('42')).font('display').font('42')),
    bloom: () => (
      <RN.View>
        <Text style={{ fontSize: 42, ...fontFamilyStyle('display') }}>42</Text>
      </RN.View>
    ),
  },
  {
    // At rest a numeric content transition is the plain text: the roll's pieces exist only while it plays.
    name: 'a numeric count at rest',
    language: () =>
      toElement(L.Text('1,204').font('md').contentTransition('numeric', 1204).animation('roll', 0)),
    bloom: () => <Text style={{ fontSize: FONT_SIZE.md }}>1,204</Text>,
  },
];

/** React Native's own Text, as an app draws it (`support/base-font`): its base face, then only what the chain names. */
const raw: ParityCase[] = [
  {
    // Mention's upload progress: a text read as a progress bar's value.
    name: 'RawText, a progress value',
    language: () =>
      toElement(
        L.RawText('40%').role('progressbar').accessibilityValue({ min: 0, max: 100, now: 40 }),
      ),
    bloom: () => (
      <BaseFontText
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: 40 }}
      >
        40%
      </BaseFontText>
    ),
  },
  {
    // Mention's attachment cards announce their status as a polite live region.
    name: 'RawText, a polite live region',
    language: () => toElement(L.RawText('Raw').liveRegion('polite')),
    bloom: () => <BaseFontText accessibilityLiveRegion="polite">Raw</BaseFontText>,
  },
  {
    name: 'RawText, bare',
    language: () => toElement(L.RawText('Raw')),
    bloom: () => <BaseFontText>Raw</BaseFontText>,
  },
  {
    name: 'RawText, a size, a line height, a weight and an ink',
    language: () =>
      toElement(L.RawText('Raw').font('14').leading('20px').weight('semibold').foreground('muted')),
    bloom: () => (
      <Themed>
        {(c) => (
          <BaseFontText
            style={{ fontSize: 14, lineHeight: 20, fontWeight: '600', color: c[paint('muted')] }}
          >
            Raw
          </BaseFontText>
        )}
      </Themed>
    ),
  },
  {
    name: 'RawText in a stack, with a span',
    language: () =>
      toElement(L.VStack(L.RawText('a ', L.RawText('b').weight('bold')).lines(2)).padding('sm')),
    bloom: () => (
      <RN.View style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}>
        <BaseFontText numberOfLines={2} ellipsizeMode="tail">
          a <BaseFontText style={{ fontWeight: '700' }}>b</BaseFontText>
        </BaseFontText>
      </RN.View>
    ),
  },
  {
    name: 'RawText in a Bloom Text keeps its parent’s face',
    language: () => toElement(L.Text('a ', L.RawText('b'))),
    bloom: () => (
      <Text>
        a <BaseFontText>b</BaseFontText>
      </Text>
    ),
  },
  {
    name: 'a physical alignment (text-left, text-right)',
    language: () =>
      toElement(L.VStack(L.Text('a').textAlign('left'), L.RawText('b').textAlign('right'))),
    bloom: () => (
      <RN.View>
        <Text style={{ textAlign: 'left' }}>a</Text>
        <BaseFontText style={{ textAlign: 'right' }}>b</BaseFontText>
      </RN.View>
    ),
  },
  {
    name: 'truncate: no wrap, clipped, an ellipsis where cut (no line limit)',
    language: () => toElement(L.Text('a').noWrap().clipped().truncation('tail')),
    bloom: () => (
      <Text
        ellipsizeMode="tail"
        style={
          RN.Platform.OS === 'web'
            ? ({
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              } as RN.TextStyle)
            : { overflow: 'hidden' }
        }
      >
        a
      </Text>
    ),
  },
  {
    name: 'a platform’s own look: tabular digits and no wrap on the web only',
    language: () => toElement(L.Text('12').when('web', (v) => v.monospacedDigit().noWrap())),
    bloom: () => (
      <Text
        style={
          RN.Platform.OS === 'web'
            ? ({ fontVariant: ['tabular-nums'], whiteSpace: 'nowrap' } as RN.TextStyle)
            : undefined
        }
      >
        12
      </Text>
    ),
  },
  {
    name: 'RawText in a family of its own',
    language: () => toElement(L.RawText('Raw').font('mono')),
    bloom: () => <BaseFontText style={fontFamilyStyle('mono')}>Raw</BaseFontText>,
  },
];

export const TEXT_CASES: ParityCase[] = [
  ...raw,
  ...named,
  ...tracked,
  ...translucent,
  ...ramp,
  ...sizes,
  ...inks,
  ...textStyles,
  ...behaviour,
  ...inline,
];
