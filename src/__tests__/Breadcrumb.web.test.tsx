/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native-web'),
  useWindowDimensions: () => ({ width: 1024, height: 768, scale: 1, fontScale: 1 }),
}));
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/index.web';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../dropdown-menu/index.web';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../context-menu/index.web';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from '../menubar/index.web';
import { collapsedAncestorCount } from '../breadcrumb/shared';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});
function mount(children: React.ReactNode) {
  act(() => root.render(<BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>));
  for (let i = 0; i < 6; i++) act(() => jest.advanceTimersByTime(50));
}
function node(id: string): HTMLElement {
  const found = document.querySelector(`[data-testid="${id}"]`);
  if (!(found instanceof HTMLElement)) throw Error(`Missing ${id}`);
  return found;
}
function click(element: HTMLElement, options: MouseEventInit = {}) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...options });
  act(() => element.dispatchEvent(event));
  return event;
}

it.each([
  ['xs', 24, 12],
  ['sm', 26, 13],
  ['md', 28, 14],
  ['lg', 32, 16],
] as const)(
  'inherits %s through the trail and permits an explicit override',
  (size, height, font) => {
    mount(
      <BloomScope size={size}>
        <Breadcrumb>
          <BreadcrumbItem href="#home" testID="item">
            Home
          </BreadcrumbItem>
          <BreadcrumbItem current>Page</BreadcrumbItem>
        </Breadcrumb>
      </BloomScope>,
    );
    expect(getComputedStyle(node('item')).height).toBe(`${height}px`);
    expect(getComputedStyle(node('item')).fontSize).toBe(`${font}px`);
    mount(
      <BloomScope size={size}>
        <Breadcrumb size="md">
          <BreadcrumbItem href="#home" testID="item">
            Home
          </BreadcrumbItem>
        </Breadcrumb>
      </BloomScope>,
    );
    expect(getComputedStyle(node('item')).height).toBe('28px');
  },
);

it('uses a real link and intercepts only an ordinary router activation', () => {
  const navigate = jest.fn();
  mount(
    <Breadcrumb>
      <BreadcrumbItem href="#home" onPress={navigate} testID="link">
        Home
      </BreadcrumbItem>
    </Breadcrumb>,
  );
  expect(node('link').tagName).toBe('A');
  expect(node('link').getAttribute('href')).toBe('#home');
  for (const options of [
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
  ]) {
    expect(click(node('link'), options).defaultPrevented).toBe(false);
  }
  expect(navigate).not.toHaveBeenCalled();
  expect(click(node('link')).defaultPrevented).toBe(true);
  expect(navigate).toHaveBeenCalledTimes(1);
});

it('renders destination-less labels as static text rather than empty buttons', () => {
  mount(
    <Breadcrumb>
      <BreadcrumbItem testID="static">Section</BreadcrumbItem>
      <BreadcrumbItem current testID="current">
        Page
      </BreadcrumbItem>
    </Breadcrumb>,
  );
  expect(node('static').getAttribute('role')).toBe('listitem');
  expect(node('static').querySelector('button,a')).toBeNull();
  expect(node('current').getAttribute('aria-current')).toBe('page');
});

it('keeps current visible before measurement and reveals hidden ancestor links from the shared menu', () => {
  const navigate = jest.fn();
  mount(
    <Breadcrumb overflow="collapse" testID="trail">
      <BreadcrumbItem href="#ancestor" onPress={navigate}>
        Ancestor
      </BreadcrumbItem>
      <BreadcrumbItem current testID="current">
        Long current page
      </BreadcrumbItem>
    </Breadcrumb>,
  );
  expect(node('current').textContent).toBe('Long current page');
  expect(node('current').getAttribute('aria-current')).toBe('page');
  click(node('trail-overflow'));
  for (let i = 0; i < 6; i++) act(() => jest.advanceTimersByTime(50));
  const link = document.querySelector('[role="menuitem"]');
  expect(link?.tagName).toBe('A');
  expect(link?.getAttribute('href')).toBe('#ancestor');
  if (!(link instanceof HTMLElement)) throw Error('Missing ancestor link');
  click(link, { metaKey: true });
  expect(navigate).not.toHaveBeenCalled();
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  click(link);
  expect(navigate).toHaveBeenCalledTimes(1);
});

