import * as RN from 'react-native';
import { type ReactNode, useState } from 'react';
import { AspectRatio } from '@oxy.so/bloom/aspect-ratio';
import { BlurIsland } from '@oxy.so/bloom/blur';
import { ConcentricView } from '@oxy.so/bloom/concentric';
import { Divider } from '@oxy.so/bloom/divider';
import { Fill } from '@oxy.so/bloom/fill';
import { ResponsiveGrid } from '@oxy.so/bloom/grid';
import { useWindowBreakpoint } from '@oxy.so/bloom/hooks';
import { RiHeart3Line } from '@oxy.so/bloom/icons';
import { surfaceStyle } from '@oxy.so/bloom/shapes';
import { tokens } from '@oxy.so/bloom/styles';
import { Surface } from '@oxy.so/bloom/surface';
import { withAlpha } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

import { GLASS_OPACITY } from '../src/generated/spec.generated';
import { clear, regular } from '../src/glass';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { defineTokens } from '../src/tokens';
import { type ParityCase, Themed } from './support/cases';

const { space, borderRadius } = tokens;
const TIERS = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Bloom JSX that reads the window's tier as an app does (`useWindowBreakpoint()`). */
function Tiered({ children }: { children: (atLeast: (tier: string) => boolean) => ReactNode }) {
  const tier = useWindowBreakpoint();
  return children((at) => TIERS.indexOf(tier) >= TIERS.indexOf(at));
}

const padding = (value: number) => ({
  paddingTop: value,
  paddingBottom: value,
  paddingStart: value,
  paddingEnd: value,
});

const onPress = () => {};

interface Held {
  pressed: boolean;
  hovered: boolean;
}

/** Bloom JSX that tracks a pressable's press and hover as an app does, to draw by them. */
function Tracked({
  children,
}: {
  children: (held: Held, handlers: Record<string, () => void>) => ReactNode;
}) {
  const [held, setHeld] = useState<Held>({ pressed: false, hovered: false });
  const set = (key: keyof Held, on: boolean) => () =>
    setHeld((current) => (current[key] === on ? current : { ...current, [key]: on }));
  return children(held, {
    onPressIn: set('pressed', true),
    onPressOut: set('pressed', false),
    onHoverIn: set('hovered', true),
    onHoverOut: set('hovered', false),
  });
}

