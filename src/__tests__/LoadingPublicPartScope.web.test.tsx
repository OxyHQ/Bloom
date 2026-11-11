/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Loading } from '../loading/Loading.web';
import { SpinnerIcon } from '../loading/SpinnerIcon.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: Root;
function mount(ui: React.ReactElement) {
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false} mode="light">
        {ui}
      </BloomThemeProvider>,
    ),
  );
}
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

it('Loading defaults to md, follows the nearest web scope and explicit size wins', () => {
  mount(<Loading />);
  expect(host.querySelector('svg')?.parentElement?.style.width).toBe('24px');
  for (const [scope, expected] of [
    ['xs', '16px'],
    ['sm', '20px'],
    ['md', '24px'],
    ['lg', '44px'],
  ] as const) {
    mount(
      <BloomScope size={scope}>
        <Loading />
      </BloomScope>,
    );
    expect(host.querySelector('svg')?.parentElement?.style.width).toBe(expected);
  }
  mount(
    <BloomScope size="xs">
      <Loading size="lg" />
    </BloomScope>,
  );
  expect(host.querySelector('svg')?.parentElement?.style.width).toBe('44px');
});

it('numeric spinner art size ignores web BloomScope', () => {
  mount(
    <BloomScope size="lg">
      <SpinnerIcon size={31} />
    </BloomScope>,
  );
  expect(host.querySelector('svg')?.parentElement?.style.width).toBe('31px');
});
