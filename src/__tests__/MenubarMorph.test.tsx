/**
 * A menu bar's ONE menu surface on a desktop with platform popups (an OxyOS window or its shell):
 * moving to another menu while one is open changes the open popup into the next menu
 * (`menubar/viewport.tsx`). The platform's popup is never closed and opened again: it is
 * re-anchored (the morph's anchor moving from title to title) and resized (the stage) frame by
 * frame, on the menu motion, while the two menus' rows crossfade; at once with Reduce Motion.
 */
import type React from 'react';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { act, fireEvent, render, type RenderResult } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '../menubar/Menubar';
import { BloomProvider } from '../provider';
import type {
  PlatformKeyEvent,
  PlatformSurfaceAdapter,
  PopupSurfaceProps,
} from '../platform-surface/types';

let mockReducedMotion = false;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReducedMotion,
}));

/** Each title's frame in the bar, as the platform lays it out. */
const TITLES: Record<string, [number, number, number, number]> = {
  file: [10, 4, 40, 24],
  help: [120, 4, 48, 24],
};
/** The bar's border: where an absolutely placed child's `left: 0, top: 0` is. */
const BORDER = 1;

function desktop() {
  const mounts: string[] = [];
  const latest: { props: PopupSurfaceProps | null } = { props: null };
  const listeners = new Set<(event: PlatformKeyEvent) => boolean>();
  function Popup(props: PopupSurfaceProps) {
    latest.props = props;
    useEffect(() => {
      mounts.push('mount');
      return () => {
        mounts.push('unmount');
      };
    }, []);
    return <View testID="platform-popup">{props.children}</View>;
  }
  const adapter: PlatformSurfaceAdapter = {
    platform: 'test',
    capabilities: new Set(['popup-surface', 'pointer']),
    keyboard: {
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    PopupSurface: Popup,
  };
  const press = (key: string, modifiers?: Partial<PlatformKeyEvent>) =>
    act(() => {
      for (const listener of listeners) {
        listener({
          key,
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          ...modifiers,
        });
      }
    });
  return { adapter, mounts, latest, press };
}

/** Renders of File's content (a part of the declaration that draws: it mounts where the content
    is mounted, headless or open). */
const fileRenders = { count: 0 };
function FileProbe() {
  fileRenders.count += 1;
  return null;
}

function Bar({
  chosen,
  initialFocus,
  declareClosedMenus,
}: {
  chosen: (row: string) => void;
  initialFocus?: string;
  declareClosedMenus?: boolean;
}) {
  const [open, setOpen] = useState<string | undefined>(undefined);
  const [focus, setFocus] = useState<string | undefined>(initialFocus);
  return (
    <Menubar
      value={open}
      onValueChange={setOpen}
      focusValue={focus}
      onFocusValueChange={setFocus}
      declareClosedMenus={declareClosedMenus}
    >
      <MenubarMenu value="file">
        <MenubarTrigger testID="file">File</MenubarTrigger>
        <MenubarContent testID="file-menu" label="File">
          <FileProbe />
          <MenubarItem shortcut="Mod+N" onPress={() => chosen('New')}>
            New
          </MenubarItem>
          <MenubarItem onPress={() => chosen('Open')}>Open…</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="help">
        <MenubarTrigger testID="help">Help</MenubarTrigger>
        <MenubarContent testID="help-menu" label="Help">
          <MenubarItem onPress={() => chosen('Docs')}>Documentation</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

/** The morph's anchor: the bar's one absolutely placed box that no pointer or reader reaches. */
const isMorphAnchor = (node: ReactTestInstance) =>
  node.props.pointerEvents === 'none' &&
  node.props.importantForAccessibility === 'no-hide-descendants' &&
  node.props.accessible === false;

function open(chosen = jest.fn(), initialFocus?: string, declareClosedMenus?: boolean) {
  const platform = desktop();
  let screen: RenderResult | null = null;
  // Fabric's measurement, against the frames above: a title's frame in the bar, the anchor's at
  // its own `left`/`top` inside the bar's border.
  const createNodeMock = (element: React.ReactElement) => {
    const testID = (element.props as { testID?: string }).testID;
    return {
      testID,
      // The element's props, as the platform's view would carry them (whether it is flattened).
      hostProps: element.props as Record<string, unknown>,
      measureLayout(
        _relativeTo: unknown,
        onSuccess: (x: number, y: number, width: number, height: number) => void,
      ) {
        if (testID && TITLES[testID]) {
          const [x, y, width, height] = TITLES[testID];
          onSuccess(x, y, width, height);
          return;
        }
        const anchor = screen?.UNSAFE_root.findAll(isMorphAnchor)[0];
        const style = StyleSheet.flatten(anchor?.props.style) ?? {};
        onSuccess(
          Number(style.left ?? 0) + BORDER,
          Number(style.top ?? 0) + BORDER,
          Number(style.width ?? 0),
          Number(style.height ?? 0),
        );
      },
    };
  };
  screen = render(
    <BloomProvider mode="light" platform={platform.adapter}>
      <Bar chosen={chosen} initialFocus={initialFocus} declareClosedMenus={declareClosedMenus} />
    </BloomProvider>,
    { createNodeMock },
  );
  return { screen, platform, chosen };
}

/** The layer holding a row: the view the menu is laid out in (its `onLayout`). */
/** The row shown (the open menu's), else the one leaving. */
const rowOf = (screen: RenderResult, row: string) =>
  screen.queryByText(row) ?? screen.getByText(row, { includeHiddenElements: true });

function layerOf(screen: RenderResult, row: string): ReactTestInstance {
  let node: ReactTestInstance | null = rowOf(screen, row);
  while (node && typeof node.props.onLayout !== 'function') node = node.parent;
  if (!node) throw new Error(`no layer for ${row}`);
  return node;
}

/** The layer's wrapper, carrying its opacity and, leaving, its frozen size. */
function wrapperOf(screen: RenderResult, row: string) {
  let node: ReactTestInstance | null = rowOf(screen, row);
  while (node && typeof node.props.accessibilityElementsHidden !== 'boolean') node = node.parent;
  if (!node) throw new Error(`no wrapper for ${row}`);
  return node;
}

const opacityOf = (screen: RenderResult, row: string) =>
  Number(StyleSheet.flatten(wrapperOf(screen, row).props.style).opacity);

function laidOut(screen: RenderResult, row: string, width: number, height: number) {
  fireEvent(layerOf(screen, row), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height } },
  });
}