const surface: ParityCase[] = [
  {
    name: 'glass is Bloom’s Surface',
    language: () => toElement(L.VStack(L.Text('Glass')).glass()),
    bloom: () => (
      <Surface>
        <RN.View>
          <Text>Glass</Text>
        </RN.View>
      </Surface>
    ),
  },
  {
    name: 'glass with a corner and padding',
    language: () => toElement(L.VStack(L.Text('Glass')).padding('md').glass().corner('xl')),
    bloom: () => (
      <Surface radius={borderRadius.xl} style={padding(space.md)}>
        <RN.View>
          <Text>Glass</Text>
        </RN.View>
      </Surface>
    ),
  },
  {
    name: 'a glass whose padding varies: the padding is a view just inside it',
    language: () =>
      toElement(
        L.VStack(L.Text('Glass'))
          .padding('sm')
          .glass()
          .corner('xl')
          .when('lg', (v) => v.padding('md')),
      ),
    bloom: () => (
      <Tiered>
        {(atLeast) => (
          <Surface radius={borderRadius.xl}>
            <RN.View style={padding(atLeast('lg') ? space.md : space.sm)}>
              <RN.View>
                <Text>Glass</Text>
              </RN.View>
            </RN.View>
          </Surface>
        )}
      </Tiered>
    ),
  },
  {
    name: 'a glass whose frame, border, corner and fill vary: its own style, radius and fill',
    language: () =>
      toElement(
        L.VStack(L.Text('Glass'))
          .padding('sm')
          .glass()
          .corner('xl')
          .when('lg', (v) =>
            v
              .frame({ width: '96' })
              .border('border', 'thin')
              .corner('2xl')
              .background('primary/40'),
          ),
      ),
    bloom: () => (
      <Tiered>
        {(atLeast) => (
          <Themed>
            {(c) => (
              <Surface
                radius={atLeast('lg') ? borderRadius._2xl : borderRadius.xl}
                fill={atLeast('lg') ? withAlpha(c.primary, 0.4) : undefined}
                style={{
                  ...padding(space.sm),
                  ...(atLeast('lg') ? { width: 96, borderWidth: 1, borderColor: c.border } : null),
                }}
              >
                <RN.View>
                  <Text>Glass</Text>
                </RN.View>
              </Surface>
            )}
          </Themed>
        )}
      </Tiered>
    ),
  },
  {
    name: 'a pressable glass whose fill a press and corner a hover vary',
    language: () =>
      toElement(
        L.HStack(L.Text('Glass'))
          .padding('sm')
          .onPress(onPress)
          .glass(regular.tint('primary', 'subtle'))
          .when('pressed', (v) => v.background('primary'))
          .when('hovered', (v) => v.corner('2xl')),
      ),
    // The box around the glass tracks the press and hover its material's variants answer.
    bloom: () => (
      <Themed>
        {(c) => (
          <Tracked>
            {(held, handlers) => (
              <RN.Pressable onPress={onPress} {...handlers}>
                <Surface
                  fill={held.pressed ? c.primary : withAlpha(c.primary, GLASS_OPACITY.subtle)}
                  radius={held.hovered ? borderRadius._2xl : undefined}
                  style={padding(space.sm)}
                >
                  <RN.View style={{ flexDirection: 'row' }}>
                    <Text>Glass</Text>
                  </RN.View>
                </Surface>
              </RN.Pressable>
            )}
          </Tracked>
        )}
      </Themed>
    ),
  },
  {
    name: 'clear glass',
    language: () => toElement(L.VStack().glass(clear)),
    bloom: () => (
      <Themed>
        {(c) => (
          <Surface sheen={false} fill={withAlpha(c.backgroundSecondary, GLASS_OPACITY.subtle)}>
            <RN.View />
          </Surface>
        )}
      </Themed>
    ),
  },
  {
    name: 'tinted glass',
    language: () => toElement(L.VStack().glass(regular.tint('primary'))),
    bloom: () => (
      <Themed>
        {(c) => (
          <Surface fill={c.primary}>
            <RN.View />
          </Surface>
        )}
      </Themed>
    ),
  },
  {
    name: 'clear glass tinted at medium',
    language: () => toElement(L.VStack().glass(clear.tint('error', 'medium'))),
    bloom: () => (
      <Themed>
        {(c) => (
          <Surface sheen={false} fill={withAlpha(c.error, GLASS_OPACITY.medium)}>
            <RN.View />
          </Surface>
        )}
      </Themed>
    ),
  },
  {
    name: 'smooth corners on glass',
    language: () => toElement(L.VStack().glass().corner('lg').cornerCurve('smooth')),
    bloom: () => (
      <Surface radius={borderRadius.lg} cornerCurve="smooth">
        <RN.View />
      </Surface>
    ),
  },
  {
    name: 'smooth corners on a box',
    language: () => toElement(L.VStack().background('surface').corner('lg').cornerCurve('smooth')),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View
            style={[
              {
                backgroundColor: c.backgroundSecondary,
                borderRadius: borderRadius.lg,
                overflow: 'hidden',
              },
              surfaceStyle({ curve: 'smooth' }),
            ]}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'a concentric glass in a glass',
    language: () =>
      toElement(
        L.VStack(L.VStack(L.Text('Inner')).padding('sm').glass().corner('concentric'))
          .padding('sm')
          .glass()
          .corner('2xl'),
      ),
    bloom: () => (
      <Surface radius={borderRadius._2xl} style={padding(space.sm)}>
        <RN.View>
          <Surface radius="concentric" style={padding(space.sm)}>
            <RN.View>
              <Text>Inner</Text>
            </RN.View>
          </Surface>
        </RN.View>
      </Surface>
    ),
  },
  {
    name: 'a concentric box in a glass',
    language: () =>
      toElement(
        L.VStack(L.VStack(L.Text('Inner')).background('popover').corner('concentric'))
          .padding('md')
          .glass()
          .corner('xl'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <Surface radius={borderRadius.xl} style={padding(space.md)}>
            <RN.View>
              <ConcentricView
                radius="concentric"
                style={{ backgroundColor: c.backgroundTertiary, overflow: 'hidden' }}
              >
                <RN.View>
                  <Text>Inner</Text>
                </RN.View>
              </ConcentricView>
            </RN.View>
          </Surface>
        )}
      </Themed>
    ),
  },
];

