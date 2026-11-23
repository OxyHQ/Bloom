import { useState, type ReactElement, type ReactNode } from 'react';
import * as RN from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { bloomShadowStyle } from '@oxy.so/bloom/design-tokens';
import { Border, Fill, Image } from '@oxy.so/bloom/shapes';
import { Z_INDEX } from '@oxy.so/bloom/styles';
import { tokens } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { hold, type ParityCase, Themed } from './support/cases';

const { space, borderRadius } = tokens;

const JUSTIFY = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
} as const;

const distribution: ParityCase[] = [
  ...ENUMS.justify.map((justify) => ({
    name: `justify ${justify}`,
    language: () => toElement(L.HStack(L.Text('a'), L.Text('b')).justify(justify)),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row', justifyContent: JUSTIFY[justify] }}>
        <Text>a</Text>
        <Text>b</Text>
      </RN.View>
    ),
  })),
  {
    name: 'a wrapping row with a gap',
    language: () => toElement(L.HStack(L.Text('a'), L.Text('b')).wrap().spacing('sm')),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <Text>a</Text>
        <Text>b</Text>
      </RN.View>
    ),
  },
  {
    name: 'a row laid out vertically',
    language: () => toElement(L.HStack(L.Text('a')).axis('vertical')),
    bloom: () => (
      <RN.View style={{ flexDirection: 'column' }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
];

const placement: ParityCase[] = [
  {
    name: 'its own alignment, a stacking level',
    language: () => toElement(L.VStack(L.Text('a')).alignSelf('center').zIndex('floating')),
    bloom: () => (
      <RN.View style={{ alignSelf: 'center', zIndex: Z_INDEX.floating }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  ...(['-1', '3', '6', '7'] as const).map((level) => ({
    // The levels Mention stacks its video chrome with, and one under its siblings.
    name: `the stacking level ${level}`,
    language: () => toElement(L.VStack(L.Text('a')).zIndex(level)),
    bloom: () => (
      <RN.View style={{ zIndex: Number(level) }}>
        <Text>a</Text>
      </RN.View>
    ),
  })),
  {
    name: 'hidden',
    language: () => toElement(L.VStack(L.Text('a')).hidden()),
    bloom: () => (
      <RN.View style={{ display: 'none' }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'pinned to its parent’s edges',
    language: () =>
      toElement(
        L.VStack(L.VStack(L.Text('a')).position({ top: 'none', trailing: 'sm', bottom: '-xs' })),
      ),
    bloom: () => (
      <RN.View>
        <RN.View style={{ position: 'absolute', top: 0, end: space.sm, bottom: -space.xs }}>
          <Text>a</Text>
        </RN.View>
      </RN.View>
    ),
  },
  {
    name: 'an offset',
    language: () => toElement(L.VStack(L.Text('a')).offset({ x: 'xs', y: '-2xs' })),
    bloom: () => (
      <RN.View style={{ transform: [{ translateX: space.xs }, { translateY: -space._2xs }] }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'full width, half the height at most',
    language: () => toElement(L.VStack(L.Text('a')).frame({ width: 'full', maxHeight: '1/2' })),
    bloom: () => (
      <RN.View style={{ width: '100%', maxHeight: '50%' }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
];

const BOX = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

const overlays: ParityCase[] = [
  {
    name: 'an overlay at the top trailing corner',
    language: () =>
      toElement(L.VStack(L.Text('body')).padding('md').overlay(L.Text('badge'), 'top-trailing')),
    bloom: () => (
      <RN.View
        style={{
          paddingTop: space.md,
          paddingBottom: space.md,
          paddingStart: space.md,
          paddingEnd: space.md,
        }}
      >
        <RN.View>
          <Text>body</Text>
        </RN.View>
        <RN.View
          pointerEvents="box-none"
          style={{ ...BOX, justifyContent: 'flex-start', alignItems: 'flex-end' }}
        >
          <Text>badge</Text>
        </RN.View>
      </RN.View>
    ),
  },
  {
    name: 'a view background, centred',
    language: () => toElement(L.VStack(L.Text('body')).background(L.Text('art'))),
    bloom: () => (
      <RN.View>
        <RN.View
          pointerEvents="box-none"
          style={{ ...BOX, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text>art</Text>
        </RN.View>
        <RN.View>
          <Text>body</Text>
        </RN.View>
      </RN.View>
    ),
  },
];

const elevation: ParityCase[] = [
  ...(['s', 'm', 'floating'] as const).map((role) => ({
    name: `shadow ${role}`,
    language: () => toElement(L.VStack(L.Text('card')).background('surface').shadow(role)),
    bloom: () => (
      <Themed>
        {(colors) => (
          <RN.View
            style={{ backgroundColor: colors.backgroundSecondary, ...bloomShadowStyle(role) }}
          >
            <Text>card</Text>
          </RN.View>
        )}
      </Themed>
    ),
  })),
  {
    name: 'a shadow around a clipped corner',
    language: () => toElement(L.VStack(L.Text('card')).corner('lg').clipped().shadow('m')),
    bloom: () => (
      <RN.View style={{ ...bloomShadowStyle('m'), borderRadius: borderRadius.lg }}>
        <RN.View style={{ borderRadius: borderRadius.lg, overflow: 'hidden' }}>
          <Text>card</Text>
        </RN.View>
      </RN.View>
    ),
  },
  {
    name: 'a ring',
    language: () => toElement(L.VStack(L.Text('a')).ring('primary', 'thick', '2xs')),
    bloom: () => (
      <Themed>
        {(colors) => (
          <RN.View
            style={{
              outlineColor: colors.primary,
              outlineStyle: 'solid',
              outlineWidth: 2,
              outlineOffset: space._2xs,
            }}
          >
            <Text>a</Text>
          </RN.View>
        )}
      </Themed>
    ),
  },
];

/** Web CSS react-native-web passes through, which React Native's style types do not name. */
const webCss = (style: Record<string, string>) => style as RN.ViewStyle;

/** Tailwind's own shadows (theme.css), each a token named by its exact box-shadow. */
const TAILWIND_SHADOWS = [
  '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
] as const;

const small: ParityCase[] = [
  ...TAILWIND_SHADOWS.map((shadow) => ({
    name: `Tailwind's shadow ${shadow.slice(0, 16)}…`,
    language: () => toElement(L.VStack(L.Text('card')).shadow(shadow)),
    bloom: () => (
      <RN.View style={{ boxShadow: shadow }}>
        <Text>card</Text>
      </RN.View>
    ),
  })),
  {
    name: 'Tailwind’s z-50 and a 3px ring',
    language: () => toElement(L.VStack(L.Text('a')).zIndex('50').ring('primary', '3')),
    bloom: () => (
      <Themed>
        {(colors) => (
          <RN.View
            style={{
              outlineColor: colors.primary,
              outlineStyle: 'solid',
              outlineWidth: 3,
              zIndex: 50,
            }}
          >
            <Text>a</Text>
          </RN.View>
        )}
      </Themed>
    ),
  },
  {
    name: 'the top corners rounded',
    language: () => toElement(L.VStack(L.Text('sheet')).corner('3xl', 'top').clipped()),
    bloom: () => (
      <RN.View
        style={{
          borderTopStartRadius: 28,
          borderTopEndRadius: 28,
          overflow: 'hidden',
        }}
      >
        <Text>sheet</Text>
      </RN.View>
    ),
  },
  {
    name: 'two sides rounded apart, in one view',
    language: () =>
      toElement(
        L.VStack(L.Text('a')).corner('lg', 'leading').corner('sm', 'bottom-trailing').clipped(),
      ),
    bloom: () => (
      <RN.View
        style={{
          borderTopStartRadius: borderRadius.lg,
          borderBottomStartRadius: borderRadius.lg,
          borderBottomEndRadius: borderRadius.sm,
          overflow: 'hidden',
        }}
      >
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'a shadow around a corner of the top',
    language: () => toElement(L.VStack(L.Text('a')).corner('lg', 'top').clipped().shadow('s')),
    bloom: () => (
      <RN.View
        style={{
          ...bloomShadowStyle('s'),
          borderTopStartRadius: borderRadius.lg,
          borderTopEndRadius: borderRadius.lg,
        }}
      >
        <RN.View
          style={{
            borderTopStartRadius: borderRadius.lg,
            borderTopEndRadius: borderRadius.lg,
            overflow: 'hidden',
          }}
        >
          <Text>a</Text>
        </RN.View>
      </RN.View>
    ),
  },
  {
    name: 'a basis, a scale, no hit testing',
    language: () =>
      toElement(L.VStack(L.Text('a')).basis('none').scale('105').allowsHitTesting(false)),
    // react-native-web drops an inline pointerEvents: an app's web view takes it as the prop's class.
    bloom: () =>
      RN.Platform.OS === 'web' ? (
        <RN.View pointerEvents="none" style={{ flexBasis: 0, transform: [{ scale: 1.05 }] }}>
          <Text>a</Text>
        </RN.View>
      ) : (
        <RN.View style={{ flexBasis: 0, transform: [{ scale: 1.05 }], pointerEvents: 'none' }}>
          <Text>a</Text>
        </RN.View>
      ),
  },
  {
    name: 'an offset, then a scale',
    language: () => toElement(L.VStack(L.Text('a')).offset({ y: '-xs' }).scale('pressed')),
    bloom: () => (
      <RN.View style={{ transform: [{ translateY: -space.xs }, { scale: 0.98 }] }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'a scale about the top-leading corner (origin-top-left)',
    language: () => toElement(L.VStack(L.Text('a')).scale('105').anchor('top-leading')),
    bloom: () => (
      <RN.View style={{ transform: [{ scale: 1.05 }], transformOrigin: 'top left' }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'hit testing again, a basis of the parent',
    language: () => toElement(L.VStack(L.Text('a')).basis('1/2').allowsHitTesting(true)),
    bloom: () =>
      RN.Platform.OS === 'web' ? (
        <RN.View pointerEvents="auto" style={{ flexBasis: '50%' }}>
          <Text>a</Text>
        </RN.View>
      ) : (
        <RN.View style={{ flexBasis: '50%', pointerEvents: 'auto' }}>
          <Text>a</Text>
        </RN.View>
      ),
  },
  ...(
    [
      ['children', 'box-none'],
      ['self', 'box-only'],
    ] as const
  ).map(([value, pointerEvents]) => ({
    name: `hit testing of ${value === 'children' ? 'what is inside only' : 'the view only'}, a padding, a fill`,
    language: () =>
      toElement(L.VStack(L.Text('a')).padding('sm').background('surface').allowsHitTesting(value)),
    bloom: () => (
      <Themed>
        {(c) =>
          RN.Platform.OS === 'web' ? (
            <RN.View
              pointerEvents={pointerEvents}
              style={{ padding: 8, backgroundColor: 'var(--surface)' }}
            >
              <Text>a</Text>
            </RN.View>
          ) : (
            <RN.View
              style={{
                paddingTop: 8,
                paddingBottom: 8,
                paddingStart: 8,
                paddingEnd: 8,
                backgroundColor: c.backgroundSecondary,
                pointerEvents,
              }}
            >
              <Text>a</Text>
            </RN.View>
          )
        }
      </Themed>
    ),
  })),
  {
    name: 'a frame as wide as its content',
    language: () => toElement(L.HStack(L.Text('chip')).frame({ width: 'fit' })),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row', width: 'fit-content' }}>
        <Text>chip</Text>
      </RN.View>
    ),
  },
  ...ENUMS.listMarker.map((marker) => ({
    name: `a web list, ${marker}`,
    language: () =>
      toElement(L.VStack(L.Text('one'), L.Text('two')).listMarker(marker).padding('leading', 'xl')),
    // Tailwind's list-disc is web CSS on a list and its items; native draws no marker.
    bloom: () =>
      RN.Platform.OS === 'web' ? (
        <RN.View
          role="list"
          style={[webCss({ listStyleType: marker }), { paddingStart: space.xl }]}
        >
          <RN.View role="listitem" style={webCss({ display: 'list-item' })}>
            <Text>one</Text>
          </RN.View>
          <RN.View role="listitem" style={webCss({ display: 'list-item' })}>
            <Text>two</Text>
          </RN.View>
        </RN.View>
      ) : (
        <RN.View style={{ paddingStart: space.xl }}>
          <Text>one</Text>
          <Text>two</Text>
        </RN.View>
      ),
  })),
];

const shapes: ParityCase[] = [
  {
    name: 'a filled silhouette',
    language: () => toElement(L.Shape('heart').size('4xl').fill('primary')),
    bloom: () => (
      <Themed>{(colors) => <Fill shape="heart" size={space._4xl} color={colors.primary} />}</Themed>
    ),
  },
  {
    name: 'a silhouette in the foreground, by default',
    language: () => toElement(L.Shape('4-sided-cookie').size('3xl')),
    bloom: () => (
      <Themed>
        {(colors) => <Fill shape="4-sided-cookie" size={space._3xl} color={colors.text} />}
      </Themed>
    ),
  },
  {
    name: 'a stroked silhouette',
    language: () => toElement(L.Shape('squircle').size('4xl').stroke('border', 'thick')),
    bloom: () => (
      <Themed>
        {(colors) => <Border shape="squircle" size={space._4xl} width={2} colors={colors.border} />}
      </Themed>
    ),
  },
  {
    name: 'an image in a silhouette',
    language: () =>
      toElement(L.Shape('flower').size('5xl').image({ uri: 'https://example.com/a.png' }, 'Ana')),
    bloom: () => (
      <Image
        shape="flower"
        size={space._5xl}
        source={{ uri: 'https://example.com/a.png' }}
        alt="Ana"
      />
    ),
  },
];

/**
 * A ZStack as React Native writes one by hand: each child in a slot of the
 * stack's width that reports its height (`onLayout`), the slots sharing one
 * line (each one's margins take back its height, `above` of it above the
 * line), and the box as tall as the tallest slot.
 */
function HandZStack({
  children,
  justify,
  across,
  above,
}: {
  children: ReactNode[];
  justify: 'flex-start' | 'center' | 'flex-end';
  across: 'flex-start' | 'center' | 'flex-end';
  above: number;
}) {
  const [heights, setHeights] = useState<number[]>([]);
  const tallest = Math.max(0, ...heights.filter((height) => height !== undefined));
  const box = { flexGrow: 1, justifyContent: justify };
  const slot = { position: 'static' as const, alignItems: across };
  return (
    <RN.View style={{ position: 'relative' }}>
      <RN.View pointerEvents="box-none" style={tallest > 0 ? [box, { minHeight: tallest }] : box}>
        {children.map((child, i) => {
          const height = heights[i] ?? 0;
          const top = height * above;
          return (
            <RN.View
              // biome-ignore lint/suspicious/noArrayIndexKey: a stack's children are its slots, in order
              key={i}
              pointerEvents="box-none"
              onLayout={(event) => {
                const next = event.nativeEvent.layout.height;
                setHeights((last) => {
                  if (last[i] === next) return last;
                  const out = [...last];
                  out[i] = next;
                  return out;
                });
              }}
              style={
                height === 0 ? slot : [slot, { marginTop: 0 - top, marginBottom: top - height }]
              }
            >
              {child}
            </RN.View>
          );
        })}
      </RN.View>
    </RN.View>
  );
}

const depth: ParityCase[] = [
  {
    name: 'a ZStack at its bottom trailing corner: as big as its largest child',
    language: () =>
      toElement(
        L.ZStack(L.VStack().frame({ width: '5xl', height: '5xl' }), L.Text('over')).alignment(
          'bottom-trailing',
        ),
      ),
    bloom: () => (
      <HandZStack justify="flex-end" across="flex-end" above={1}>
        {[
          <RN.View key="square" style={{ width: space._5xl, height: space._5xl }} />,
          <Text key="text">over</Text>,
        ]}
      </HandZStack>
    ),
  },
  {
    name: 'a ZStack, centred: the widest and the tallest child size it',
    language: () =>
      toElement(
        L.ZStack(L.VStack().frame({ width: 'xl', height: '5xl' }), L.Text('wide text over')),
      ),
    bloom: () => (
      <HandZStack justify="center" across="center" above={0.5}>
        {[
          <RN.View key="tall" style={{ width: space.xl, height: space._5xl }} />,
          <Text key="text">wide text over</Text>,
        ]}
      </HandZStack>
    ),
  },
];

/** Tailwind's own values, as NativeWind writes them on each platform. */
const INFINITE = RN.Platform.OS === 'web' ? 'calc(infinity * 1px)' : 9007199254740000;
/**
 * Tailwind's own `space-y-2` rule (its spacing at 8px), in the document, and the
 * class NativeWind's web runtime hands react-native-web for it.
 */
const SPACE_Y_2 =
  ':where(.space-y-2 > :not(:last-child)){--tw-space-y-reverse:0;margin-block-start:calc(8px * var(--tw-space-y-reverse));margin-block-end:calc(8px * calc(1 - var(--tw-space-y-reverse)));}';
function tailwindClass(name: string, rule: string): RN.ViewStyle {
  if (typeof document !== 'undefined' && !document.getElementById(`tw-${name}`)) {
    const style = document.createElement('style');
    style.id = `tw-${name}`;
    style.textContent = rule;
    document.head.appendChild(style);
  }
  return { $$css: true, [name]: name } as unknown as RN.ViewStyle;
}
const tailwind: ParityCase[] = [
  {
    name: 'z-auto: the web’s z-index auto, nothing on native',
    language: () => toElement(L.VStack(L.Text('a')).zIndex('auto')),
    bloom: () => (
      <RN.View
        style={RN.Platform.OS === 'web' ? { zIndex: 'auto' as unknown as number } : undefined}
      >
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'physical corners (rounded-l, rounded-br)',
    language: () =>
      toElement(L.VStack(L.Text('a')).corner('lg', 'left').corner('sm', 'bottom-right')),
    bloom: () => (
      <RN.View
        style={{
          borderTopLeftRadius: borderRadius.lg,
          borderBottomLeftRadius: borderRadius.lg,
          borderBottomRightRadius: borderRadius.sm,
        }}
      >
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'children spaced as Tailwind’s space-y (nothing on native, as NativeWind)',
    language: () => toElement(L.VStack(L.Text('a'), L.Text('b')).childSpacing('vertical', 'sm')),
    bloom: () => (
      <RN.View style={RN.Platform.OS === 'web' ? tailwindClass('space-y-2', SPACE_Y_2) : undefined}>
        <Text>a</Text>
        <Text>b</Text>
      </RN.View>
    ),
  },
  {
    name: 'an infinite corner (rounded-full)',
    language: () => toElement(L.VStack(L.Text('a')).corner('infinite').clipped()),
    bloom: () => (
      <RN.View style={{ borderRadius: INFINITE as number, overflow: 'hidden' }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'an infinite corner on one side',
    language: () => toElement(L.VStack(L.Text('a')).corner('infinite', 'top')),
    bloom: () => (
      <RN.View
        style={{
          borderTopStartRadius: INFINITE as number,
          borderTopEndRadius: INFINITE as number,
        }}
      >
        <Text>a</Text>
      </RN.View>
    ),
  },
];

/** `.role()`: React Native's accessibilityRole of the same name, on the view's host. */
const roles: ParityCase[] = ENUMS.role.map((role) => ({
  name: `role ${role}`,
  language: () => toElement(L.VStack(L.Text('a')).role(role)),
  bloom: () => (
    <RN.View accessibilityRole={role}>
      <Text>a</Text>
    </RN.View>
  ),
}));

/** What Mention's screens write that the language lacked: auto margins, a gap per axis, a border's line. */
const appLayout: ParityCase[] = [
  {
    name: 'an auto leading margin pushes a view to the trailing end (ms-auto)',
    language: () =>
      toElement(L.HStack(L.Text('a'), L.VStack(L.Text('b')).margin('leading', 'auto'))),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row' }}>
        <Text>a</Text>
        <RN.View style={{ marginStart: 'auto' }}>
          <Text>b</Text>
        </RN.View>
      </RN.View>
    ),
  },
  {
    name: 'a physical auto margin on the left (marginLeft: auto)',
    language: () => toElement(L.HStack(L.Text('a'), L.VStack(L.Text('b')).margin('left', 'auto'))),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row' }}>
        <Text>a</Text>
        <RN.View style={{ marginLeft: 'auto' }}>
          <Text>b</Text>
        </RN.View>
      </RN.View>
    ),
  },
  {
    name: 'auto margins all round centre a view',
    language: () => toElement(L.VStack(L.VStack(L.Text('a')).margin('auto'))),
    bloom: () => (
      <RN.View>
        <RN.View
          style={{
            marginTop: 'auto',
            marginBottom: 'auto',
            marginStart: 'auto',
            marginEnd: 'auto',
          }}
        >
          <Text>a</Text>
        </RN.View>
      </RN.View>
    ),
  },
  {
    name: 'a gap per axis on a wrapping row (columnGap, rowGap)',
    language: () =>
      toElement(
        L.HStack(L.Text('a'), L.Text('b'), L.Text('c'))
          .wrap()
          .horizontalSpacing('lg')
          .verticalSpacing('xs'),
      ),
    bloom: () => (
      <RN.View
        style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg, rowGap: space.xs }}
      >
        <Text>a</Text>
        <Text>b</Text>
        <Text>c</Text>
      </RN.View>
    ),
  },
  {
    name: 'a column with a numeric vertical gap',
    language: () => toElement(L.VStack(L.Text('a'), L.Text('b')).verticalSpacing('6')),
    bloom: () => (
      <RN.View style={{ rowGap: 6 }}>
        <Text>a</Text>
        <Text>b</Text>
      </RN.View>
    ),
  },
  ...(['dashed', 'dotted'] as const).map((line) => ({
    name: `a ${line} border`,
    language: () =>
      toElement(L.VStack(L.Text('a')).border('border', 'thin').borderStyle(line).corner('md')),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View
            style={{
              borderWidth: 1,
              borderColor: c.border,
              borderStyle: line,
              borderRadius: borderRadius.md,
            }}
          >
            <Text>a</Text>
          </RN.View>
        )}
      </Themed>
    ),
  })),
];

/** Hidden from screen readers: each platform's own props (react-native-web drops the native ones). */
const HIDDEN =
  RN.Platform.OS === 'web'
    ? ({ 'aria-hidden': true } as const)
    : ({
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants',
      } as const);

/** State, live regions and hiding, as an app writes them on React Native's views. */
const accessibility: ParityCase[] = [
  {
    name: 'an accessibility value as a range',
    language: () =>
      toElement(
        L.VStack(L.Text('a'))
          .role('progressbar')
          .accessibilityValue({ min: 0, max: 100, now: 40 }),
      ),
    bloom: () => (
      <RN.View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: 40 }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'an accessibility value as a text',
    language: () => toElement(L.VStack(L.Text('a')).accessibilityValue({ text: 'Verifying' })),
    bloom: () => (
      <RN.View accessibilityValue={{ text: 'Verifying' }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'an accessibility state (selected, busy)',
    language: () =>
      toElement(L.VStack(L.Text('a')).accessibilityState({ selected: true, busy: false })),
    bloom: () => (
      <RN.View accessibilityState={{ selected: true, busy: false }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'a mixed checked state',
    language: () => toElement(L.HStack(L.Text('a')).accessibilityState({ checked: 'mixed' })),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row' }} accessibilityState={{ checked: 'mixed' }}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'a polite live region',
    language: () => toElement(L.VStack(L.Text('a')).liveRegion('polite')),
    bloom: () => (
      <RN.View accessibilityLiveRegion="polite">
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'hidden from screen readers, with what is inside',
    language: () => toElement(L.VStack(L.Text('a')).accessibilityHidden()),
    bloom: () => (
      <RN.View {...HIDDEN}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'read again (accessibilityHidden(false))',
    language: () => toElement(L.VStack(L.Text('a')).accessibilityHidden(false)),
    bloom: () =>
      RN.Platform.OS === 'web' ? (
        <RN.View>
          <Text>a</Text>
        </RN.View>
      ) : (
        <RN.View accessibilityElementsHidden={false} importantForAccessibility="auto">
          <Text>a</Text>
        </RN.View>
      ),
  },
];

/** `.pressFade()`: React Native's TouchableOpacity is the press host, so its fade is its own. */
const pressFade: ParityCase[] = [
  {
    name: 'a row whose press fades it to 70% (TouchableOpacity)',
    language: () => toElement(L.HStack(L.Text('a')).padding('md').onPress(hold).pressFade('70')),
    bloom: () => (
      <RN.TouchableOpacity
        onPress={hold}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          paddingTop: space.md,
          paddingBottom: space.md,
          paddingStart: space.md,
          paddingEnd: space.md,
        }}
      >
        <Text>a</Text>
      </RN.TouchableOpacity>
    ),
  },
  {
    name: 'a press fade at TouchableOpacity’s own opacity, labelled as a button',
    language: () =>
      toElement(L.VStack(L.Text('a')).onPress(hold).pressFade().role('button').label('Open')),
    bloom: () => (
      <RN.TouchableOpacity onPress={hold} accessibilityRole="button" accessibilityLabel="Open">
        <Text>a</Text>
      </RN.TouchableOpacity>
    ),
  },
  {
    // TouchableOpacity's own focus: none on Android and iOS without a press, focusable on the web.
    name: 'a press fade whose press is absent keeps TouchableOpacity’s focus',
    language: () => toElement(L.VStack(L.Text('a')).onPress(undefined).pressFade()),
    bloom: () => (
      <RN.TouchableOpacity onPress={undefined}>
        <Text>a</Text>
      </RN.TouchableOpacity>
    ),
  },
  {
    name: 'a faded, selected row on a fill',
    language: () =>
      toElement(
        L.HStack(L.Text('a'))
          .background('surface')
          .corner('md')
          .onPress(hold)
          .pressFade('85')
          .accessibilityState({ selected: true }),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.TouchableOpacity
            onPress={hold}
            activeOpacity={0.85}
            accessibilityState={{ selected: true }}
            style={{
              flexDirection: 'row',
              backgroundColor: c.backgroundSecondary,
              borderRadius: borderRadius.md,
            }}
          >
            <Text>a</Text>
          </RN.TouchableOpacity>
        )}
      </Themed>
    ),
  },
];

/** `.aspectRatio()` on any view: React Native's `aspectRatio`, in its frame's view. */
const aspectRatio: ParityCase[] = [
  {
    // Mention's emoji cell: a square that fades when pressed.
    name: 'a square cell a quarter wide that fades when pressed',
    language: () =>
      toElement(
        L.VStack(L.Text('a'))
          .frame({ width: '1/4' })
          .aspectRatio(1)
          .align('center')
          .justify('center')
          .onPress(hold)
          .pressFade(),
      ),
    bloom: () => (
      <RN.TouchableOpacity
        onPress={hold}
        style={{ width: '25%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text>a</Text>
      </RN.TouchableOpacity>
    ),
  },
  {
    name: 'a padded landscape box',
    language: () => toElement(L.VStack().padding('md').frame({ width: 'full' }).aspectRatio(1.6)),
    bloom: () => (
      <RN.View
        style={{
          paddingTop: space.md,
          paddingBottom: space.md,
          paddingStart: space.md,
          paddingEnd: space.md,
          width: '100%',
          aspectRatio: 1.6,
        }}
      />
    ),
  },
];

/** The insets of a phone with a notch and a home bar. */
const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };
const withInsets = (element: ReactElement) => (
  <SafeAreaInsetsContext.Provider value={INSETS}>{element}</SafeAreaInsetsContext.Provider>
);

/** `.safeAreaPadding()`: a view padded by the device's insets, as an app pads by `useSafeAreaInsets()`. */
const safeArea: ParityCase[] = [
  {
    name: 'a column padded by the safe area top and bottom',
    language: () => withInsets(toElement(L.VStack(L.Text('a')).safeAreaPadding('vertical'))),
    bloom: () =>
      withInsets(
        <RN.View style={{ paddingTop: INSETS.top, paddingBottom: INSETS.bottom }}>
          <RN.View>
            <Text>a</Text>
          </RN.View>
        </RN.View>,
      ),
  },
  {
    // Mention's sign-in: the inset, then 24 more, on a card fill.
    name: 'a safe-area top, a padding beyond it, on a fill',
    language: () =>
      withInsets(
        toElement(
          L.VStack(L.Text('a'))
            .safeAreaPadding('top')
            .padding('top', '2xl')
            .background('card'),
        ),
      ),
    bloom: () =>
      withInsets(
        <Themed>
          {(c) => (
            <RN.View style={{ paddingTop: 24, backgroundColor: c.card }}>
              <RN.View style={{ paddingTop: INSETS.top }}>
                <RN.View>
                  <Text>a</Text>
                </RN.View>
              </RN.View>
            </RN.View>
          )}
        </Themed>,
      ),
  },
];

/** `.hitSlop()`: one slop on every side, or each side's (React Native's insets). */
const hitSlop: ParityCase[] = [
  {
    name: 'a press that reaches a slop beyond every side',
    language: () => toElement(L.VStack(L.Text('a')).onPress(hold).hitSlop('md')),
    bloom: () => (
      <RN.Pressable onPress={hold} hitSlop={8}>
        <Text>a</Text>
      </RN.Pressable>
    ),
  },
  {
    // Mention's video scrubber: taller to the finger, not wider.
    name: 'a press that reaches beyond its top and bottom only',
    language: () => toElement(L.VStack(L.Text('a')).onPress(hold).hitSlop('vertical', 'md')),
    bloom: () => (
      <RN.Pressable onPress={hold} hitSlop={{ top: 8, bottom: 8 }}>
        <Text>a</Text>
      </RN.Pressable>
    ),
  },
  {
    // Mention's upvote: five points up, down and to the left, none to the right.
    name: 'a press whose sides reach their own slops',
    language: () =>
      toElement(
        L.VStack(L.Text('a'))
          .onPress(hold)
          .hitSlop('5')
          .hitSlop('right', 'none'),
      ),
    bloom: () => (
      <RN.Pressable onPress={hold} hitSlop={{ top: 5, bottom: 5, left: 5, right: 0 }}>
        <Text>a</Text>
      </RN.Pressable>
    ),
  },
];

export const LAYOUT_CASES: ParityCase[] = [
  ...hitSlop,
  ...safeArea,
  ...aspectRatio,
  ...pressFade,
  ...accessibility,
  ...appLayout,
  ...roles,
  ...tailwind,
  ...distribution,
  ...placement,
  ...overlays,
  ...depth,
  ...elevation,
  ...small,
  ...shapes,
];
