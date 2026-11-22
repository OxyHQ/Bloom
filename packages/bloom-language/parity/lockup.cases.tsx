import { Lockup, LockupSkeleton } from '@oxy.so/bloom/lockup';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const ICON = 'https://example.com/atlas-icon.png';

export const LOCKUP_CASES: ParityCase[] = [
  {
    name: 'Lockup',
    language: () => toElement(L.Lockup('Atlas')),
    bloom: () => <Lockup title="Atlas" />,
  },
  ...ENUMS.lockupSize.map((size) => ({
    name: `Lockup ${size}, every part, pressable`,
    language: () =>
      toElement(
        L.Lockup('Atlas Maps', {
          subtitle: 'Offline maps for everywhere',
          caption: 'Travel',
          icon: ICON,
          rank: 3,
          action: L.Button(L.Text('Get')).style('subtle').size('sm'),
        })
          .size(size)
          .onPress(press),
      ),
    bloom: () => (
      <Lockup
        title="Atlas Maps"
        subtitle="Offline maps for everywhere"
        caption="Travel"
        icon={ICON}
        rank={3}
        action={toElement(L.Button(L.Text('Get')).style('subtle').size('sm'))}
        size={size}
        onPress={press}
      />
    ),
  })),
  {
    name: 'Lockup a caption view, a circle icon, a divider, two title lines, named',
    language: () =>
      toElement(
        L.Lockup('A product with a name long enough to wrap onto a second line', {
          caption: L.Text('4.8 ★'),
          href: 'https://example.com/atlas',
        })
          .shape('circle')
          .divider()
          .lines(2)
          .onPress(press)
          .label('Open Atlas'),
      ),
    bloom: () => (
      <Lockup
        title="A product with a name long enough to wrap onto a second line"
        caption={<Text>4.8 ★</Text>}
        href="https://example.com/atlas"
        iconShape="circle"
        divider
        titleNumberOfLines={2}
        onPress={press}
        accessibilityLabel="Open Atlas"
      />
    ),
  },
  {
    name: 'LockupSkeleton',
    language: () => toElement(L.LockupSkeleton()),
    bloom: () => <LockupSkeleton />,
  },
  ...ENUMS.lockupSize.map((size) => ({
    name: `LockupSkeleton ${size}, a caption, no action, a divider, named`,
    language: () =>
      toElement(
        L.LockupSkeleton({ caption: true, action: false })
          .size(size)
          .divider()
          .label('Loading apps'),
      ),
    bloom: () => (
      <LockupSkeleton
        size={size}
        caption
        action={false}
        divider
        accessibilityLabel="Loading apps"
      />
    ),
  })),
];
