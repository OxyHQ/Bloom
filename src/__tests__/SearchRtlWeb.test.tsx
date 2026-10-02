/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
// The assertions exercise RNW layout; icon artwork is unrelated.
jest.mock('../icons/remix/RiSearchLine', () => ({ RiSearchLine: () => null }));
jest.mock('../icons/remix/RiCloseLine', () => ({ RiCloseLine: () => null }));

import { Search } from '../search';
import { TextField, TextFieldInput } from '../text-field';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
let direction: string;
beforeEach(() => {
  direction = document.documentElement.dir;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.dir = direction;
});

it.each(['ltr', 'rtl'])(
  'reserves clear space on the trailing edge in %s, even for a Latin query',
  (dir) => {
    document.documentElement.dir = dir;
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <Search value="Security" onClearText={jest.fn()} />
        </BloomThemeProvider>,
      ),
    );
    const input = container.querySelector('input')!;
    const style = getComputedStyle(input);
    expect(style.paddingLeft).toBe(dir === 'rtl' ? '24px' : '4px');
    expect(style.paddingRight).toBe(dir === 'rtl' ? '4px' : '24px');
    const clear = container.querySelector(
      '[data-testid="searchTextInputClearBtn"]',
    )!;
    const position = getComputedStyle(clear.parentElement!);
    expect(dir === 'rtl' ? position.left : position.right).toBe('0px');
  },
);

it('still lets consumers override physical padding longhands', () => {
  document.documentElement.dir = 'ltr';
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <TextField>
          <TextFieldInput
            label="Custom"
            style={{ paddingLeft: 11, paddingRight: 29 }}
          />
        </TextField>
      </BloomThemeProvider>,
    ),
  );
  const style = getComputedStyle(container.querySelector('input')!);
  expect(style.paddingLeft).toBe('11px');
  expect(style.paddingRight).toBe('29px');
});

it.each(['ltr', 'rtl'])(
  'keeps the leading addon gap next to the input in %s',
  (dir) => {
    document.documentElement.dir = dir;
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <TextField leadingAddon={<span data-testid="prefix">+34</span>}>
            <TextFieldInput label="Phone" />
          </TextField>
        </BloomThemeProvider>,
      ),
    );
    const slot = container.querySelector(
      '[data-testid="prefix"]',
    )!.parentElement!;
    const style = getComputedStyle(slot);
    expect(dir === 'rtl' ? style.marginLeft : style.marginRight).toBe('2px');
    expect(dir === 'rtl' ? style.marginRight : style.marginLeft).not.toBe(
      '2px',
    );
  },
);
