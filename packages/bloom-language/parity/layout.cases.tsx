import * as RN from 'react-native';
import { bloomShadowStyle } from '@oxy.so/bloom/design-tokens';
import { Border, Fill, Image } from '@oxy.so/bloom/shapes';
import { Z_INDEX } from '@oxy.so/bloom/styles';
import { tokens } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

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
    language: () => toElement(L.VStack(L.Text('card')).corner('lg').shadow('m')),
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

export const LAYOUT_CASES: ParityCase[] = [
  ...distribution,
  ...placement,
  ...overlays,
  ...elevation,
  ...shapes,
];
