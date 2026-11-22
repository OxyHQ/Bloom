import { ConnectionDots } from '@oxy.so/bloom/connection-dots';
import { OutlineNav } from '@oxy.so/bloom/outline-nav';
import { Pagination } from '@oxy.so/bloom/pagination';
import { RiArchiveLine, RiDeleteBinLine, RiEditLine } from '@oxy.so/bloom/icons';
import { ProgressiveBlur } from '@oxy.so/bloom/progressive-blur';
import { RowActionButton, RowActions } from '@oxy.so/bloom/row-actions';
import { SwipeRow } from '@oxy.so/bloom/swipe-row';
import { ThemeToggle } from '@oxy.so/bloom/theme-toggle';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = (_page: number) => {};
const select = () => {};

const HEADINGS = [
  { id: 'intro', label: 'Introduction', level: 1 },
  { id: 'setup', label: 'Setting up', level: 2 },
  { id: 'deep', label: 'A deep detail', level: 3 },
  { id: 'usage', label: 'Usage', level: 2 },
];

const press = () => {};
const ACTIONS = [
  { icon: RiEditLine, label: 'Edit', onPress: press },
  {
    icon: RiDeleteBinLine,
    label: 'Delete',
    accessibilityLabel: 'Delete Invoice.pdf',
    onPress: press,
  },
];
const MENU = [
  { label: 'Rename', icon: RiEditLine, onPress: press },
  { label: 'Archive', onPress: press },
];
const SWIPE = {
  left: [{ key: 'archive', label: 'Archive', icon: RiArchiveLine, tone: 'accent' as const }],
  right: [
    { key: 'edit', label: 'Edit', icon: RiEditLine },
    { key: 'delete', label: 'Delete', icon: RiDeleteBinLine, tone: 'negative' as const },
  ],
};

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
  {
    name: 'RowActions',
    language: () => toElement(L.RowActions('Invoice.pdf', { actions: ACTIONS, menu: MENU })),
    bloom: () => <RowActions name="Invoice.pdf" actions={ACTIONS} menu={MENU} />,
  },
  ...ENUMS.rowActionStyle.map((appearance) => ({
    name: `RowActions menu ${appearance}, its words and width`,
    language: () =>
      toElement(
        L.RowActions('Invoice.pdf', { menu: MENU, menuLabel: 'More', menuWidth: '256' }).style(
          appearance,
        ),
      ),
    bloom: () => (
      <RowActions
        name="Invoice.pdf"
        menu={MENU}
        menuLabel="More"
        menuWidth={256}
        menuAppearance={appearance}
      />
    ),
  })),
  ...ENUMS.rowActionStyle.map((appearance) => ({
    name: `RowActionButton ${appearance}`,
    language: () =>
      toElement(L.RowActionButton(RiEditLine, 'Edit').style(appearance).onPress(press)),
    bloom: () => (
      <RowActionButton icon={RiEditLine} label="Edit" appearance={appearance} onPress={press} />
    ),
  })),
  {
    name: 'RowActionButton active, named, no tooltip',
    language: () =>
      toElement(
        L.RowActionButton(RiDeleteBinLine, 'Delete', { tooltip: false })
          .active(true)
          .label('Delete Invoice.pdf')
          .onPress(press),
      ),
    bloom: () => (
      <RowActionButton
        icon={RiDeleteBinLine}
        label="Delete"
        tooltip={false}
        active
        accessibilityLabel="Delete Invoice.pdf"
        onPress={press}
      />
    ),
  },
  {
    name: 'RowActionButton disabled',
    language: () =>
      toElement(L.RowActionButton(RiEditLine, 'Edit').style('outline').disabled().onPress(press)),
    bloom: () => (
      <RowActionButton
        icon={RiEditLine}
        label="Edit"
        appearance="outline"
        disabled
        onPress={press}
      />
    ),
  },
  {
    name: 'SwipeRow',
    language: () => toElement(L.SwipeRow(L.Text('Invoice.pdf'), SWIPE, { onAction: select })),
    bloom: () => (
      <SwipeRow actions={SWIPE} onAction={select}>
        <Text>Invoice.pdf</Text>
      </SwipeRow>
    ),
  },
  {
    name: 'SwipeRow bubbles on a card, its lengths and fill',
    language: () =>
      toElement(
        L.SwipeRow(L.Text('Invoice.pdf'), SWIPE, {
          actionPresentation: 'bubbles',
          fullSwipeAction: { right: 'delete' },
          height: '64',
          actionWidth: '80',
          radius: 'lg',
          closeLabel: 'Close',
        }).tint('card'),
      ),
    bloom: () => (
      <Themed>
        {(colors) => (
          <SwipeRow
            actions={SWIPE}
            actionPresentation="bubbles"
            fullSwipeAction={{ right: 'delete' }}
            height={64}
            actionWidth={80}
            radius={16}
            closeLabel="Close"
            background={colors.card}
          >
            <Text>Invoice.pdf</Text>
          </SwipeRow>
        )}
      </Themed>
    ),
  },
  ...ENUMS.themeToggleStyle.map((variant) => ({
    name: `ThemeToggle ${variant}`,
    language: () => toElement(L.ThemeToggle().style(variant)),
    bloom: () => <ThemeToggle variant={variant} />,
  })),
  {
    name: 'ThemeToggle collapsed',
    language: () => toElement(L.ThemeToggle({ transitionDuration: 400 }).collapsed()),
    bloom: () => <ThemeToggle collapsed transitionDuration={400} />,
  },
];
