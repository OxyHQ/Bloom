/**
 * @jest-environment jsdom
 *
 * Switching `scroll` on a MOUNTED `AppShell` lays the page out exactly as a
 * fresh mount in the new mode does.
 *
 * Apps pick the mode per route — `scroll={isMap ? 'fixed' : 'page'}` — so the
 * shell re-renders between modes far more often than it mounts in one. The
 * regions whose styles depend on the mode keep their DOM node across that
 * re-render, so what lands is React DOM's DIFF of the two inline styles, not
 * either style: a key the new style drops is cleared with `style[key] = ''`,
 * and only keys whose VALUE changed are written. Clearing a `flex` shorthand
 * clears `flex-grow`/`flex-shrink`/`flex-basis` with it, and a longhand that
 * kept its value is never written back — the reading column lost its flex
 * entirely and pushed the sidebar off-screen. A fresh mount never shows it,
 * which is why every comparison here is against one.
 *
 * Rendered through react-native-web into a real document: the failure exists
 * only in the inline `style` React DOM leaves on the node.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

let viewportWidth = 1440;
jest.mock('react-native', () => {
  // A getter, so `Dimensions` re-reads it on the `resize` event below.
  Object.defineProperty(document.documentElement, 'clientWidth', {
    get: () => viewportWidth,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  });
  return jest.requireActual('react-native-web');
});

import { Text, View } from 'react-native';

import { AppShell } from '../app-shell/index.web';
import type { AppShellProps } from '../app-shell/types';

type Scroll = NonNullable<AppShellProps['scroll']>;
import { RiHomeLine } from '../icons/remix';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];
const SCROLLS: Scroll[] = ['document', 'page', 'fixed', 'container', 'auto', 'external'];

/** The shapes apps ship, each with every slot whose placement follows the mode. */
const SHAPES: Record<string, Partial<AppShellProps>> = {
  // The shape that broke: a centred reading panel, aligned with its nav, plus
  // an aside and a phone bottom bar.
  'feed, panel, reveal': {
    variant: 'feed',
    panel: true,
    drawer: 'reveal',
    header: null,
    navigationAlign: 'content',
    contentWidth: 1800,
    gutter: 8,
    aside: <View style={{ height: 40 }} />,
    asideFrom: 'lg',
    asideCollapse: 'hidden',
    bottomBar: <Text>Tabs</Text>,
  },
  feed: { variant: 'feed', title: 'Feed', aside: <View style={{ height: 40 }} /> },
  'feed, panel, top bar': {
    variant: 'feed',
    panel: true,
    title: 'Feed',
    topBar: <Text>Top</Text>,
    topBarVisibility: 'always',
    aside: <View style={{ height: 40 }} />,
    floatingAction: <Text>Add</Text>,
  },
  dashboard: {
    variant: 'dashboard',
    title: 'Home',
    bottomBar: <Text>Tabs</Text>,
    aside: <View style={{ height: 40 }} />,
  },
  'dashboard, reveal': { variant: 'dashboard', drawer: 'reveal', title: 'Home' },
  focus: { variant: 'focus', title: 'Compose' },
  split: { variant: 'split', list: <Text>List</Text>, info: <Text>Info</Text> },
  canvas: { variant: 'canvas', floatingAction: <Text>Add</Text> },
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function setViewport(width: number) {
  viewportWidth = width;
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

function render(shape: Partial<AppShellProps>, scroll: Scroll) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AppShell testID="shell" sidebar={{ items: NAV }} {...shape} scroll={scroll}>
          <Text>Page</Text>
        </AppShell>
      </BloomThemeProvider>,
    );
  });
}

/** The shorthands whose longhands the comparison reads one by one. */
const LONGHANDS: Record<string, string[]> = {
  flex: ['flex-grow', 'flex-shrink', 'flex-basis'],
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
};

/**
 * The style React DOM left on a node, as the longhands it RESOLVES to, sorted.
 * Declaration order is an artefact of the diff (a key written later lands
 * later) and changes nothing; what a shorthand did or did not leave behind on
 * its longhands is the whole bug, so shorthands are read through.
 */
