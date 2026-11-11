/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomScope } from '../appearance';
import { CallControlButton, CallControls } from '../call-ui';
import { RiMicLine } from '../icons/remix/RiMicLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it.each([
  ['xs', '40px', '8px'],
  ['sm', '40px', '8px'],
  ['md', '48px', '12px'],
  ['lg', '56px', '16px'],
] as const)(
  'maps CallControls %s scope to its call-stage geometry on web',
  (size, buttonSize, gap) => {
    const dom = mount(
      <BloomScope size={size}>
        <CallControls testID="controls" onMutedChange={() => undefined} />
      </BloomScope>,
    );
    expect((dom.querySelector('[data-testid="controls"]') as HTMLElement).style.gap).toBe(gap);
    expect((dom.querySelector('[data-testid="controls-mute"]') as HTMLElement).style.width).toBe(
      buttonSize,
    );
  },
);

it('resolves standalone CallControlButton scope and explicit override in the web DOM', () => {
  const scoped = mount(
    <BloomScope size="xs">
      <CallControlButton icon={RiMicLine} label="Mute" testID="standalone" />
    </BloomScope>,
  );
  expect((scoped.querySelector('[data-testid="standalone"]') as HTMLElement).style.width).toBe(
    '40px',
  );

  const explicit = mount(
    <BloomScope size="lg">
      <CallControlButton icon={RiMicLine} label="Mute" size="md" testID="standalone" />
    </BloomScope>,
  );
  expect((explicit.querySelector('[data-testid="standalone"]') as HTMLElement).style.width).toBe(
    '48px',
  );
});

it('uses the full-stage default and lets an explicit group size override its scope in the DOM', () => {
  const defaults = mount(<CallControls testID="controls" onMutedChange={() => undefined} />);
  expect((defaults.querySelector('[data-testid="controls"]') as HTMLElement).style.gap).toBe(
    '16px',
  );
  expect((defaults.querySelector('[data-testid="controls-mute"]') as HTMLElement).style.width).toBe(
    '56px',
  );

  const explicit = mount(
    <BloomScope size="xs">
      <CallControls testID="controls" size="md" onMutedChange={() => undefined} />
    </BloomScope>,
  );
  expect((explicit.querySelector('[data-testid="controls"]') as HTMLElement).style.gap).toBe(
    '12px',
  );
  expect((explicit.querySelector('[data-testid="controls-mute"]') as HTMLElement).style.width).toBe(
    '48px',
  );
});

it('resolves a nested scope through a web wrapper', () => {
  const nested = mount(
    <BloomScope size="xs">
      <div>
        <BloomScope size="lg">
          <CallControls testID="controls" onMutedChange={() => undefined} />
        </BloomScope>
      </div>
    </BloomScope>,
  );
  expect((nested.querySelector('[data-testid="controls-mute"]') as HTMLElement).style.width).toBe(
    '56px',
  );
});