it.each(['dropdown', 'context', 'menubar'] as const)(
  'shares link and disabled behavior in %s menu rows',
  (family) => {
    const navigate = jest.fn();
    const rows =
      family === 'dropdown' ? (
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger label="Menu">Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem href="#destination" onPress={navigate} keepOpen testID="link">
              Destination
            </DropdownMenuItem>
            <DropdownMenuItem href="#blocked" disabled testID="disabled">
              Blocked
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : family === 'menubar' ? (
        <Menubar defaultValue="main">
          <MenubarMenu value="main">
            <MenubarTrigger>Menu</MenubarTrigger>
            <MenubarContent>
              <MenubarItem href="#destination" onPress={navigate} keepOpen testID="link">
                Destination
              </MenubarItem>
              <MenubarItem href="#blocked" disabled testID="disabled">
                Blocked
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      ) : (
        <ContextMenu>
          <ContextMenuTrigger testID="context-trigger">Menu</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem href="#destination" onPress={navigate} keepOpen testID="link">
              Destination
            </ContextMenuItem>
            <ContextMenuItem href="#blocked" disabled testID="disabled">
              Blocked
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    mount(rows);
    if (family === 'context') {
      act(() =>
        node('context-trigger').dispatchEvent(
          new MouseEvent('contextmenu', { bubbles: true, clientX: 30, clientY: 30 }),
        ),
      );
      for (let i = 0; i < 6; i++) act(() => jest.advanceTimersByTime(50));
    }
    expect(node('link').tagName).toBe('A');
    expect(node('link').getAttribute('role')).toBe('menuitem');
    expect(node('disabled').getAttribute('href')).toBeNull();
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }])
      expect(click(node('link'), options).defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(click(node('link')).defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
    act(() => node('link').focus());
    for (const key of ['Enter', ' ']) {
      act(() => {
        const down = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        node('link').dispatchEvent(down);
        // jsdom does not perform the browser's native Enter activation of anchors.
        if (key === 'Enter' && !down.defaultPrevented) node('link').click();
      });
      act(() =>
        node('link').dispatchEvent(
          new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }),
        ),
      );
    }
    expect(navigate).toHaveBeenCalledTimes(3);
  },
);

it('fits ancestors by measured width while reserving current-page space', () => {
  expect(collapsedAncestorCount([70, 90, 100], 300, 28, 20)).toBe(0);
  expect(collapsedAncestorCount([70, 90, 100], 260, 28, 20)).toBe(1);
  expect(collapsedAncestorCount([70, 90, 100], 111, 28, 20)).toBe(2);
  expect(collapsedAncestorCount([1000, 1000, 1000], 111, 28, 20)).toBe(2);
  expect(collapsedAncestorCount([0, 0, 0], 0, 28, 20)).toBe(2);
  expect(collapsedAncestorCount([1000], 60, 28, 20)).toBe(0);
});

it('opens the hidden ancestors with the keyboard and returns focus on escape', () => {
  mount(
    <Breadcrumb overflow="collapse" testID="trail">
      <BreadcrumbItem href="#home">Home</BreadcrumbItem>
      <BreadcrumbItem href="#parent">Parent</BreadcrumbItem>
      <BreadcrumbItem current>Current</BreadcrumbItem>
    </Breadcrumb>,
  );
  act(() => node('trail-overflow').focus());
  act(() =>
    node('trail-overflow').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    ),
  );
  for (let i = 0; i < 8; i++) act(() => jest.advanceTimersByTime(50));
  expect(document.activeElement?.getAttribute('href')).toBe('#home');
  act(() =>
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    ),
  );
  expect(document.activeElement?.getAttribute('href')).toBe('#parent');
  act(() =>
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    ),
  );
  act(() =>
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'Escape', bubbles: true, cancelable: true }),
    ),
  );
  for (let i = 0; i < 8; i++) act(() => jest.advanceTimersByTime(50));
  expect(document.activeElement).toBe(node('trail-overflow'));
});

it('updates mounted breadcrumb targets for touch without changing the app scale', () => {
  const previous = window.matchMedia;
  let coarse = false;
  const query: MediaQueryList = new (class extends EventTarget {
    get matches() {
      return coarse;
    }
    media = '(pointer: coarse)';
    onchange: MediaQueryList['onchange'] = null;
    addListener() {}
    removeListener() {}
  })();
  window.matchMedia = () => query;
  try {
    mount(
      <Breadcrumb>
        <BreadcrumbItem href="#home" testID="item">
          Home
        </BreadcrumbItem>
      </Breadcrumb>,
    );
    expect(getComputedStyle(node('item')).height).toBe('28px');
    act(() => {
      coarse = true;
      query.dispatchEvent(new Event('change'));
    });
    expect(getComputedStyle(node('item')).height).toBe('44px');
    expect(getComputedStyle(node('item')).fontSize).toBe('14px');
  } finally {
    window.matchMedia = previous;
  }
});

it('falls back to scrolling for opaque children without mounting a second interactive subtree', () => {
  const effect = jest.fn();
  function CustomLabel() {
    React.useEffect(effect, []);
    return <input aria-label="Custom" />;
  }
  mount(
    <Breadcrumb overflow="collapse" testID="trail">
      <BreadcrumbItem>
        <CustomLabel />
      </BreadcrumbItem>
      <BreadcrumbItem current>Current</BreadcrumbItem>
    </Breadcrumb>,
  );
  expect(effect).toHaveBeenCalledTimes(1);
  expect(document.querySelectorAll('input')).toHaveLength(1);
  expect(document.querySelector('[data-testid="trail-overflow"]')).toBeNull();
  expect(document.querySelector('[data-testid="trail-measure-0"]')).toBeNull();
});

it('mirrors the default separator exactly once in an RTL landmark', () => {
  document.documentElement.dir = 'rtl';
  try {
    mount(
      <Breadcrumb testID="rtl">
        <BreadcrumbItem href="#home">Home</BreadcrumbItem>
        <BreadcrumbItem current>Current</BreadcrumbItem>
      </Breadcrumb>,
    );
    expect(node('rtl').dir).toBe('rtl');
    const svg = node('rtl').querySelector('svg')!;
    expect(getComputedStyle(svg).transform).not.toContain('scaleX(-1)');
    expect(getComputedStyle(svg.parentElement!).transform).toContain('scaleX(-1)');
  } finally {
    document.documentElement.dir = '';
  }
});
