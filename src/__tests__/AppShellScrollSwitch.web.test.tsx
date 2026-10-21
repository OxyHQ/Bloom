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
import { act, useState } from 'react';
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

// The reveal page is animated; a string mock drops both its styles and testID.
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { Text, View } from 'react-native';

import { AppShell, AppShellPanel, AppShellPanels } from '../app-shell/index.web';
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
  'feed, panels, reveal': {
    variant: 'feed',
    panels: true,
    children: (
      <AppShellPanel>
        <Text>Page</Text>
      </AppShellPanel>
    ),
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
  'feed, panels, top bar': {
    variant: 'feed',
    panels: true,
    children: (
      <AppShellPanel header={<Text>Header</Text>}>
        <Text>Page</Text>
      </AppShellPanel>
    ),
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
  'panels, two side by side': {
    variant: 'feed',
    panels: true,
    header: null,
    navigationAlign: 'content',
    contentWidth: 1800,
    gutter: 8,
    sidebar: { items: NAV, surface: 'plain' },
    children: (
      <AppShellPanels collapseBelow={900}>
        <AppShellPanel id="results" width={560} minWidth={360} resizable>
          <Text>Results</Text>
        </AppShellPanel>
        <AppShellPanel id="map" minWidth={320}>
          <Text>Map</Text>
        </AppShellPanel>
      </AppShellPanels>
    ),
  },
  'dashboard, reveal, panels': {
    variant: 'dashboard',
    drawer: 'reveal',
    panels: true,
    header: null,
    framedFrom: 'md',
    gutter: 12,
    contentMaxWidth: 'none',
    children: (
      <AppShellPanels appearance="joined">
        <AppShellPanel id="list" width={380}>
          <Text>List</Text>
        </AppShellPanel>
        <AppShellPanel id="message">
          <Text>Message</Text>
        </AppShellPanel>
      </AppShellPanels>
    ),
  },
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
          {shape.children ?? <Text>Page</Text>}
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
    const shape = SHAPES['feed, panels, reveal'] as Partial<AppShellProps>;
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

/**
 * The routes are NOT remounted by a `scroll` switch: the shell's tree around
 * its children is the same node in `document`, `page` and `fixed`, and the
 * panels inside only read the new region. (A `container` shell scrolls in a
 * `ScrollView`, a different element, and is outside this promise.)
 */
describe.each([
  ['desktop', 1440],
  ['phone', 390],
])('%s: a scroll switch keeps the routes mounted', (_viewport, width) => {
  beforeEach(() => setViewport(width));

  it.each(['feed, panels, reveal', 'panels, two side by side', 'dashboard, reveal, panels'])(
    '%s',
    (name) => {
      let mounts = 0;
      function Route() {
        const [id] = useState(() => {
          mounts += 1;
          return mounts;
        });
        return <Text>{`route ${id}`}</Text>;
      }
      const shape = { ...SHAPES[name], children: <Route /> } as Partial<AppShellProps>;
      const withRoute: Partial<AppShellProps> = {
        ...shape,
        children:
          name === 'feed, panels, reveal' ? (
            <AppShellPanel>
              <Route />
            </AppShellPanel>
          ) : (
            <AppShellPanels>
              <AppShellPanel id="a" width={400}>
                <Route />
              </AppShellPanel>
              <AppShellPanel id="b">
                <Text>B</Text>
              </AppShellPanel>
            </AppShellPanels>
          ),
      };
      for (const scroll of ['page', 'fixed', 'document', 'fixed', 'page'] as Scroll[])
        render(withRoute, scroll);
      expect(mounts).toBe(1);
    },
  );
});

it('keeps navigation and the primary panel mounted across document split and bounded deck routes', () => {
  setViewport(1440);
  let mounts = 0;
  function Page() {
    const [id] = useState(() => ++mounts);
    return <Text testID="retained-page">{id}</Text>;
  }
  const shape: Partial<AppShellProps> = {
    variant: 'feed',
    navigationAlign: 'content',
    gutter: 8,
    sidebar: { items: NAV, surface: 'plain' },
    panelLayout: {
      flow: 'document',
      mode: 'split',
      panels: [
        { id: 'main', width: 620, content: <Page /> },
        { id: 'context', width: 350 },
      ],
    },
  };
  render(shape, 'document');
  const navigation = container.querySelector('[data-testid="shell-navigation"]');
  const page = container.querySelector('[data-testid="retained-page"]');
  render(
    { ...shape, panelLayout: { ...shape.panelLayout!, mode: 'deck', flow: 'bounded' } },
    'fixed',
  );
  expect(container.querySelector('[data-testid="shell-navigation"]')).toBe(navigation);
  expect(container.querySelector('[data-testid="retained-page"]')).toBe(page);
  render(shape, 'document');
  expect(container.querySelector('[data-testid="shell-navigation"]')).toBe(navigation);
  expect(mounts).toBe(1);
});

it('bounds every retained reveal ancestor with long navigation, and releases document flow', () => {
  setViewport(1440);
  const shape: Partial<AppShellProps> = {
    ...SHAPES['dashboard, reveal, panels'],
    sidebar: {
      items: Array.from({ length: 40 }, (_, index) => ({
        key: `folder-${index}`,
        label: `Folder ${index}`,
        icon: RiHomeLine,
      })),
    },
  };
  let retained: Element | null = null;
  for (const scroll of ['fixed', 'document', 'container', 'fixed'] as const) {
    render(shape, scroll);
    const page = container.querySelector('[data-testid="shell-reveal-page"]');
    if (!page) throw new Error(`Missing reveal host in ${scroll}`);
    if (retained) expect(page).toBe(retained);
    retained = page;
    const navigation = container.querySelector('[data-testid="shell-navigation"]');
    let ancestor = navigation?.parentElement;
    const hosts: HTMLElement[] = [];
    while (ancestor && ancestor.dataset.testid !== 'shell') {
      hosts.push(ancestor);
      ancestor = ancestor.parentElement;
    }
    expect(hosts.length).toBeGreaterThanOrEqual(4);
    for (const host of hosts) {
      const computed = getComputedStyle(host);
      if (scroll !== 'document') {
        if (host.classList.contains('flex-1')) {
          expect(host.classList.contains('min-h-0')).toBe(true);
          continue;
        }
        expect(computed.flexGrow).toBe('1');
        expect(computed.flexShrink).toBe('1');
        expect(['0px', '0%']).toContain(computed.flexBasis);
        expect(computed.minHeight).toBe('0px');
      } else {
        expect(computed.overflow).not.toBe('hidden');
      }
    }
  }
});
