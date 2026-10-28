import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomScope } from '../appearance';
import { Button } from '../button';
import { RiAddLine, RiLayoutGridLine, RiSideBarLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AppShell, useAppShell } from './index';
import type { ResizeHandleVariant } from '../layout/types';
import type { AppShellDock } from './types';

const meta: Meta<typeof AppShell> = {
  id: 'blocks-app-shell-window',
  title: 'Composition/Layout/App Shell/Window',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  component: AppShell,
};
export default meta;
type Story = StoryObj<typeof AppShell>;

const SIDEBAR_WIDTH = 190;
const ROWS = ['Inbox', 'Calendar', 'Docs', 'Design review', 'Release notes', 'Roadmap'];

/** A window backdrop the transparent shell lets through. */
function WindowBackdrop({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: '100vh' as unknown as number,
        backgroundColor: theme.isDark ? '#2a191f' : '#e9e4e6',
      }}
    >
      {children}
    </View>
  );
}

function SidebarContent({ action }: { action?: boolean }) {
  const theme = useTheme();
  const { navigationDock } = useAppShell();
  return (
    <View testID="window-sidebar" style={{ flex: 1, paddingTop: 46, paddingHorizontal: 6, gap: 3 }}>
      {action ? (
        <Button testID="window-new-tab" size="sm" leadingIcon={RiAddLine}>
          New tab
        </Button>
      ) : null}
      {ROWS.map((row, index) => (
        <View
          key={row}
          style={{
            height: 34,
            borderRadius: 10,
            paddingHorizontal: 9,
            justifyContent: 'center',
            backgroundColor:
              index === 0
                ? theme.isDark
                  ? 'rgba(0,0,0,0.4)'
                  : 'rgba(255,255,255,0.8)'
                : undefined,
          }}
        >
          <Text numberOfLines={1}>{row}</Text>
        </View>
      ))}
      <Text variant="caption-1-regular" style={{ padding: 9, opacity: 0.6 }}>
        {navigationDock.peeking ? 'Peeking' : navigationDock.hidden ? 'Hidden' : 'Docked'}
      </Text>
    </View>
  );
}

function Card({ label }: { label: string }) {
  const { navigationDock } = useAppShell();
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height: 41,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 6,
        }}
      >
        <Button
          testID={`toggle-${label}`}
          iconOnly
          size="sm"
          appearance="plain"
          leadingIcon={RiSideBarLine}
          accessibilityLabel={navigationDock.hidden ? 'Show sidebar' : 'Hide sidebar'}
          onPress={navigationDock.toggleHidden}
        />
        <Text>{label}</Text>
      </View>
      <View style={{ flex: 1, padding: 16 }}>
        <Text variant="body-regular">
          Hide the sidebar, then rest the pointer on the window's start edge: the same sidebar
          floats back over the page without moving it.
        </Text>
      </View>
    </View>
  );
}

function Window({
  split,
  dock,
  resizeHandle,
  action,
}: {
  split: number;
  dock?: AppShellDock;
  resizeHandle?: ResizeHandleVariant;
  action?: boolean;
}) {
  const panes = ['Page', 'Second pane', 'Third pane', 'Fourth pane'].slice(0, split);
  return (
    <WindowBackdrop>
      <BloomScope panelRadius={10}>
        <AppShell
          testID="window"
          background="transparent"
          header={null}
          navigationAlign="content"
          navigationGap={0}
          navFrom={0}
          framedFrom={0}
          contentMaxWidth="none"
          frameInset={{ top: 6, end: 7, bottom: 7, start: 7 }}
          sidebar={{
            surface: 'plain',
            variant: 'panel',
            collapsed: false,
            collapseDisabled: true,
            width: SIDEBAR_WIDTH,
            render: () => <SidebarContent action={action} />,
            dock: { peek: true, ...dock },
          }}
          panelLayout={{
            mode: 'split',
            flow: 'bounded',
            gap: 7,
            resizeHandle,
            panels: panes.map((label) => ({
              id: label,
              minWidth: 220,
              resizable: true,
              content: <Card label={label} />,
            })),
          }}
        />
      </BloomScope>
    </WindowBackdrop>
  );
}

/**
 * A desktop browser's window: a transparent shell over the window's backdrop,
 * a flush 190-wide sidebar, one content card 6/7/7 from the window's edges
 * with radius 10. The sidebar hides on a spring (response 0.215 s, damping
 * ratio 0.79) as the card's start edge follows it, and peeks back from the
 * start edge on its own spring (0.185 s, 0.77).
 */
export const DockedSidebar: Story = { render: () => <Window split={1} /> };

/** The same window split in two, the panes 7 apart with a resize grip between. */
export const SplitWindow: Story = { render: () => <Window split={2} /> };

/**
 * Panes divided by the split's own handle: a 4×36 bar centred in the 7 pt
 * gap, shown only under the pointer (32% of the foreground) and while
 * dragging (55%), its strip the gap plus 2 pt of each pane.
 */
export const PillDividers: Story = {
  render: () => <Window split={3} resizeHandle="pill" />,
};

/**
 * A peek that fades as it slides, a desktop browser's default: in and out
 * over 180 ms on an ease-out cubic, the fade following the slide
 * (`peek.fade`). The sidebar holds a material button, which fades through its
 * surface presence while the rows fade piece by piece: nothing above the
 * material ever takes an opacity, so it keeps its blur all the way.
 */
