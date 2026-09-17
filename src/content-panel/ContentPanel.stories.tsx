import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ContentPanel } from './index';
import { Text } from '../typography';
import { Divider } from '../divider';

const meta: Meta<typeof ContentPanel> = {
  title: 'Base/Content Panel',
  component: ContentPanel,
};

export default meta;

type Story = StoryObj<typeof ContentPanel>;

function Body() {
  return (
    <View style={{ gap: 12, paddingVertical: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Settings</Text>
      <Text>
        A content panel is the column a screen's content lives in. It decides the
        maximum reading width and, above a breakpoint, whether that column reads
        as a framed surface or as the page itself.
      </Text>
      <Divider spacing={8} />
      <Text>Nothing inside it needs to know which of the two it got.</Text>
    </View>
  );
}

/**
 * Unframed: the panel is a width constraint and nothing else. This is the right
 * default for a phone and for a full-bleed page — a frame at narrow widths puts
 * a border a few pixels from the screen edge, which reads as a rendering bug.
 */
export const Plain: Story = {
  render: () => (
    <View style={{ width: 720 }}>
      <ContentPanel>
        <Body />
      </ContentPanel>
    </View>
  ),
};

/**
 * `framed` draws the surface. `framedFrom` is the breakpoint it starts at, so
 * one screen can be a plain column on a phone and a framed card on a desktop
 * without the caller branching on width itself.
 */
export const Framed: Story = {
  render: () => (
    <View style={{ width: 720 }}>
      <ContentPanel framed framedFrom={640}>
        <Body />
      </ContentPanel>
    </View>
  ),
};

/**
 * Panels are SIBLINGS, never nested. A panel inside a panel would frame inside
 * a frame and inset the reading column twice, so `ContentPanel` throws rather
 * than drawing it — a loud failure in development instead of a layout that
 * looks subtly padded in production.
 *
 * A screen chooses one panel per column; the sections inside it are plain
 * views.
 */
/**
 * `overlaySizing="panel"` — for a consumer whose shell already bounds the
 * panel's height (no document scroll) and places something OUTSIDE the panel,
 * such as this header. The default `overlaySizing="viewport"` would size its
 * overlays to `100dvh` regardless of the header's height and paint over it;
 * `"panel"` sizes them to the panel's own real box instead.
 */
export const ExternalHeaderBoundedShell: Story = {
  render: () => (
    <View style={{ width: 720, height: 480, flexDirection: 'column' }}>
      <View style={{ height: 56, justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>External header (outside the panel)</Text>
      </View>
      <View style={{ flex: 1 }}>
        <ContentPanel framed overlaySizing="panel">
          <Body />
        </ContentPanel>
      </View>
    </View>
  ),
};

export const SideBySide: Story = {
  render: () => (
    <View style={{ width: 900, flexDirection: 'row', gap: 16 }}>
      <View style={{ flex: 2 }}>
        <ContentPanel framed framedFrom={500}>
          <Body />
        </ContentPanel>
      </View>
      <View style={{ flex: 1 }}>
        <ContentPanel framed framedFrom={500}>
          <Text style={{ paddingVertical: 16 }}>A second, independent column.</Text>
        </ContentPanel>
      </View>
    </View>
  ),
};

/**
 * The panel's EDGE. `chrome` decides how much of it there is: `elevated` (the
 * default) is the hairline plus the floating-panel shadow the `Sidebar` wears,
 * so the panel reads as a surface lifted off the page; `border` is the hairline
 * alone; `none` leaves a flat rounded surface for an app whose page background
 * already does the separating.
 */
export const Chrome: Story = {
  render: () => (
    <View style={{ gap: 32, padding: 24, width: 760 }}>
      {(['elevated', 'border', 'none'] as const).map((chrome) => (
        <View key={chrome} style={{ gap: 8 }}>
          <Text variant="body-2-medium">{`chrome="${chrome}"`}</Text>
          {/* `overlaySizing="panel"`: three panels stacked in one story are
              each a bounded box, not a document that scrolls — the viewport-sized
              default would draw every frame a screen tall. */}
          <ContentPanel framed framedFrom={640} chrome={chrome} overlaySizing="panel">
            <Body />
          </ContentPanel>
        </View>
      ))}
    </View>
  ),
};