function inlineStyle(node: Element): string {
  const style = (node as HTMLElement).style;
  if (!style) return '';
  const names = new Set<string>();
  for (let index = 0; index < style.length; index += 1) {
    const name = style.item(index);
    for (const longhand of LONGHANDS[name] ?? [name]) names.add(longhand);
  }
  return [...names]
    .sort()
    .map((name) => `${name}: ${style.getPropertyValue(name)}`)
    .join('; ');
}

/**
 * The laid-out tree: every element's tag, testID, classes and resolved inline
 * style. Generated ids are left out — they number per mount.
 */
function layout(node: Element = container): string {
  const own = [
    node.tagName,
    node.getAttribute('data-testid') ?? '',
    node.getAttribute('class') ?? '',
    inlineStyle(node),
  ].join(' | ');
  return [own, ...Array.from(node.children, (child) => layout(child))].join('\n');
}

/** A new root on the same node: what a page load in that mode renders. */
function remount() {
  act(() => root.unmount());
  root = createRoot(container);
}

describe.each([
  ['desktop', 1440],
  ['phone', 390],
])('%s', (_viewport, width) => {
  beforeEach(() => setViewport(width));

  it.each(Object.entries(SHAPES))('%s: every switch lays out as a fresh mount', (_name, shape) => {
    for (const from of SCROLLS) {
      for (const to of SCROLLS) {
        if (from === to) continue;
        render(shape, from);
        render(shape, to);
        const switched = layout();
        remount();
        render(shape, to);
        const fresh = layout();
        remount();
        // The label names the transition in the diff when it fails.
        expect({ transition: `${from} → ${to}`, layout: switched }).toEqual({
          transition: `${from} → ${to}`,
          layout: fresh,
        });
      }
    }
  });
});

/**
 * The same diff runs whenever a slot comes or goes on a mounted shell — a route
 * that brings its own floating action, say — and changes what the page must
 * reserve under it, switching some regions between a `padding` shorthand and
 * its longhands. That one is safe by construction (react-native-web expands
 * `padding`, `margin`, `inset` and `overflow` to longhands before React DOM
 * sees them; `flex` is the shorthand it passes through), and this pins it.
 */
describe.each([
  ['desktop', 1440],
  ['phone', 390],
])('%s: a slot that comes and goes lays out as a fresh mount', (_viewport, width) => {
  beforeEach(() => setViewport(width));

  it.each(Object.entries(SHAPES))('%s', (_name, shape) => {
    const withAction = { ...shape, floatingAction: <Text>Add</Text> };
    const without = { ...shape, floatingAction: undefined };
    for (const scroll of SCROLLS) {
      for (const [from, to] of [
        [without, withAction],
        [withAction, without],
      ] as const) {
        render(from, scroll);
        render(to, scroll);
        const switched = layout();
        remount();
        render(to, scroll);
        const fresh = layout();
        remount();
        const transition = `${scroll}: floating action ${to.floatingAction ? 'added' : 'removed'}`;
        expect({ transition, layout: switched }).toEqual({ transition, layout: fresh });
      }
    }
  });
});

it.each([
  ['fixed', 'page'],
  ['fixed', 'document'],
] as const)(
  'the reported switch, %s → %s (map route → feed route): the reading row keeps its computed flex',
  (from, to) => {
    setViewport(1280);
    const shape = SHAPES['feed, panel, reveal'] as Partial<AppShellProps>;
    // The row the nav and the reading column share: the content's parent.
    const flexOfRow = () => {
      const row = container.querySelector('[data-testid="shell-content"]')?.parentElement;
      if (!row) throw new Error('no reading row');
      const { flexGrow, flexShrink, flexBasis } = getComputedStyle(row);
      return { flexGrow, flexShrink, flexBasis };
    };
    render(shape, to);
    const fresh = flexOfRow();
    remount();
    render(shape, from);
    render(shape, to);
    // With its flex cleared the row took its content's width and pushed the
    // sidebar off the start edge; it must still shrink into what the nav leaves.
    expect(flexOfRow()).toEqual(fresh);
    // The reading group: the 1800 column, the 8 gap and the 320 aside.
    expect(fresh).toEqual({ flexGrow: '0', flexShrink: '1', flexBasis: '2128px' });
  },
);
