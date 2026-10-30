import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type {
  PlatformSurfaceAdapter,
  PlatformWindowMetrics,
  PlatformWindowState,
} from '../platform-surface/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useWindow, useWindowControlsRoom, WindowControls, WindowDragRegion } from './index';

const meta: Meta<typeof WindowControls> = {
  id: 'blocks-window-controls',
  title: 'Composition/Layout/Window Controls',
  component: WindowControls,
  parameters: { layout: 'centered', controls: { disable: true } },
  // The story window is shared with the App Shell and Settings stories; it is not a story.
  excludeStories: /^Story/,
};
export default meta;
type Story = StoryObj<typeof WindowControls>;

/** OxyOS's controls: 14 px discs 4 apart in 20 px targets, centres 26 down and 24 in. */
const STORY_METRICS: PlatformWindowMetrics = {
  controls: { start: 14, top: 16, width: 56, height: 20 },
  room: { top: 52, leading: 88 },
  radius: 16,
};

/**
 * A desktop window for stories: a platform adapter with the `window`
 * capability around a box with the window's corners. Zoom toggles its
 * maximized state; the other actions are reported to `onAction`.
 */
export function StoryWindow({
  children,
  width = 760,
  height = 480,
  active = true,
  fullscreen = false,
  controls = 'bloom',
  onAction,
}: {
  children: React.ReactNode;
  width?: number;
  height?: number;
  active?: boolean;
  fullscreen?: boolean;
  controls?: 'bloom' | 'platform';
  onAction?: (action: 'close' | 'minimize' | 'zoom' | 'move') => void;
}) {
  const theme = useTheme();
  const [maximized, setMaximized] = useState(false);
  const state = useMemo<PlatformWindowState>(
    () => ({ active, maximized, fullscreen }),
    [active, maximized, fullscreen],
  );
  const current = useRef(state);
  const listeners = useRef(new Set<() => void>());
  const report = useRef(onAction);
  report.current = onAction;
  useEffect(() => {
    current.current = state;
    for (const listener of listeners.current) listener();
  }, [state]);
  const adapter = useMemo<PlatformSurfaceAdapter>(
    () => ({
      platform: 'storybook',
      capabilities: new Set(['window']),
      window: {
        controls,
        metrics: STORY_METRICS,
        getState: () => current.current,
        subscribe: (listener) => {
          listeners.current.add(listener);
          return () => {
            listeners.current.delete(listener);
          };
        },
        close: () => report.current?.('close'),
        minimize: () => report.current?.('minimize'),
        zoom: () => {
          setMaximized((value) => !value);
          report.current?.('zoom');
        },
        startMove: () => report.current?.('move'),
      },
    }),
    [controls],
  );
  return (
    <PlatformSurfaceProvider value={adapter}>
      <View
        style={{
          width,
          height,
          borderRadius: fullscreen ? 0 : STORY_METRICS.radius,
          overflow: 'hidden',
          backgroundColor: theme.colors.background,
          boxShadow: active
            ? '0 22px 70px 4px rgba(0, 0, 0, 0.32)'
            : '0 10px 30px 2px rgba(0, 0, 0, 0.18)',
        }}
      >
        {children}
      </View>
    </PlatformSurfaceProvider>
  );
}

/** A toolbar that keeps the controls' room and moves the window, with what was pressed last. */
function Toolbar({ last }: { last: string }) {
  const room = useWindowControlsRoom();
  const appWindow = useWindow();
  return (
    <WindowDragRegion
      style={{
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        paddingInlineStart: room.leading,
        paddingInlineEnd: 16,
        gap: 8,
      }}
    >
      <Text variant="body-medium">Inbox</Text>
      <Text variant="caption-1-regular" style={{ opacity: 0.6 }}>
        {appWindow?.maximized ? 'Zoomed' : 'Restored'} · {last}
      </Text>
    </WindowDragRegion>
  );
}

function Demo({
  active = true,
  plate = false,
  controls,
}: {
  active?: boolean;
  plate?: boolean;
  controls?: 'bloom' | 'platform';
}) {
  const theme = useTheme();
  const [last, setLast] = useState('press the empty toolbar to move');
  return (
    <StoryWindow active={active} controls={controls} onAction={setLast}>
      {plate ? (
        <View style={{ flex: 1, backgroundColor: theme.isDark ? '#36404a' : '#9fb6c8' }}>
          <WindowControls plate />
          <Text variant="body-regular" style={{ margin: 'auto' }}>
            {last}
          </Text>
        </View>
      ) : (
        <>
          <WindowControls />
          <Toolbar last={last} />
          <View style={{ flex: 1, padding: 16 }}>
            <Text variant="body-regular">
              Hover the controls for their symbols. A press shrinks a bubble and springs it back.
            </Text>
          </View>
        </>
      )}
    </StoryWindow>
  );
}

/** The active window: red, yellow and green, the toolbar after their room. */
export const Active: Story = { render: () => <Demo /> };

/** An inactive window: the same bubbles, neutral. */
export const Inactive: Story = { render: () => <Demo active={false} /> };

/** Full-bleed content: no room, the controls float over it on a plate of the surface material. */
export const OnAPlate: Story = { render: () => <Demo plate /> };

/**
 * Where the platform draws its own controls (a Mac's, a browser's over an
 * installed web application): Bloom draws none and keeps their room.
 */
export const PlatformControls: Story = { render: () => <Demo controls="platform" /> };

/** Activation follows the window's state, live. */
export const Toggling: Story = {
  render: function TogglingStory() {
    const [active, setActive] = useState(true);
    return (
      <View style={{ gap: 12, alignItems: 'center' }}>
        <Button onPress={() => setActive((value) => !value)}>
          {active ? 'Deactivate' : 'Activate'}
        </Button>
        <Demo active={active} />
      </View>
    );
  },
};