/** The stage: the row of layers inside the surface, sized explicitly while it changes. */
function stageOf(screen: RenderResult) {
  let node: ReactTestInstance | null = wrapperOf(
    screen,
    screen.queryByText('New') ? 'New' : 'Documentation',
  );
  // The layers' parent: the first view above the layer that clips (`overflow: hidden`).
  node = node?.parent ?? null;
  while (node && StyleSheet.flatten(node.props.style)?.overflow !== 'hidden') node = node.parent;
  return StyleSheet.flatten(node?.props.style) as { width?: number; height?: number };
}

function morphAnchor(screen: RenderResult) {
  const anchor = screen.UNSAFE_root.findAll(isMorphAnchor)[0];
  return StyleSheet.flatten(anchor?.props.style) as {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

const move = (screen: RenderResult, testID: string) =>
  fireEvent(screen.getByTestId(testID), 'pointerMove', { nativeEvent: { pointerType: 'mouse' } });

/** Animation frames, 16 ms apart, for `ms`. */
function frames(ms: number, each?: () => void) {
  for (let t = 0; t < ms; t += 16) {
    act(() => jest.advanceTimersByTime(16));
    each?.();
  }
}

// The display's frames, as a platform gives them (the test environment has none).
const frame = globalThis.requestAnimationFrame;
const cancelFrame = globalThis.cancelAnimationFrame;
beforeEach(() => {
  jest.useFakeTimers();
  mockReducedMotion = false;
  globalThis.requestAnimationFrame = (callback) =>
    setTimeout(() => callback(Date.now()), 16) as unknown as number;
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
});
afterEach(() => {
  jest.useRealTimers();
  globalThis.requestAnimationFrame = frame;
  globalThis.cancelAnimationFrame = cancelFrame;
});

describe("a menu bar's one popup changing from one menu into the next", () => {
  it('keeps the one platform popup, re-anchored and resized between the two menus, the rows crossfading', () => {
    const { screen, platform } = open();
    fireEvent.press(screen.getByText('File'));
    laidOut(screen, 'New', 264, 80);
    frames(48);
    expect(platform.mounts).toEqual(['mount']);
    expect(platform.latest.props?.testID).toBe('file-menu');
    // At rest the popup hangs from File's title itself.
    expect(platform.latest.props?.anchorRef).not.toBeNull();
    const fileTitle = platform.latest.props?.anchorRef;

    move(screen, 'help');
    // Help's menu is the open one at once: the popup is named and labelled for it, and its rows
    // are there, unseen until laid out; File's go on showing, out of reach.
    expect(platform.latest.props).toMatchObject({ testID: 'help-menu', label: 'Help' });
    expect(platform.mounts).toEqual(['mount']);
    expect(opacityOf(screen, 'Documentation')).toBe(0);
    expect(opacityOf(screen, 'New')).toBe(1);
    expect(screen.queryByText('New')).toBeNull();
    expect(screen.getByText('New', { includeHiddenElements: true })).toBeTruthy();
    expect(wrapperOf(screen, 'New').props.pointerEvents).toBe('none');
    // The popup holds File's size and place until Help's menu is laid out, hanging from the
    // morph's anchor over File's title.
    expect(platform.latest.props?.anchorRef).not.toBe(fileTitle);
    expect(stageOf(screen)).toMatchObject({ width: 264, height: 80 });
    expect(morphAnchor(screen)).toMatchObject({ left: 9, top: 3, width: 40, height: 24 });

    laidOut(screen, 'Documentation', 300, 40);
    const widths: number[] = [];
    const heights: number[] = [];
    const lefts: number[] = [];
    const fades: Array<[number, number]> = [];
    frames(200, () => {
      if (!screen.queryByText('New', { includeHiddenElements: true })) return;
      const stage = stageOf(screen);
      widths.push(stage.width as number);
      heights.push(stage.height as number);
      lefts.push(morphAnchor(screen).left);
      fades.push([opacityOf(screen, 'New'), opacityOf(screen, 'Documentation')]);
    });
    // Monotonic from File's rectangle to Help's, with frames between.
    expect(widths.length).toBeGreaterThan(4);
    const rising = (values: number[]) => values.every((v, i) => i === 0 || v >= values[i - 1]!);
    const falling = (values: number[]) => values.every((v, i) => i === 0 || v <= values[i - 1]!);
    expect(rising(widths)).toBe(true);
    expect(falling(heights)).toBe(true);
    expect(rising(lefts)).toBe(true);
    expect(widths.some((w) => w > 264 && w < 300)).toBe(true);
    expect(lefts.some((x) => x > 9 && x < 119)).toBe(true);
    // Each menu fades through the other.
    expect(falling(fades.map(([file]) => file))).toBe(true);
    expect(rising(fades.map(([, help]) => help))).toBe(true);
    expect(fades.some(([file, help]) => file > 0 && file < 1 && help > 0 && help < 1)).toBe(true);

    // At rest on Help's menu: File's rows gone, the popup sized by Help's menu and hanging from
    // Help's title itself, the one popup still.
    expect(screen.queryByText('New', { includeHiddenElements: true })).toBeNull();
    expect(screen.getByText('Documentation')).toBeTruthy();
    expect(stageOf(screen).width).toBeUndefined();
    expect(morphAnchor(screen)).toMatchObject({ left: 119, top: 3, width: 48, height: 24 });
    expect(platform.latest.props?.anchorRef).not.toBe(fileTitle);
    expect(platform.mounts).toEqual(['mount']);
  });

  it('closes as one popup, and opens again afresh, never eased from where it closed', () => {
    const { screen, platform } = open();
    fireEvent.press(screen.getByText('File'));
    laidOut(screen, 'New', 264, 80);
    move(screen, 'help');
    laidOut(screen, 'Documentation', 300, 40);
    frames(200);
    act(() => platform.latest.props?.onKey?.('Escape'));
    expect(platform.mounts).toEqual(['mount', 'unmount']);
    fireEvent.press(screen.getByText('File'));
    expect(opacityOf(screen, 'New')).toBe(1);
    expect(screen.queryByText('Documentation', { includeHiddenElements: true })).toBeNull();
    expect(stageOf(screen).width).toBeUndefined();
  });

  it('crossfades through its frames when its first frame comes late, its clock starting there', () => {
    const { screen } = open();
    fireEvent.press(screen.getByText('File'));
    laidOut(screen, 'New', 264, 80);
    frames(48);
    move(screen, 'help');
    // A loaded machine: the change renders, then no frame comes for 140 ms of its 150
    // (JavaScript preempted, the frame clock late). The crossfade begins at its first frame, as
    // Core Animation's begins as its transaction is shown: it is not over before it is drawn.
    const lateUntil = Date.now() + 140;
    globalThis.requestAnimationFrame = (callback) =>
      setTimeout(
        () => callback(Date.now()),
        Math.max(16, lateUntil - Date.now()),
      ) as unknown as number;
    laidOut(screen, 'Documentation', 300, 40);
    const both: number[] = [];
    frames(480, () => {
      if (!screen.queryByText('New', { includeHiddenElements: true })) return;
      if (opacityOf(screen, 'New') > 0 && opacityOf(screen, 'Documentation') > 0) {
        both.push(opacityOf(screen, 'New'));
      }
    });
    expect(both.length).toBeGreaterThan(4);
    expect(screen.queryByText('New', { includeHiddenElements: true })).toBeNull();
  });

  it('changes again from wherever it is, the menus it leaves fading from where they were', () => {
    const { screen } = open();
    fireEvent.press(screen.getByText('File'));
    laidOut(screen, 'New', 264, 80);
    move(screen, 'help');
    laidOut(screen, 'Documentation', 300, 40);
    frames(64);
    const halfway = stageOf(screen).width as number;
    const helpHalf = opacityOf(screen, 'Documentation');
    expect(halfway).toBeGreaterThan(264);
    expect(halfway).toBeLessThan(300);
    // Back onto File before the change ends: a fresh File layer; the popup holds where it is.
    move(screen, 'file');
    expect(stageOf(screen).width).toBe(halfway);
    expect(opacityOf(screen, 'Documentation')).toBe(helpHalf);
    // File's rows twice: the layer leaving (from the first change) and the fresh one, shown.
    expect(screen.getAllByText('New', { includeHiddenElements: true })).toHaveLength(2);
    expect(opacityOf(screen, 'New')).toBe(0);
    laidOut(screen, 'New', 264, 80);
    frames(240);
    expect(screen.queryByText('Documentation', { includeHiddenElements: true })).toBeNull();
    expect(screen.getAllByText('New', { includeHiddenElements: true })).toHaveLength(1);
    expect(stageOf(screen).width).toBeUndefined();
    expect(morphAnchor(screen)).toMatchObject({ left: 9, width: 40 });
  });

  it('with Reduce Motion changes at once, still one popup', () => {
    mockReducedMotion = true;
    const { screen, platform } = open();
    fireEvent.press(screen.getByText('File'));
    laidOut(screen, 'New', 264, 80);
    move(screen, 'help');
    expect(screen.queryByText('New', { includeHiddenElements: true })).toBeNull();
    expect(opacityOf(screen, 'Documentation')).toBe(1);
    expect(stageOf(screen).width).toBeUndefined();
    expect(platform.latest.props).toMatchObject({ testID: 'help-menu', label: 'Help' });
    expect(platform.mounts).toEqual(['mount']);
  });

  it('from the keys: → changes the popup into the next menu on its first row', () => {
    const { screen, platform, chosen } = open(jest.fn(), 'file');
    platform.press('ArrowDown');
    laidOut(screen, 'New', 264, 80);
    platform.press('ArrowRight');
    laidOut(screen, 'Documentation', 300, 40);
    frames(200);
    expect(platform.mounts).toEqual(['mount']);
    // The platform's keys reach the open menu, not the one it changed from.
    act(() => platform.latest.props?.onKey?.('Enter'));
    expect(chosen).toHaveBeenCalledTimes(1);
    expect(chosen).toHaveBeenCalledWith('Docs');
  });

  it("leaves the bar's declaration whole: a shortcut of the menu it is leaving runs once", () => {
    const { screen, platform, chosen } = open();
    fireEvent.press(screen.getByText('File'));
    laidOut(screen, 'New', 264, 80);
    move(screen, 'help');
    // Mid-change, File's rows still showing as they leave.
    expect(screen.getByText('New', { includeHiddenElements: true })).toBeTruthy();
    // Mod is the platform's command key: ⌘ on the test renderer's iOS.
    platform.press('n', { metaKey: true });
    expect(chosen).toHaveBeenCalledTimes(1);
    expect(chosen).toHaveBeenCalledWith('New');
  });

  it('moves the screen reader into the new menu once, never back into the old one', () => {
    const send = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(() => {});
    try {
      const { screen } = open();
      fireEvent.press(screen.getByText('File'));
      laidOut(screen, 'New', 264, 80);
      frames(64);
      const focusedLayers = () =>
        send.mock.calls
          .filter(([, type]) => type === 'focus')
          .map(([node]) => node)
          .filter((node) => node !== undefined && node !== null);
      const before = focusedLayers().length;
      move(screen, 'help');
      laidOut(screen, 'Documentation', 300, 40);
      frames(200);
      // One focus for Help's menu: none for the title File's menu closed under, none for File's.
      expect(focusedLayers().length).toBe(before + 1);
    } finally {
      send.mockRestore();
    }
  });
  // Fabric flattens a view of layout alone out of the platform's tree (no `collapsable={false}`, no
  // paint, no accessibility props of its own): focus sent to one lands nowhere, and the reader
  // stays where it was as the menu opens (OxyOS's desktop-accessibility scenario, Bloom 17.12.0).
  it("sends the screen reader's focus to a view the platform mounts, the open menu's", () => {
    const send = jest
      .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
      .mockImplementation(() => {});
    try {
      const { screen } = open();
      const targets = () =>
        send.mock.calls
          .filter(([, type]) => type === 'focus')
          .map(([node]) => (node as unknown as { hostProps: Record<string, unknown> }).hostProps);
      fireEvent.press(screen.getByText('File'));
      laidOut(screen, 'New', 264, 80);
      frames(64);
      move(screen, 'help');
      laidOut(screen, 'Documentation', 300, 40);
      frames(200);
      // File's menu as it opened, then Help's as the surface changed into it.
      expect(targets()).toHaveLength(2);
      for (const props of targets()) {
        expect(props.collapsable).toBe(false);
        expect(props.accessibilityElementsHidden).toBe(false);
      }
    } finally {
      send.mockRestore();
    }
  });
});

describe('a menu with no title measurement (a platform that cannot measure)', () => {
  it('still crossfades in the one popup', () => {
    const platform = desktop();
    const screen = render(
      <BloomProvider mode="light" platform={platform.adapter}>
        <Bar chosen={() => {}} />
      </BloomProvider>,
    );
    fireEvent.press(screen.getByText('File'));
    laidOut(screen, 'New', 264, 80);
    move(screen, 'help');
    laidOut(screen, 'Documentation', 300, 40);
    frames(200);
    expect(screen.queryByText('New', { includeHiddenElements: true })).toBeNull();
    expect(screen.getByText('Documentation')).toBeTruthy();
    expect(platform.mounts).toEqual(['mount']);
    expect(Text).toBeTruthy();
  });
});

describe('a bar that declares no closed menus (declareClosedMenus={false})', () => {
  beforeEach(() => {
    fileRenders.count = 0;
  });

  it('mounts nothing of a closed menu, where by default its content is mounted headless', () => {
    open();
    // By default File's content is declared while it is closed, so its shortcuts work.
    expect(fileRenders.count).toBeGreaterThan(0);
    fileRenders.count = 0;
    const { screen } = open(jest.fn(), undefined, false);
    expect(fileRenders.count).toBe(0);
    // Open, its content mounts as it draws.
    fireEvent.press(screen.getByText('File'));
    expect(fileRenders.count).toBeGreaterThan(0);
    expect(screen.getByText('New')).toBeTruthy();
  });

  it("runs a closed menu's shortcut only by default: its rows are not declared", () => {
    const declared = open();
    declared.platform.press('n', { metaKey: true });
    expect(declared.chosen).toHaveBeenCalledWith('New');
    const undeclared = open(jest.fn(), undefined, false);
    undeclared.platform.press('n', { metaKey: true });
    expect(undeclared.chosen).not.toHaveBeenCalled();
  });

  it('still changes its one popup from one menu into the next, the rows crossfading', () => {
    const { screen, platform } = open(jest.fn(), undefined, false);
    fireEvent.press(screen.getByText('File'));
    laidOut(screen, 'New', 264, 80);
    frames(48);
    move(screen, 'help');
    // File's rows go on showing as they leave, its content read as it is.
    expect(screen.getByText('New', { includeHiddenElements: true })).toBeTruthy();
    expect(opacityOf(screen, 'New')).toBe(1);
    laidOut(screen, 'Documentation', 300, 40);
    const fades: Array<[number, number]> = [];
    frames(200, () => {
      if (!screen.queryByText('New', { includeHiddenElements: true })) return;
      fades.push([opacityOf(screen, 'New'), opacityOf(screen, 'Documentation')]);
    });
    expect(fades.some(([file, help]) => file > 0 && file < 1 && help > 0 && help < 1)).toBe(true);
    expect(screen.queryByText('New', { includeHiddenElements: true })).toBeNull();
    expect(screen.getByText('Documentation')).toBeTruthy();
    expect(platform.mounts).toEqual(['mount']);
    // File closed again: nothing of it mounted.
    fileRenders.count = 0;
    move(screen, 'file');
    laidOut(screen, 'New', 264, 80);
    frames(200);
    move(screen, 'help');
    laidOut(screen, 'Documentation', 300, 40);
    frames(200);
    const settled = fileRenders.count;
    frames(200);
    expect(fileRenders.count).toBe(settled);
  });
});
