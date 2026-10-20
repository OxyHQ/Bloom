/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/index.web';
import { DropdownMenuItem } from '../dropdown-menu/index.web';
import { Popover, PopoverTrigger, PopoverContent } from '../popover/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

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
const advance = (ms = 500) => act(() => jest.advanceTimersByTime(ms));
function mount(children: React.ReactNode) {
  act(() => root.render(<BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>));
  advance();
}
function control() {
  return document.querySelector('[data-testid="current"]') as HTMLElement;
}
function anchor() {
  return control().parentElement?.parentElement as HTMLElement;
}
function pointer(
  target: HTMLElement,
  type: string,
  pointerType = 'mouse',
  relatedTarget: EventTarget | null = null,
) {
  const event = new MouseEvent(type, {
    bubbles: type !== 'pointerenter' && type !== 'pointerleave',
    relatedTarget,
    view: window,
  });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  act(() => target.dispatchEvent(event));
}
function key(target: HTMLElement, value: string) {
  act(() =>
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
    ),
  );
  advance();
}
function fixture({
  disabled = false,
  content = jest.fn((_state: { open: boolean }) => (
    <DropdownMenuItem href="#current" current>
      Current destination
    </DropdownMenuItem>
  )),
} = {}) {
  return (
    <Popover>
      <Breadcrumb overflow="collapse" testID="trail">
        <BreadcrumbItem
          href="#parent"
          hoverMenu={{ content: <DropdownMenuItem href="#other">Other parent</DropdownMenuItem> }}
        >
          Parent
        </BreadcrumbItem>
        <BreadcrumbItem
          current
          disabled={disabled}
          testID="current"
          trigger={<PopoverTrigger asChild />}
          hoverMenu={{ label: 'Related pages', content, openDelay: 400, closeDelay: 150 }}
        >
          Page
        </BreadcrumbItem>
      </Breadcrumb>
      <PopoverContent label="Rename">
        <input aria-label="Page name" />
      </PopoverContent>
    </Popover>
  );
}
it('uses delayed hover on the same primary control, with lazy state and one current link', () => {
  const content = jest.fn((_state: { open: boolean }) => (
    <DropdownMenuItem href="#current" current>
      {open ? 'Current destination' : 'Waiting'}
    </DropdownMenuItem>
  ));
  mount(fixture({ content }));
  expect(document.querySelectorAll('[data-testid="current"]')).toHaveLength(1);
  expect(content.mock.calls.every(([state]) => !state.open)).toBe(true);
  pointer(anchor(), 'pointerenter');
  advance(399);
  expect(document.querySelector('[role="menu"]')).toBeNull();
  advance(1);
  advance();
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  expect(content).toHaveBeenLastCalledWith({ open: true });
  const row = document.querySelector('[role="menuitem"]') as HTMLElement;
  expect(row.getAttribute('href')).toBe('#current');
  expect(row.getAttribute('aria-current')).toBe('page');
  expect(getComputedStyle(row).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});
it('holds pointer travel and menu focus, and Escape does not reopen it', () => {
  mount(fixture());
  pointer(anchor(), 'pointerenter');
  advance();
  const row = document.querySelector('[role="menuitem"]') as HTMLElement;
  pointer(anchor(), 'pointerleave');
  pointer(control(), 'pointerout', 'mouse', row);
  pointer(row, 'pointerover', 'mouse', control());
  advance(1000);
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  act(() =>
    control().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    ),
  );
  advance();
  expect(document.activeElement).toBe(row);
  pointer(row, 'pointerout', 'mouse', document.body);
  advance(1000);
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  key(row, 'Escape');
  advance(1000);
  expect(document.querySelector('[role="menu"]')).toBeNull();
  expect(document.activeElement).toBe(control());
  advance(1000);
  expect(document.querySelector('[role="menu"]')).toBeNull();
});
it.each([false, true])(
  'primary click cancels pending or open hover (%s) and opens only the edit popover',
  (opened) => {
    mount(fixture());
    pointer(anchor(), 'pointerenter');
    advance(opened ? 500 : 100);
    pointer(control(), 'pointerdown');
    act(() => control().click());
    advance(1000);
    advance();
    expect(document.querySelector('[aria-label="Page name"]')).not.toBeNull();
    expect(document.querySelector('[role="menu"]')).toBeNull();
  },
);
it('ArrowDown opens navigation while Enter retains the primary popover', () => {
  mount(fixture());
  act(() => control().focus());
  key(control(), 'ArrowDown');
  expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
  key(document.activeElement as HTMLElement, 'Escape');
  key(control(), 'Enter');
  act(() => control().click());
  advance();
  expect(document.querySelector('[aria-label="Page name"]')).not.toBeNull();
  expect(document.querySelector('[role="menu"]')).toBeNull();
  pointer(anchor(), 'pointerleave');
  pointer(anchor(), 'pointerenter');
  advance(1000);
  expect(document.querySelector('[role="menu"]')).toBeNull();
});
it('ignores disabled controls and touch hover', () => {
  mount(fixture({ disabled: true }));
  pointer(anchor(), 'pointerenter');
  advance(1000);
  expect(document.querySelector('[role="menu"]')).toBeNull();
  mount(fixture());
  pointer(anchor(), 'pointerenter', 'touch');
  advance(1000);
  expect(document.querySelector('[role="menu"]')).toBeNull();
});

