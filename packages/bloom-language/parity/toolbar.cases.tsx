import { View } from 'react-native';
import {
  AutoHideBar,
  ResizeHandle,
  ScrollArea,
  ScrollSurface,
  StickySection,
  Toolbar,
} from '@oxy.so/bloom/layout';
import { tokens } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const { space } = tokens;
const noop = () => {};
const resize = (_distance: number) => {};

export const TOOLBAR_CASES: ParityCase[] = [
  {
    name: 'a toolbar: tools, actions and an accessory row',
    language: () =>
      toElement(
        L.Toolbar(L.Text('bold'), L.Text('italic'))
          .trailing(L.Text('share'))
          .accessory(L.Text('fonts'))
          .testID('tools'),
      ),
    bloom: () => (
      <Toolbar actions={<Text>share</Text>} accessory={<Text>fonts</Text>} testID="tools">
        <Text>bold</Text>
        <Text>italic</Text>
      </Toolbar>
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `a ${size} toolbar`,
    language: () => toElement(L.Toolbar(L.Text('bold')).size(size)),
    bloom: () => (
      <Toolbar size={size}>
        <Text>bold</Text>
      </Toolbar>
    ),
  })),
  {
    name: 'a scroll area: margins, gap, its bar and the keyboard',
    language: () =>
      toElement(
        L.ScrollArea(L.Text('a'), L.Text('b'))
          .contentMargins('horizontal', 'lg')
          .spacing('sm')
          .scrollbarSide('start')
          .size('md')
          .scrollDismissesKeyboard('immediately')
          .keyboardTaps('handled')
          .testID('area'),
      ),
    bloom: () => (
      <ScrollArea
        contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm }}
        scrollbarSide="start"
        size="md"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        testID="area"
      >
        <Text>a</Text>
        <Text>b</Text>
      </ScrollArea>
    ),
  },
  ...ENUMS.scrollbarVisibility.map((scrollbar) => ({
    name: `a scroll area's bar: ${scrollbar}`,
    language: () => toElement(L.ScrollArea(L.Text('a')).scrollbar(scrollbar)),
    bloom: () => (
      <ScrollArea scrollbar={scrollbar}>
        <Text>a</Text>
      </ScrollArea>
    ),
  })),
  {
    name: 'a horizontal scroll area in a frame',
    language: () =>
      toElement(L.ScrollArea(L.Text('a'), L.Text('b')).axis('horizontal').frame({ height: '48' })),
    bloom: () => (
      <View style={{ height: 48 }}>
        <ScrollArea horizontal>
          <Text>a</Text>
          <Text>b</Text>
        </ScrollArea>
      </View>
    ),
  },
  {
    name: 'a scroll surface: sticky chrome, fades and a label',
    language: () =>
      toElement(
        L.ScrollSurface(L.Text('body'))
          .stickyHeader(L.Text('head'))
          .stickyFooter(L.Text('foot'))
          .fadeHeight('lg')
          .fadeBottom(false)
          .label('Messages')
          .testID('surface'),
      ),
    bloom: () => (
      <ScrollSurface
        stickyHeader={<Text>head</Text>}
        stickyFooter={<Text>foot</Text>}
        fadeHeight={space.lg}
        fadeBottom={false}
        label="Messages"
        testID="surface"
      >
        <Text>body</Text>
      </ScrollSurface>
    ),
  },
  ...ENUMS.scrollSurfaceStyle.map((surface) => ({
    name: `a scroll surface on ${surface}, matching its paint`,
    language: () =>
      toElement(L.ScrollSurface(L.Text('body')).style(surface).matchSurfacePaint().spacing('md')),
    bloom: () => (
      <ScrollSurface surface={surface} matchSurfacePaint contentContainerStyle={{ gap: space.md }}>
        <Text>body</Text>
      </ScrollSurface>
    ),
  })),
  ...[false, true].map((collapsed) => ({
    name: `an auto-hiding bar, ${collapsed ? 'collapsed' : 'shown'}`,
    language: () =>
      toElement(
        L.AutoHideBar(L.Text('bar'), L.Text('body'))
          .summary('oxy.so')
          .collapsed(collapsed)
          .onReveal(noop)
          .label('Show the toolbar')
          .testID('chrome'),
      ),
    bloom: () => (
      <AutoHideBar
        bar={<Text>bar</Text>}
        summary="oxy.so"
        collapsed={collapsed}
        onReveal={noop}
        revealLabel="Show the toolbar"
        testID="chrome"
      >
        <Text>body</Text>
      </AutoHideBar>
    ),
  })),
  {
    name: 'an auto-hiding bar: its heights, a drawn summary, no peek',
    language: () =>
      toElement(
        L.AutoHideBar(L.Text('bar'), L.Text('body'))
          .summary(L.Text('page'))
          .collapsed()
          .peek(false)
          .barHeight('44')
          .collapsedHeight('2xl'),
      ),
    bloom: () => (
      <AutoHideBar
        bar={<Text>bar</Text>}
        summary={<Text>page</Text>}
        collapsed
        peek={false}
        height={44}
        collapsedHeight={space._2xl}
      >
        <Text>body</Text>
      </AutoHideBar>
    ),
  },
  ...ENUMS.resizeHandleStyle.flatMap((variant) =>
    ENUMS.axis.map((orientation) => ({
      name: `a ${orientation} ${variant} resize handle`,
      language: () =>
        toElement(
          L.ResizeHandle(resize)
            .style(variant)
            .axis(orientation)
            .onResizeStart(noop)
            .onResizeEnd(noop)
            .onNudge(resize)
            .label('Resize the panes')
            .testID('edge'),
        ),
      bloom: () => (
        <ResizeHandle
          variant={variant}
          orientation={orientation}
          onResize={resize}
          onResizeStart={noop}
          onResizeEnd={noop}
          onNudge={resize}
          label="Resize the panes"
          testID="edge"
        />
      ),
    })),
  ),
  {
    name: 'a resize handle with its own hit strip',
    language: () => toElement(L.ResizeHandle(resize).thickness('14')),
    bloom: () => <ResizeHandle onResize={resize} thickness={14} />,
  },
  {
    name: 'a sticky section',
    language: () => toElement(L.StickySection(L.Text('Today')).testID('day')),
    bloom: () => (
      <StickySection testID="day">
        <Text>Today</Text>
      </StickySection>
    ),
  },
];
