/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomScope } from '../appearance';
import { Portal } from '../portal/Portal.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  Select,
  SelectContent,
  SelectField,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectSeparator,
  SelectItemText,
  SelectScrollDownButton,
  SelectScrollProvider,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
} from '../select/index.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const OPTION_GROUP_LABEL = 'Options';

function must<T>(value: T | null | undefined, label: string): T {
  if (value == null) throw new Error(`Missing ${label}`);
  return value;
}

function SelectSubject({
  outerScope,
  scope,
  explicit,
  portalled = false,
}: {
  outerScope?: 'xs' | 'sm' | 'md' | 'lg';
  scope?: 'xs' | 'sm' | 'md' | 'lg';
  explicit?: 'xs' | 'sm' | 'md' | 'lg';
  portalled?: boolean;
}) {
  const select = (
    <Select size={explicit}>
      <SelectTrigger label="Choose" testID="trigger">
        <SelectValue placeholder="Choose" />
        <SelectIcon />
      </SelectTrigger>
    </Select>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {outerScope ? (
        <BloomScope size={outerScope}>
          {scope ? (
            <BloomScope size={scope}>{portalled ? <Portal>{select}</Portal> : select}</BloomScope>
          ) : portalled ? (
            <Portal>{select}</Portal>
          ) : (
            select
          )}
        </BloomScope>
      ) : scope ? (
        <BloomScope size={scope}>{portalled ? <Portal>{select}</Portal> : select}</BloomScope>
      ) : portalled ? (
        <Portal>{select}</Portal>
      ) : (
        select
      )}
    </BloomThemeProvider>
  );
}

it.each([
  { name: 'unscoped default', expected: 36 },
  { name: 'nearest xs through wrappers', scope: 'xs', expected: 28 },
  { name: 'nearest sm', scope: 'sm', expected: 32 },
  { name: 'nearest md', scope: 'md', expected: 36 },
  { name: 'nearest lg', scope: 'lg', expected: 44 },
  { name: 'nested lg over xs', outerScope: 'xs', scope: 'lg', expected: 44 },
  { name: 'actual portal with wrappers', scope: 'sm', portalled: true, expected: 32 },
  { name: 'explicit lg overrides xs', scope: 'xs', explicit: 'lg', expected: 44 },
] as const)(
  '$name resolves Select trigger size in the web DOM',
  ({ outerScope, scope, explicit, portalled, expected }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          <SelectSubject
            outerScope={outerScope}
            scope={scope}
            explicit={explicit}
            portalled={portalled}
          />,
        ),
      );
      const field = document.body.querySelector<HTMLElement>(
        '[data-testid="trigger"] [data-bloom-select-field]',
      );
      expect(field?.style.minHeight).toBe(`${expected}px`);
      const value = field?.querySelector<HTMLElement>('[dir="auto"]');
      const fontSize = expected === 28 ? 12 : expected === 32 ? 13 : expected === 44 ? 16 : 14;
      expect(value && getComputedStyle(value).fontSize).toBe(`${fontSize}px`);
      const iconSize = expected === 28 ? 14 : expected === 32 ? 16 : expected === 44 ? 20 : 18;
      expect(field?.querySelector('svg')?.getAttribute('width')).toBe(`${iconSize}`);
    } finally {
      act(() => root.unmount());
      host.remove();
      document.getElementById('bloom-portal-root')?.remove();
    }
  },
);

it('resolves SelectContent density independently from trigger size through its portal', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const contentRoot = createRoot(host);
  try {
    act(() =>
      contentRoot.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <Select size="lg" value="one">
              <SelectTrigger label="Choose" testID="independent-trigger">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent
                size="sm"
                items={[{ value: 'one', label: 'One' }]}
                renderItem={(item) => (
                  <>
                    <SelectGroup>
                      <SelectLabel>{OPTION_GROUP_LABEL}</SelectLabel>
                    </SelectGroup>
                    <SelectItem value={item.value} label={item.label}>
                      <SelectItemIndicator />
                      <SelectItemText>{item.label}</SelectItemText>
                    </SelectItem>
                    <SelectSeparator />
                  </>
                )}
              />
            </Select>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    const trigger = must(
      document.querySelector<HTMLElement>('[data-testid="independent-trigger"] [aria-haspopup]'),
      'Select trigger',
    );
    act(() => trigger.click());
    for (let i = 0; i < 6; i++) act(() => jest.advanceTimersByTime(50));
    const option = must(document.querySelector<HTMLElement>('[role="option"]'), 'Select option');
    expect(option.getAttribute('class')).toContain('min-h-[26px]');
    expect(
      getComputedStyle(must(option.querySelector('[dir="auto"]'), 'option text')).fontSize,
    ).toBe('13px');
    expect(
      getComputedStyle(must(document.querySelector('[role="group"] [dir="auto"]'), 'group label'))
        .fontSize,
    ).toBe('12px');
    expect(document.querySelector('[role="group"]')?.getAttribute('class')).toContain('gap-[2px]');
    expect(
      Array.from(document.querySelectorAll<HTMLElement>('*')).some((element) =>
        element.className.includes('my-[2px]'),
      ),
    ).toBe(true);
    expect(
      Array.from(option.querySelectorAll<HTMLElement>('*')).some(
        (element) => element.style.width === '18px',
      ),
    ).toBe(true);
    const triggerValue = document.querySelector<HTMLElement>(
      '[data-testid="independent-trigger"] [dir="auto"]',
    );
    expect(getComputedStyle(must(triggerValue, 'trigger value')).fontSize).toBe('16px');
  } finally {
    act(() => contentRoot.unmount());
    host.remove();
    document.getElementById('bloom-portal-root')?.remove();
  }
});

it('keeps custom Select scroll affordances fixed under compact and large scopes in web DOM', () => {
  const draw = (size: 'xs' | 'lg') => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const scrollRoot = createRoot(host);
    act(() =>
      scrollRoot.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size={size}>
            <SelectScrollProvider
              value={{ canScrollUp: true, canScrollDown: true, scrollBy: () => {} }}
            >
              <SelectScrollUpButton />
              <SelectScrollDownButton />
            </SelectScrollProvider>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    const buttons = Array.from(host.querySelectorAll<HTMLElement>('[role="button"]'));
    const result = buttons.map((button) => ({
      className: button.getAttribute('class'),
      icon: button.querySelector('svg')?.getAttribute('width'),
    }));
    act(() => scrollRoot.unmount());
    host.remove();
    return result;
  };
  expect(draw('xs')).toEqual([
    { className: expect.any(String), icon: '16' },
    { className: expect.any(String), icon: '16' },
  ]);
  expect(draw('lg')).toEqual(draw('xs'));
});

it('delegates SelectField size to the Select trigger in the web DOM', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const fieldRoot = createRoot(host);
  try {
    act(() =>
      fieldRoot.render(
        <BloomThemeProvider fonts={false}>
          <SelectField
            label="Mode"
            placeholder="Choose"
            size="xs"
            testID="field-trigger"
            items={[{ value: 'light', label: 'Light' }]}
          />
        </BloomThemeProvider>,
      ),
    );
    const field = must(
      document.body.querySelector<HTMLElement>(
        '[data-testid="field-trigger"] [data-bloom-select-field]',
      ),
      'SelectField trigger',
    );
    expect(field.style.minHeight).toBe('28px');
    expect(
      getComputedStyle(must(field.querySelector('[dir="auto"]'), 'SelectField value')).fontSize,
    ).toBe('12px');
  } finally {
    act(() => fieldRoot.unmount());
    host.remove();
    document.getElementById('bloom-portal-root')?.remove();
  }
});