export const FadingPeek: Story = {
  render: () => (
    <Window
      split={1}
      action
      dock={{
        defaultHidden: true,
        peek: { fade: true },
        motion: {
          peekIn: { duration: 180, easing: [0.215, 0.61, 0.355, 1] },
          peekOut: { duration: 180, easing: [0.215, 0.61, 0.355, 1] },
        },
      }}
    />
  ),
};

/** Starts hidden: rest the pointer on the start edge to peek. */
export const HiddenSidebar: Story = {
  render: () => <Window split={1} dock={{ defaultHidden: true }} />,
};

function Strip() {
  const theme = useTheme();
  const { topBarDock } = useAppShell();
  return (
    <View
      testID="window-strip"
      style={{
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 86,
      }}
    >
      {['Home', 'Mail', 'Docs'].map((tab, index) => (
        <View
          key={tab}
          style={{
            width: 173,
            height: 32,
            borderRadius: 10,
            justifyContent: 'center',
            paddingHorizontal: 10,
            backgroundColor:
              index === 0
                ? theme.isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.05)'
                : undefined,
          }}
        >
          <Text numberOfLines={1}>{tab}</Text>
        </View>
      ))}
      <Button
        testID="toggle-strip"
        iconOnly
        size="sm"
        appearance="plain"
        leadingIcon={RiLayoutGridLine}
        accessibilityLabel="Hide tabs"
        onPress={topBarDock.toggleHidden}
      />
    </View>
  );
}

function TopStripWindow() {
  const [hidden, setHidden] = useState(false);
  return (
    <WindowBackdrop>
      <BloomScope panelRadius={10}>
        <AppShell
          testID="window"
          background="transparent"
          header={null}
          framedFrom={0}
          contentMaxWidth="none"
          frameInset={{ top: hidden ? 6 : 0, end: 6, bottom: 6, start: 6 }}
          topBar={<Strip />}
          topBarVisibility="always"
          topBarDock={{ hidden, onHiddenChange: setHidden, peek: true }}
          panelLayout={{
            mode: 'split',
            flow: 'bounded',
            gap: 7,
            panels: [
              {
                id: 'page',
                content: (
                  <View style={{ flex: 1, padding: 16, gap: 12 }}>
                    <Button testID="show-strip" onPress={() => setHidden(!hidden)}>
                      {hidden ? 'Show tabs' : 'Hide tabs'}
                    </Button>
                    <Text>Hidden, the strip peeks from the top edge.</Text>
                  </View>
                ),
              },
            ],
          }}
        />
      </BloomScope>
    </WindowBackdrop>
  );
}

/** Tabs across the top: the strip is the top bar, the card starts right under it. */
export const TopTabStrip: Story = { render: () => <TopStripWindow /> };

const RETAINED = ['One', 'Two', 'Three', 'Four'];
const pageDoc = (label: string) =>
  `<body style="margin:0;font:15px system-ui;display:grid;place-items:center;height:100vh"><p>${label}: loaded <b id="n"></b> time(s)</p><script>const k='bloom-retained-${label}';const n=+(sessionStorage.getItem(k)||0)+1;sessionStorage.setItem(k,n);document.getElementById('n').textContent=n</script></body>`;

function RetainedPage({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View
      style={{ flex: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: theme.colors.card }}
    >
      <iframe
        title={label}
        srcDoc={pageDoc(label)}
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </View>
  );
}

function RetainedWindow() {
  const [order, setOrder] = useState(RETAINED);
  const [shown, setShown] = useState(3);
  const [stacked, setStacked] = useState(false);
  const [spans, setSpans] = useState<Readonly<Record<string, number>>>({});
  const visible = order.slice(0, shown);
  return (
    <WindowBackdrop>
      <View style={{ flexDirection: 'row', gap: 8, padding: 8 }}>
        <Button onPress={() => setOrder((o) => [...o.slice(1), o[0]!])}>Rotate</Button>
        <Button onPress={() => setShown((n) => (n % 4) + 1)}>Show {(shown % 4) + 1}</Button>
        <Button onPress={() => setStacked((s) => !s)}>
          {stacked ? 'Unstack' : 'Stack the last two'}
        </Button>
      </View>
      <BloomScope panelRadius={10}>
        <AppShell
          testID="retained-window"
          background="transparent"
          header={null}
          variant="feed"
          scroll="fixed"
          contentMaxWidth="none"
          panelLayout={{
            mode: 'split',
            flow: 'bounded',
            retain: true,
            gap: 7,
            resizeHandle: 'pill',
            spans,
            onSpansChange: setSpans,
            panels: order.map((label) => ({
              id: label,
              visible: visible.includes(label),
              stack: stacked && visible.indexOf(label) >= visible.length - 2 ? 'stack' : undefined,
              resizable: true,
              minWidth: 160,
              minHeight: 120,
              content: <RetainedPage label={label} />,
            })),
          }}
        />
      </BloomScope>
    </WindowBackdrop>
  );
}

/**
 * Retained panels (`panelLayout.retain`): each page is an iframe that counts
 * its own loads. Rotating the panels, stacking the last two, showing fewer and
 * showing them again moves only geometry: every count stays at 1, and a
 * hidden page keeps its size so it shows again at once.
 */
export const RetainedPanels: Story = { render: () => <RetainedWindow /> };
