/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
// jsdom has no measured document viewport. Supply the browser viewport only;
// the real RNW panel, portal and ScrollArea still render and handle events.
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native-web'),
  useWindowDimensions: () => ({ width: 1024, height: 768, scale: 1, fontScale: 1 }),
}));
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PopoverItem } from '../popover';
import { Item } from '../item';
import { Field } from '../field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectItemText,
} from '../select/index.web';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '../dropdown-menu/index.web';
import { resolveMenuDensity } from '../floating/use-menu-density';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
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
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {children}
      </BloomThemeProvider>,
    ),
  );
  for (let i = 0; i < 6; i++) act(() => jest.advanceTimersByTime(50));
}
function node(id: string) {
  return document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
}

it('uses normal md menu typography and lets mixed-popover actions inherit the app scope', () => {
  const press = jest.fn();
  mount(
    <>
      <PopoverItem title="Normal" testID="normal" onPress={press} />
      <BloomScope size="xs">
        <PopoverItem title="Small" testID="small" disabled onPress={press} />
      </BloomScope>
    </>,
  );
  expect(getComputedStyle(node('normal').querySelector('[dir="auto"]')!).fontSize).toBe('14px');
  expect(getComputedStyle(node('small').querySelector('[dir="auto"]')!).fontSize).toBe('12px');
  expect(node('normal').getAttribute('role')).toBe('button');
  act(() => node('normal').click());
  act(() => node('small').click());
  expect(press).toHaveBeenCalledTimes(1);
});
it('inherits scope through the portal, accepts a surface override, and owns exactly one scroller', () => {
  mount(
    <BloomScope size="lg">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger label="Actions">
          <Text>Actions</Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent size="xs" testID="menu">
          <DropdownMenuItem testID="action">Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BloomScope>,
  );
  expect(getComputedStyle(node('action').querySelector('[dir="auto"]')!).fontSize).toBe('12px');
  expect(node('menu').querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  expect(Number.parseFloat(getComputedStyle(node('menu')).maxHeight)).toBeLessThanOrEqual(
    window.innerHeight - 16,
  );
  expect(node('menu').className).toContain('bloom-floating-surface');
});
it('inherits the application size through a portal without a local size override', () => {
  mount(
    <BloomScope size="lg">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger label="Actions">
          <Text>Actions</Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent maxHeight={180} testID="inherited-menu">
          <DropdownMenuItem testID="inherited-action">Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BloomScope>,
  );
  expect(getComputedStyle(node('inherited-action').querySelector('[dir="auto"]')!).fontSize).toBe(
    '16px',
  );
  expect(getComputedStyle(node('inherited-menu')).maxHeight).toBe('180px');
});
it('makes Item respect scope and explicit size while preserving explicit legacy density and style', () => {
  mount(
    <BloomScope size="xs">
      <Item title="Inherited" testID="inherited" />
      <Item title="Explicit" testID="explicit" size="lg" />
      <Item title="Legacy" testID="legacy" density="comfortable" />
      <Item title="Styled" testID="styled" style={{ minHeight: 60 }} />
    </BloomScope>,
  );
  expect(getComputedStyle(node('inherited')).minHeight).toBe('28px');
  expect(getComputedStyle(node('explicit')).minHeight).toBe('44px');
  expect(getComputedStyle(node('legacy')).minHeight).toBe('44px');
  expect(getComputedStyle(node('styled')).minHeight).toBe('60px');
});
it('keeps a 44px touch target at every inherited menu size', () => {
  for (const size of ['xs', 'sm', 'md', 'lg'] as const)
    expect(resolveMenuDensity(size, true).height).toBe(44);
  expect(
    ['xs', 'sm', 'md', 'lg'].map(
      (size) => resolveMenuDensity(size as 'xs' | 'sm' | 'md' | 'lg', false).height,
    ),
  ).toEqual([24, 26, 28, 32]);
});

it('supports all four inherited Select trigger sizes and explicit overrides within Field', () => {
  mount(
    <>
      {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
        <BloomScope key={size} size={size}>
          <Select>
            <SelectTrigger testID={`select-${size}`} label={size}>
              <SelectValue placeholder={size} />
            </SelectTrigger>
          </Select>
        </BloomScope>
      ))}
      <BloomScope size="lg">
        <Field disabled error="Choose an available value">
          <Select size="xs">
            <SelectTrigger testID="select-override" label="Override">
              <SelectValue placeholder="Override" />
            </SelectTrigger>
          </Select>
        </Field>
      </BloomScope>
    </>,
  );
  for (const [size, font] of [
    ['xs', 12],
    ['sm', 13],
    ['md', 14],
    ['lg', 16],
  ] as const) {
    expect(getComputedStyle(node(`select-${size}`).querySelector('[dir="auto"]')!).fontSize).toBe(
      `${font}px`,
    );
  }
  expect(getComputedStyle(node('select-override').querySelector('[dir="auto"]')!).fontSize).toBe(
    '12px',
  );
  const disabled = node('select-override').querySelector('[aria-haspopup]')!;
  expect(disabled.getAttribute('aria-disabled')).toBe('true');
  expect(disabled.getAttribute('aria-invalid')).toBe('true');
});
it('keeps Select to one listbox scroller after the shared floating viewport change', () => {
  mount(
    <BloomScope size="md">
      <Select>
        <SelectTrigger testID="list-trigger" label="Choose">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent
          items={[{ value: 'one', label: 'One' }]}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </Select>
    </BloomScope>,
  );
  act(() => node('list-trigger').querySelector<HTMLElement>('[aria-haspopup]')!.click());
  for (let i = 0; i < 6; i++) act(() => jest.advanceTimersByTime(50));
  expect(document.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  expect(document.querySelector('[role="option"]')?.textContent).toBe('One');
});
