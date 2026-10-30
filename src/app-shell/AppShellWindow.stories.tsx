import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Card as BloomCard, CardDescription, CardHeader, CardTitle } from '../card';
import { PageHeader } from '../page-header';
import { Screen, ScreenScrollView } from '../screen';
import { RiAddLine, RiLayoutGridLine, RiSideBarLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { useWindowControlsRoom, WindowDragRegion } from '../window';
import { StoryWindow } from '../window/WindowControls.stories';
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

/**
 * A desktop window (the `window` capability, its controls Bloom's) whose
 * backdrop the transparent shell lets through.
 */
function WindowBackdrop({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <StoryWindow width={1100} height={640}>
      <View style={{ flex: 1, backgroundColor: theme.isDark ? '#2a191f' : '#e9e4e6' }}>
        {children}
      </View>
    </StoryWindow>
  );
}

/** The same backdrop without a window: the shell below a toolbar of the page's own. */
function PlainBackdrop({ children }: { children: React.ReactNode }) {
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

/**
 * A sidebar of its own (`render`): the shell hands it the controls' room, which
 * it keeps at its top as the window's drag region.
 */
function SidebarContent({ action, room }: { action?: boolean; room: number }) {
  const theme = useTheme();
  const { navigationDock } = useAppShell();
  return (
    <View
      testID="window-sidebar"
      style={{ flex: 1, paddingTop: room, paddingHorizontal: 6, gap: 3 }}
    >
      <WindowDragRegion style={{ position: 'absolute', top: 0, left: 0, right: 0, height: room }} />
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

/** The frame's start inset around the cards. */
const FRAME_START = 7;

function Card({ label, first }: { label: string; first: boolean }) {
  const { navigationDock } = useAppShell();
  // `header={null}`: the page owns the window's corner. With the sidebar
  // hidden the first card's toolbar is there, so it keeps the controls' room.
  const room = useWindowControlsRoom();
  const cornered = first && navigationDock.hidden;
  return (
    <View style={{ flex: 1 }}>
      <WindowDragRegion
        style={{
          height: 41,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingInlineStart: cornered ? Math.max(6, room.leading - FRAME_START) : 6,
          paddingInlineEnd: 6,
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
      </WindowDragRegion>
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
          frameInset={{ top: 6, end: 7, bottom: 7, start: FRAME_START }}
          sidebar={{
            surface: 'plain',
            variant: 'panel',
            collapsed: false,
            collapseDisabled: true,
            width: SIDEBAR_WIDTH,
            render: (props) => (
              <SidebarContent action={action} room={props.windowControlsRoom ?? 0} />
            ),
            dock: { peek: true, ...dock },
          }}
          panelLayout={{
            mode: 'split',
            flow: 'bounded',
            gap: 7,
            resizeHandle,
            panels: panes.map((label, index) => ({
              id: label,
              minWidth: 220,
              resizable: true,
              content: <Card label={label} first={index === 0} />,
            })),
          }}
        />
      </BloomScope>
    </WindowBackdrop>
  );
}

/**
 * A desktop browser's window: a transparent shell over the window's backdrop,
 * a flush 190-wide sidebar under the window's controls (the shell keeps their
 * room at its top), one content card 6/7/7 from the window's edges with
 * radius 10. The sidebar hides on a spring (response 0.215 s, damping
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
  // The shell keeps the controls' room before the strip and makes it the
  // window's drag region.
  return (
    <View
      testID="window-strip"
      style={{
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingInlineEnd: 6,
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

/** The page under the strip; hidden, the strip leaves the window's corner to it. */
function StripPage({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  const room = useWindowControlsRoom();
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        paddingTop: hidden ? Math.max(16, room.top - 6) : 16,
        gap: 12,
      }}
    >
      <Button testID="show-strip" onPress={onToggle}>
        {hidden ? 'Show tabs' : 'Hide tabs'}
      </Button>
      <Text>Hidden, the strip peeks from the top edge.</Text>
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
                content: <StripPage hidden={hidden} onToggle={() => setHidden(!hidden)} />,
              },
            ],
          }}
        />
      </BloomScope>
    </WindowBackdrop>
  );
}

/** Tabs across the top: the strip is the top bar, after the controls; the card starts right under it. */
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
    <PlainBackdrop>
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
    </PlainBackdrop>
  );
}

/**
 * Retained panels (`panelLayout.retain`): each page is an iframe that counts
 * its own loads. Rotating the panels, stacking the last two, showing fewer and
 * showing them again moves only geometry: every count stays at 1, and a
 * hidden page keeps its size so it shows again at once.
 */
export const RetainedPanels: Story = { render: () => <RetainedWindow /> };

const MESSAGES = [
  { id: 'a', title: 'Design review', body: 'The panes are the window’s title area.' },
  { id: 'b', title: 'Release notes', body: 'Every pane header moves the window.' },
  { id: 'c', title: 'Roadmap', body: 'The first one keeps the controls’ room.' },
  { id: 'd', title: 'Docs', body: 'Nothing below a header moves.' },
];

/** A pane: a Screen with its PageHeader, as an application's route renders it. */
function MailPane({ title, list }: { title: string; list?: boolean }) {
  return (
    <Screen
      header={
        <PageHeader
          title={title}
          presentation="bar"
          border="always"
          actions={
            list ? undefined : (
              <Button size="sm" appearance="plain" leadingIcon={RiAddLine}>
                Reply
              </Button>
            )
          }
        />
      }
    >
      <ScreenScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
        {list ? (
          MESSAGES.map((message) => (
            <BloomCard key={message.id}>
              <CardHeader>
                <CardTitle>{message.title}</CardTitle>
                <CardDescription>{message.body}</CardDescription>
              </CardHeader>
            </BloomCard>
          ))
        ) : (
          <Text variant="body-regular">
            Press a pane header’s empty part or its title to move the window, twice to zoom it. The
            buttons in it keep their presses.
          </Text>
        )}
      </ScreenScrollView>
    </Screen>
  );
}

/**
 * Panes and nothing else, as a mail application without a sidebar: no shell
 * header, no top bar. The shell hands the window's corner to its panels: they
 * fill the window, the first pane's header keeps the controls' room inside its
 * own bar, and every pane header along the window's top edge moves the window.
 * The frame and the content below the headers do not move.
 */
export const PanesAsTitleArea: Story = {
  render: () => (
    <StoryWindow width={1000} height={600}>
      <AppShell
        testID="window"
        panelLayout={{
          mode: 'split',
          gap: 8,
          panels: [
            { id: 'inbox', width: 340, content: <MailPane title="Inbox" list /> },
            { id: 'detail', content: <MailPane title="Design review" /> },
          ],
        }}
      />
    </StoryWindow>
  ),
};

/** The same panes in a deck: the first keeps the room, every header moves the window. */
export const DeckAsTitleArea: Story = {
  render: () => (
    <StoryWindow width={1000} height={600}>
      <AppShell
        testID="window"
        panelLayout={{
          mode: 'deck',
          gap: 8,
          panels: ['Inbox', 'Today', 'Later'].map((title, index) => ({
            id: title,
            width: 380,
            content: <MailPane title={title} list={index === 0} />,
          })),
        }}
      />
    </StoryWindow>
  ),
};

/**
 * A single Screen as the whole application, no shell: it is the window's
 * content, so it draws the controls in its corner and its header is the
 * window's title area.
 */
export const ScreenAsWindow: Story = {
  render: () => (
    <StoryWindow width={720} height={480}>
      <MailPane title="Notes" />
    </StoryWindow>
  ),
};
