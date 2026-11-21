import * as RN from 'react-native';
import { Badge } from '@oxy.so/bloom/badge';
import { IconCircle } from '@oxy.so/bloom/icon-circle';
import { RiHeart3Line, RiNotification3Line } from '@oxy.so/bloom/icons';
import { Loading } from '@oxy.so/bloom/loading';
import { PressableScale } from '@oxy.so/bloom/pressable-scale';
import * as Skeleton from '@oxy.so/bloom/skeleton';
import { tokens } from '@oxy.so/bloom/styles';
import { SubtleHover } from '@oxy.so/bloom/subtle-hover';
import { Text, TYPE_SCALE } from '@oxy.so/bloom/typography';

import { ENUMS, ICON_SIZE } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import type { IconSizeName } from '../src/tokens';
import { type ParityCase, Themed } from './support/cases';

const onPress = () => {};
const { space, borderRadius } = tokens;

const badges: ParityCase[] = [
  { name: 'a count', language: () => toElement(L.Badge(7)), bloom: () => <Badge content={7} /> },
  ...ENUMS.badgeStyle.map((style) => ({
    name: `style ${style}`,
    language: () => toElement(L.Badge('New').style(style)),
    bloom: () => <Badge content="New" variant={style} />,
  })),
  ...ENUMS.tone.map((tone) => ({
    name: `tint ${tone}`,
    language: () => toElement(L.Badge(3).tint(tone)),
    bloom: () => <Badge content={3} tone={tone} />,
  })),
  ...ENUMS.badgeSize.map((size) => ({
    name: `size ${size}`,
    language: () => toElement(L.Badge('Beta').size(size)),
    bloom: () => <Badge content="Beta" size={size} />,
  })),
  {
    name: 'a label with an icon',
    language: () => toElement(L.Badge('Live').size('label-medium').icon(RiHeart3Line)),
    bloom: () => <Badge content="Live" size="label-medium" icon={RiHeart3Line} />,
  },
  {
    name: 'a capped count',
    language: () => toElement(L.Badge(240).max(99)),
    bloom: () => <Badge content={240} max={99} />,
  },
  {
    name: 'a status dot',
    language: () => toElement(L.Badge().dot().tint('success')),
    bloom: () => <Badge dot tone="success" />,
  },
  {
    name: 'a badge on an icon, top left',
    language: () => toElement(L.Icon(RiNotification3Line).badge(L.Badge(2).placement('top-left'))),
    bloom: () => (
      <Themed>
        {(c) => (
          <Badge content={2} placement="top-left">
            <RiNotification3Line size="md" fill={c.text} />
          </Badge>
        )}
      </Themed>
    ),
  },
];

const circles: ParityCase[] = [
  {
    name: 'IconCircle',
    language: () => toElement(L.IconCircle(RiHeart3Line)),
    bloom: () => <IconCircle icon={RiHeart3Line} />,
  },
  ...(Object.keys(ICON_SIZE) as IconSizeName[]).map((size) => ({
    name: `IconCircle ${size}`,
    language: () => toElement(L.IconCircle(RiHeart3Line).size(size)),
    bloom: () => <IconCircle icon={RiHeart3Line} size={size} />,
  })),
];

const loading: ParityCase[] = [
  { name: 'Loading', language: () => toElement(L.Loading()), bloom: () => <Loading /> },
  ...ENUMS.loadingStyle.map((style) => ({
    name: `Loading ${style}`,
    language: () => toElement(L.Loading().style(style)),
    bloom: () => <Loading variant={style} />,
  })),
  ...ENUMS.controlSize.map((size) => ({
    name: `Loading ${size}`,
    language: () => toElement(L.Loading().size(size)),
    bloom: () => <Loading size={size} />,
  })),
  {
    name: 'Loading with text, tinted, named',
    language: () =>
      toElement(L.Loading(L.Text('Syncing')).tint('success').label('Syncing mail').testID('sync')),
    bloom: () => (
      <Loading text="Syncing" tone="success" accessibilityLabel="Syncing mail" testID="sync" />
    ),
  },
  {
    name: 'Loading inline with text',
    language: () => toElement(L.Loading(L.Text('Saving')).style('inline')),
    bloom: () => <Loading variant="inline" text="Saving" />,
  },
];

const skeletons: ParityCase[] = [
  {
    name: 'a text line',
    language: () => toElement(L.Skeleton('text')),
    bloom: () => <Skeleton.Text />,
  },
  {
    name: 'a body line, narrowed',
    language: () => toElement(L.Skeleton('text').font('body').frame({ width: '5xl' })),
    bloom: () => (
      <Skeleton.Text style={{ lineHeight: TYPE_SCALE['body-regular'].lineHeight, width: 60 }} />
    ),
  },
  {
    name: 'a circle',
    language: () => toElement(L.Skeleton('circle').frame({ height: '4xl' })),
    bloom: () => <Skeleton.Circle size={space._4xl} />,
  },
  {
    name: 'a pill',
    language: () => toElement(L.Skeleton('pill').frame({ height: 'xl' })),
    bloom: () => <Skeleton.Pill size={space.xl} />,
  },
  {
    name: 'a box',
    language: () =>
      toElement(L.Skeleton('box').frame({ width: '5xl', height: '3xl' }).corner('lg')),
    bloom: () => <Skeleton.Box width={60} height={space._3xl} borderRadius={borderRadius.lg} />,
  },
  {
    name: 'a named region',
    language: () =>
      toElement(
        L.SkeletonGroup(L.Skeleton('circle').frame({ height: '3xl' }), L.Skeleton('text')).label(
          'Loading the profile',
        ),
      ),
    bloom: () => (
      <Skeleton.Region label="Loading the profile">
        <Skeleton.Circle size={space._3xl} />
        <Skeleton.Text />
      </Skeleton.Region>
    ),
  },
];

const presses: ParityCase[] = [
  {
    name: 'a press that scales',
    language: () => toElement(L.VStack(L.Text('Open')).onPress(onPress).pressScale()),
    bloom: () => (
      <PressableScale onPress={onPress}>
        <Text>Open</Text>
      </PressableScale>
    ),
  },
  {
    name: 'a hover wash',
    language: () => toElement(L.HStack(L.Text('Row')).hoverHighlight()),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row' }}>
        <SubtleHover />
        <Text>Row</Text>
      </RN.View>
    ),
  },
  {
    name: 'a coordinated highlight',
    language: () => toElement(L.VStack(L.Text('Post')).hoverHighlight(true)),
    bloom: () => (
      <RN.View>
        <SubtleHover active native />
        <Text>Post</Text>
      </RN.View>
    ),
  },
];

export const PIECES_CASES: ParityCase[] = [
  ...badges,
  ...circles,
  ...loading,
  ...skeletons,
  ...presses,
];