const dividers: ParityCase[] = [
  { name: 'Divider', language: () => toElement(L.Divider()), bloom: () => <Divider /> },
  ...(['single', 'double', 'fill'] as const).flatMap((style) => [
    {
      name: `Divider ${style}`,
      language: () => toElement(L.Divider().lineStyle(style)),
      bloom: () => <Divider variant={style} />,
    },
    {
      name: `Divider ${style}, labelled`,
      language: () => toElement(L.Divider(L.Text('or')).lineStyle(style)),
      bloom: () => <Divider variant={style}>or</Divider>,
    },
  ]),
  ...(['start', 'center', 'end'] as const).map((align) => ({
    name: `Divider label at ${align}`,
    language: () => toElement(L.Divider(L.Text('Today')).align(align)),
    bloom: () => <Divider align={align}>Today</Divider>,
  })),
  {
    name: 'Divider with a view for its label',
    language: () => toElement(L.Divider(L.Icon(RiHeart3Line).size('sm'))),
    bloom: () => (
      <Themed>
        {(c) => (
          <Divider>
            <RiHeart3Line size="sm" fill={c.text} />
          </Divider>
        )}
      </Themed>
    ),
  },
  {
    name: 'Divider tinted, spaced',
    language: () => toElement(L.Divider().tint('primary').spacing('lg')),
    bloom: () => <Themed>{(c) => <Divider color={c.primary} spacing={space.lg} />}</Themed>,
  },
  {
    name: 'Divider in an HStack is vertical',
    language: () => toElement(L.HStack(L.Text('a'), L.Divider().spacing('sm'), L.Text('b'))),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row' }}>
        <Text>a</Text>
        <Divider vertical spacing={space.sm} />
        <Text>b</Text>
      </RN.View>
    ),
  },
  {
    name: 'Divider in a VStack inside an HStack is horizontal',
    language: () => toElement(L.HStack(L.VStack(L.Divider()))),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row' }}>
        <RN.View>
          <Divider />
        </RN.View>
      </RN.View>
    ),
  },
];

const grid = defineTokens({ space: { card: 160 } });

const boxes: ParityCase[] = [
  {
    name: 'Fill',
    language: () => toElement(L.VStack(L.Fill(L.Text('Over')))),
    bloom: () => (
      <RN.View>
        <Fill>
          <Text>Over</Text>
        </Fill>
      </RN.View>
    ),
  },
  {
    name: 'Fill with a scrim',
    language: () => toElement(L.Fill().background('background').opacity('half')),
    bloom: () => (
      <Themed>
        {(c) => (
          <Fill style={{ backgroundColor: c.background, opacity: tokens.DISABLED_OPACITY }} />
        )}
      </Themed>
    ),
  },
  {
    name: 'AspectRatio 16:9',
    language: () => toElement(L.AspectRatio(16 / 9, L.Text('Media'))),
    bloom: () => (
      <AspectRatio ratio={16 / 9}>
        <Text>Media</Text>
      </AspectRatio>
    ),
  },
  {
    name: 'AspectRatio that is not a ratio yet',
    language: () => toElement(L.AspectRatio(0 / 0)),
    bloom: () => <AspectRatio ratio={0 / 0} />,
  },
  {
    name: 'AspectRatio, rounded',
    language: () => toElement(L.AspectRatio(1).corner('lg').testID('well')),
    bloom: () => (
      <AspectRatio
        ratio={1}
        testID="well"
        style={{ borderRadius: borderRadius.lg, overflow: 'hidden' }}
      />
    ),
  },
  {
    name: 'Grid',
    language: () => toElement(L.Grid(L.Text('One'), L.Text('Two'))),
    bloom: () => (
      <ResponsiveGrid>
        <Text>One</Text>
        <Text>Two</Text>
      </ResponsiveGrid>
    ),
  },
  {
    name: 'Grid of three columns, columns flow',
    language: () =>
      toElement(
        L.Grid(L.Text('One'), L.Text('Two'), L.Text('Three'))
          .columns(3)
          .spacing('md')
          .minCellWidth(grid.space.card)
          .flow('columns'),
      ),
    bloom: () => (
      <ResponsiveGrid maxColumns={3} gap={space.md} minItemWidth={160} flow="columns">
        <Text>One</Text>
        <Text>Two</Text>
        <Text>Three</Text>
      </ResponsiveGrid>
    ),
  },
];

