import type { ReactNode } from 'react';
import * as RN from 'react-native';
import { useWindowBreakpoint } from '@oxy.so/bloom/hooks';
import { tokens } from '@oxy.so/bloom/styles';
import { useTheme } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';
import { RiHeart3Line } from '@oxy.so/bloom/icons';

import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const { space } = tokens;
const padding = (value: number) => ({
  paddingTop: value,
  paddingBottom: value,
  paddingStart: value,
  paddingEnd: value,
});

const TIERS = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Bloom JSX that reads the window's tier as an app does (`useWindowBreakpoint()`). */
function Tiered({ children }: { children: (atLeast: (tier: string) => boolean) => ReactNode }) {
  const tier = useWindowBreakpoint();
  return children((at) => TIERS.indexOf(tier) >= TIERS.indexOf(at));
}

/** Bloom JSX that reads the scheme as an app does (`useTheme()`). */
function Schemed({ children }: { children: (dark: boolean) => ReactNode }) {
  return children(useTheme().isDark);
}

const onPress = () => {};

export const VARIANT_CASES: ParityCase[] = [
  {
    name: 'a breakpoint variant (md) over a padding',
    language: () =>
      toElement(
        L.VStack(L.Text('a'))
          .padding('sm')
          .when('md', (v) => v.padding('lg')),
      ),
    bloom: () => (
      <Tiered>
        {(atLeast) => (
          <RN.View style={padding(atLeast('md') ? space.lg : space.sm)}>
            <Text>a</Text>
          </RN.View>
        )}
      </Tiered>
    ),
  },
  {
    name: 'a column that is a row from md, hidden below sm',
    language: () =>
      toElement(
        L.VStack(L.Text('a'), L.Text('b'))
          .hidden()
          .when('sm', (v) => v.hidden(false))
          .when('md', (v) => v.axis('horizontal').justify('between')),
      ),
    bloom: () => (
      <Tiered>
        {(atLeast) => (
          <RN.View
            style={{
              ...(atLeast('md') ? { flexDirection: 'row', justifyContent: 'space-between' } : null),
              display: atLeast('sm') ? 'flex' : 'none',
            }}
          >
            <Text>a</Text>
            <Text>b</Text>
          </RN.View>
        )}
      </Tiered>
    ),
  },
  {
    name: 'the dark scheme’s fill and ink',
    language: () =>
      toElement(
        L.VStack(L.Text('a'))
          .background('surface')
          .foreground('muted')
          .when('dark', (v) => v.background('popover').foreground('foreground')),
      ),
    bloom: () => (
      <Schemed>
        {(dark) => (
          <Themed>
            {(colors) => (
              <RN.View
                style={{
                  backgroundColor: dark ? colors.backgroundTertiary : colors.backgroundSecondary,
                }}
              >
                <Text style={{ color: dark ? colors.text : colors.textSecondary }}>a</Text>
              </RN.View>
            )}
          </Themed>
        )}
      </Schemed>
    ),
  },
  {
    name: 'a pressed and a hovered variant, at rest (the press host tracks both)',
    language: () =>
      toElement(
        L.HStack(L.Text('a'))
          .onPress(onPress)
          .when('pressed', (v) => v.opacity('70'))
          .when('hovered', (v) => v.background('surface')),
      ),
    // The press host tracks the states its variants answer: on native, by their handlers.
    bloom: () => (
      <RN.Pressable
        onPress={onPress}
        {...(RN.Platform.OS === 'web'
          ? null
          : { onPressIn: onPress, onPressOut: onPress, onHoverIn: onPress, onHoverOut: onPress })}
        style={{ flexDirection: 'row' }}
      >
        <Text>a</Text>
      </RN.Pressable>
    ),
  },
  {
    name: 'a variant inside a variant (md, then dark), at rest',
    language: () =>
      toElement(
        L.VStack(L.Text('a'))
          .padding('sm')
          .when('md', (v) => v.when('dark', (d) => d.padding('lg'))),
      ),
    bloom: () => (
      <Tiered>
        {(atLeast) => (
          <Schemed>
            {(dark) => (
              <RN.View style={padding(atLeast('md') && dark ? space.lg : space.sm)}>
                <Text>a</Text>
              </RN.View>
            )}
          </Schemed>
        )}
      </Tiered>
    ),
  },
  {
    name: 'an icon whose ink a hover varies, at rest',
    language: () =>
      toElement(
        L.HStack(L.Icon(RiHeart3Line))
          .onPress(onPress)
          .foreground('muted')
          .when('hovered', (v) => v.foreground('primary')),
      ),
    // The web answers the hover with CSS: the glyph paints currentColor, its colour a class.
    bloom: () => (
      <RN.Pressable
        onPress={onPress}
        {...(RN.Platform.OS === 'web' ? null : { onHoverIn: onPress, onHoverOut: onPress })}
        style={{ flexDirection: 'row' }}
      >
        <Themed>
          {(colors) =>
            RN.Platform.OS === 'web' ? (
              <RiHeart3Line
                fill="currentColor"
                width={20}
                height={20}
                style={{ color: 'var(--muted-foreground)' }}
              />
            ) : (
              <RiHeart3Line fill={colors.textSecondary} width={20} height={20} />
            )
          }
        </Themed>
      </RN.Pressable>
    ),
  },
  {
    name: 'a platform variant',
    language: () => toElement(L.VStack(L.Text('a')).when('web', (v) => v.padding('lg'))),
    bloom: () => (
      <RN.View style={RN.Platform.OS === 'web' ? padding(space.lg) : undefined}>
        <Text>a</Text>
      </RN.View>
    ),
  },
  {
    name: 'a disabled pressable’s variant',
    language: () =>
      toElement(
        L.HStack(L.Text('a'))
          .onPress(onPress)
          .disabled()
          .when('disabled', (v) => v.opacity('half')),
      ),
    bloom: () => (
      <RN.Pressable onPress={onPress} disabled style={{ flexDirection: 'row', opacity: 0.5 }}>
        <Text>a</Text>
      </RN.Pressable>
    ),
  },
];