it('does not mount hidden ancestor queries, and preserves their overflow navigation', () => {
  const ancestorContent = jest.fn(() => <DropdownMenuItem>Sibling</DropdownMenuItem>);
  mount(
    <Breadcrumb overflow="collapse" testID="collapsed">
      <BreadcrumbItem href="#ancestor" hoverMenu={{ content: ancestorContent }}>
        Ancestor
      </BreadcrumbItem>
      <BreadcrumbItem
        current
        hoverMenu={{ content: <DropdownMenuItem>Current sibling</DropdownMenuItem> }}
        testID="current"
      >
        Page
      </BreadcrumbItem>
    </Breadcrumb>,
  );
  expect(ancestorContent).not.toHaveBeenCalled();
  const overflow = document.querySelector('[data-testid="collapsed-overflow"]') as HTMLElement;
  act(() => overflow.click());
  advance();
  const link = document.querySelector('[role="menuitem"]') as HTMLAnchorElement;
  expect(link.getAttribute('href')).toBe('#ancestor');
  expect(ancestorContent).not.toHaveBeenCalled();
});
it('read-only current without a primary popup opens by press and arrows', () => {
  mount(
    <Breadcrumb>
      <BreadcrumbItem
        current
        testID="current"
        hoverMenu={{ content: <DropdownMenuItem href="#other">Other page</DropdownMenuItem> }}
      >
        Page
      </BreadcrumbItem>
    </Breadcrumb>,
  );
  act(() => control().click());
  advance();
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  key(control(), 'ArrowDown');
  expect(document.activeElement?.getAttribute('href')).toBe('#other');
});
it('preserves ordinary and modified ancestor link activation beside its hover menu', () => {
  const navigate = jest.fn();
  mount(
    <Breadcrumb>
      <BreadcrumbItem
        href="#ancestor"
        testID="current"
        onPress={navigate}
        hoverMenu={{ content: <DropdownMenuItem>Sibling</DropdownMenuItem> }}
      >
        Ancestor
      </BreadcrumbItem>
    </Breadcrumb>,
  );
  expect(control().tagName).toBe('A');
  const modified = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
  act(() => control().dispatchEvent(modified));
  expect(modified.defaultPrevented).toBe(false);
  expect(navigate).not.toHaveBeenCalled();
  act(() => control().click());
  expect(navigate).toHaveBeenCalledTimes(1);
  advance();
  expect(document.querySelector('[role="menu"]')).toBeNull();
});

it('touch hold opens related navigation and suppresses the primary release click', () => {
  mount(fixture());
  const down = new Event('pointerdown', { bubbles: true, cancelable: true });
  Object.assign(down, {
    button: 0,
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: 5,
    clientY: 5,
  });
  act(() => control().dispatchEvent(down));
  advance(450);
  advance();
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  const up = new Event('pointerup', { bubbles: true, cancelable: true });
  Object.assign(up, { pointerId: 1, pointerType: 'touch' });
  act(() => document.dispatchEvent(up));
  act(() =>
    control().dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
    ),
  );
  advance();
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  expect(document.querySelector('[aria-label="Page name"]')).toBeNull();
});
