import type { ReactNode } from 'react';
import * as RN from 'react-native';
import { Avatar } from '@oxy.so/bloom/avatar';
import { Button } from '@oxy.so/bloom/button';
import { useWindowBreakpoint } from '@oxy.so/bloom/hooks';
import { tokens } from '@oxy.so/bloom/styles';
import { useTheme } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

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

/** What a press host the language tracks takes on native: a handler for each state its variants answer. */
const TRACKED =
  RN.Platform.OS === 'web'
    ? null
    : { onPressIn: onPress, onPressOut: onPress, onHoverIn: onPress, onHoverOut: onPress };

/** Bloom JSX's own state style: react-native-web's Pressable hands it the box's press and hover. */
function stated(fill: string, opacity: number) {
  return ({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
    flexDirection: 'row' as const,
    ...(hovered ? { backgroundColor: fill } : null),
    ...(pressed ? { opacity } : null),
  });
}

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
      <Themed>
        {(colors) => (
          <RN.Pressable
            onPress={onPress}
            {...TRACKED}
            style={
              RN.Platform.OS === 'web'
                ? stated(colors.backgroundSecondary, 0.7)
                : { flexDirection: 'row' }
            }
          >
            <Text>a</Text>
          </RN.Pressable>
        )}
      </Themed>
    ),
  },
  {
    name: 'a pressable inside a pressable: each answers its own press and hover',
    language: () =>
      toElement(
        L.HStack(
          L.Text('a'),
          L.HStack(L.Text('b'))
            .padding('sm')
            .onPress(onPress)
            .when('pressed', (v) => v.opacity('half'))
            .when('hovered', (v) => v.background('popover')),
        )
          .onPress(onPress)
          .when('pressed', (v) => v.opacity('70'))
          .when('hovered', (v) => v.background('surface')),
      ),
    // On the web the browser's own state draws both (Chrome checks them held, verify-parity-web.mjs).
    bloom: () => (
      <Themed>
        {(colors) => (
          <RN.Pressable
            onPress={onPress}
            {...TRACKED}
            style={
              RN.Platform.OS === 'web'
                ? stated(colors.backgroundSecondary, 0.7)
                : { flexDirection: 'row' }
            }
          >
            <Text>a</Text>
            <RN.Pressable
              onPress={onPress}
              {...TRACKED}
              style={
                RN.Platform.OS === 'web'
                  ? (state: { pressed: boolean; hovered?: boolean }) => ({
                      ...padding(space.sm),
                      ...stated(colors.backgroundTertiary, 0.5)(state),
                    })
                  : { flexDirection: 'row', ...padding(space.sm) }
              }
            >
              <Text>b</Text>
            </RN.Pressable>
          </RN.Pressable>
        )}
      </Themed>
    ),
  },
  {
    name: 'a Bloom component’s breakpoint variant, in its own style',
    language: () =>
      toElement(
        L.Button(L.Text('Save'))
          .onPress(onPress)
          .when('md', (v) => v.padding('lg').opacity('70')),
      ),
    bloom: () => (
      <Tiered>
        {(atLeast) => (
          <Button
            onPress={onPress}
            style={atLeast('md') ? { ...padding(space.lg), opacity: 0.7 } : undefined}
          >
            Save
          </Button>
        )}
      </Tiered>
    ),
  },
  {
    name: 'a Bloom component’s dark variant, in its own style',
    language: () =>
      toElement(
        L.Avatar('https://cdn.oxy.so/avatars/ana.jpg').when('dark', (v) => v.opacity('half')),
      ),
    bloom: () => (
      <Schemed>
        {(dark) => (
          <Avatar
            source="https://cdn.oxy.so/avatars/ana.jpg"
            style={dark ? { opacity: 0.5 } : undefined}
          />
        )}
      </Schemed>
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