const named: ParityCase[] = [
  {
    // The exact values apps write in two or more places: Tailwind's border-4, z-[60], opacity-45.
    name: 'a 4px border, a 60 stacking level, 45% opaque',
    language: () => toElement(L.VStack().border('border', '4').zIndex('60').opacity('45')),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View style={{ borderWidth: 4, borderColor: c.border, opacity: 0.45, zIndex: 60 }} />
        )}
      </Themed>
    ),
  },
  {
    name: 'a 70% opaque, thick-bordered box',
    language: () => toElement(L.VStack().border('border', 'thick').opacity('70')),
    bloom: () => (
      <Themed>
        {(c) => <RN.View style={{ borderWidth: 2, borderColor: c.border, opacity: 0.7 }} />}
      </Themed>
    ),
  },
  {
    name: 'an 80% opaque box',
    language: () => toElement(L.VStack().opacity('80')),
    bloom: () => <RN.View style={{ opacity: 0.8 }} />,
  },
  // Numeric tokens: exact values carried over from apps (Tailwind's scale and arbitrary values).
  ...(
    [
      ['1', 1],
      ['6', 6],
      ['10', 10],
      ['14', 14],
      ['28', 28],
      ['36', 36],
      ['44', 44],
      ['48', 48],
      ['56', 56],
      ['64', 64],
      ['96', 96],
      ['160', 160],
      ['1200', 1200],
    ] as const
  ).flatMap(([rung, value]) => [
    {
      name: `padding and spacing ${rung}`,
      language: () => toElement(L.HStack(L.Spacer(), L.Spacer()).spacing(rung).padding(rung)),
      bloom: () => (
        <RN.View style={{ flexDirection: 'row', gap: value, ...padding(value) }}>
          <RN.View style={{ flex: 1 }} />
          <RN.View style={{ flex: 1 }} />
        </RN.View>
      ),
    },
    {
      name: `pulled out by ${rung}, a frame of ${rung}`,
      language: () =>
        toElement(L.VStack().padding('top', `-${rung}`).frame({ width: rung, height: rung })),
      bloom: () => <RN.View style={{ width: value, height: value, marginTop: -value }} />,
    },
  ]),
  // A fill and a border at a named opacity (`bg-primary/10`, `border-border/60`).
  {
    name: 'a fill and a border at a named opacity',
    language: () => toElement(L.VStack().background('primary/10').border('border/60', 'thin')),
    bloom: () => (
      <Themed>
        {(c) => (
          <RN.View
            style={
              RN.Platform.OS === 'web'
                ? {
                    backgroundColor: 'color-mix(in oklab, var(--primary) 10%, transparent)',
                    borderWidth: 1,
                    borderColor: 'color-mix(in oklab, var(--border) 60%, transparent)',
                  }
                : {
                    backgroundColor: withAlpha(c.primary, 0.1),
                    borderWidth: 1,
                    borderColor: withAlpha(c.border, 0.6),
                  }
            }
          />
        )}
      </Themed>
    ),
  },
  ...(
    [
      ['20', 0.2],
      ['40', 0.4],
      ['60', 0.6],
      ['90', 0.9],
    ] as const
  ).map(([name, value]) => ({
    name: `opacity ${name}`,
    language: () => toElement(L.VStack().opacity(name)),
    bloom: () => <RN.View style={{ opacity: value }} />,
  })),
  ...(
    [
      ['6', 6],
      ['10', 10],
      ['14', 14],
      ['18', 18],
      ['22', 22],
    ] as const
  ).map(([rung, value]) => ({
    name: `corner ${rung}`,
    language: () => toElement(L.VStack().corner(rung)),
    bloom: () => <RN.View style={{ borderRadius: value, overflow: 'hidden' }} />,
  })),
];

/** `.blur()`: Bloom's floating island, a capsule unless a corner names its radius. */
const islands: ParityCase[] = [
  {
    name: 'blur is Bloom’s BlurIsland',
    language: () => toElement(L.HStack(L.Text('Island')).padding('sm').blur()),
    bloom: () => (
      <BlurIsland style={padding(space.sm)}>
        <RN.View style={{ flexDirection: 'row' }}>
          <Text>Island</Text>
        </RN.View>
      </BlurIsland>
    ),
  },
  {
    name: 'a blur with a corner and a smooth curve',
    language: () => toElement(L.VStack().blur().corner('xl').cornerCurve('smooth')),
    bloom: () => (
      <BlurIsland radius={borderRadius.xl} cornerCurve="smooth">
        <RN.View />
      </BlurIsland>
    ),
  },
  {
    name: 'a blur filled from a role',
    language: () => toElement(L.VStack().background('popover').blur()),
    bloom: () => (
      <Themed>
        {(c) => (
          <BlurIsland style={{ backgroundColor: c.backgroundTertiary }}>
            <RN.View />
          </BlurIsland>
        )}
      </Themed>
    ),
  },
];

export const MATERIAL_CASES: ParityCase[] = [
  ...surface,
  ...islands,
  ...dividers,
  ...boxes,
  ...named,
];
