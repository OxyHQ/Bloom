import { ConnectionDots } from '@oxy.so/bloom/connection-dots';
import { OutlineNav } from '@oxy.so/bloom/outline-nav';
import { Pagination } from '@oxy.so/bloom/pagination';
import { ProgressiveBlur } from '@oxy.so/bloom/progressive-blur';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = (_page: number) => {};
const select = () => {};

const HEADINGS = [
  { id: 'intro', label: 'Introduction', level: 1 },
  { id: 'setup', label: 'Setting up', level: 2 },
  { id: 'deep', label: 'A deep detail', level: 3 },
  { id: 'usage', label: 'Usage', level: 2 },
];

export const GENERIC_CASES: ParityCase[] = [
  {
    name: 'ConnectionDots',
    language: () => toElement(L.ConnectionDots(L.Text('App'), L.Text('Oxy')).label('Linking')),
    bloom: () => (
      <ConnectionDots
        left={<Text>App</Text>}
        right={<Text>Oxy</Text>}
        accessibilityLabel="Linking"
      />
    ),
  },
  {
    name: 'ConnectionDots still, four larger dots',
    language: () =>
      toElement(
        L.ConnectionDots(L.Text('App'), L.Text('Oxy'), {
          dotCount: 4,
          dotSize: '10',
          reducedMotion: true,
        }),
      ),
    bloom: () => (
      <ConnectionDots
        left={<Text>App</Text>}
        right={<Text>Oxy</Text>}
        dotCount={4}
        dotSize={10}
        reducedMotion
      />
    ),
  },
  ...ENUMS.outlineNavStyle.map((variant) => ({
    name: `OutlineNav ${variant}`,
    language: () =>
      toElement(
        L.OutlineNav(HEADINGS, {
          activeId: 'setup',
          onSelect: select,
          title: 'On this page',
          progress: 0.4,
        }).style(variant),
      ),
    bloom: () => (
      <OutlineNav
        headings={HEADINGS}
        activeId="setup"
        onSelect={select}
        title="On this page"
        progress={0.4}
        variant={variant}
      />
    ),
  })),
  {
    name: 'OutlineNav without progress, named',
    language: () =>
      toElement(
        L.OutlineNav(HEADINGS, { hideProgress: true, compactMaxLevel: 1 }).label('Contents'),
      ),
    bloom: () => (
      <OutlineNav
        headings={HEADINGS}
        hideProgress
        compactMaxLevel={1}
        accessibilityLabel="Contents"
      />
    ),
  },
  ...[1, 6, 12].map((page) => ({
    name: `Pagination page ${page} of 12`,
    language: () => toElement(L.Pagination([page, set], 12)),
    bloom: () => <Pagination page={page} totalPages={12} onChange={set} />,
  })),
  {
    name: 'Pagination with its words',
    language: () =>
      toElement(
        L.Pagination([3, set], 5, {
          siblingCount: 2,
          previousLabel: 'Back',
          nextLabel: 'On',
          getPageLabel: (page) => `Sheet ${page}`,
        }).label('Sheets'),
      ),
    bloom: () => (
      <Pagination
        page={3}
        totalPages={5}
        onChange={set}
        siblingCount={2}
        previousLabel="Back"
        nextLabel="On"
        getPageLabel={(page) => `Sheet ${page}`}
        accessibilityLabel="Sheets"
      />
    ),
  },
  ...(['top', 'bottom'] as const).map((direction) => ({
    name: `ProgressiveBlur ${direction}`,
    language: () =>
      toElement(
        L.ProgressiveBlur({ direction, intensity: 8 }).frame({ width: '200', height: '64' }),
      ),
    bloom: () => (
      <ProgressiveBlur direction={direction} intensity={8} style={{ width: 200, height: 64 }} />
    ),
  })),
];
