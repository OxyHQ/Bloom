/** @jest-environment jsdom */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Text } from 'react-native';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomScope } from '../appearance';
import { InputGroup, InputGroupAddon } from '../input-group';
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

const heights = { xs: '28px', sm: '32px', md: '36px', lg: '44px' } as const;
const insets = { xs: '0px', sm: '-2px', md: '-4px', lg: '-6px' } as const;

it.each(Object.entries(heights))(
  'resolves InputGroup %s geometry and addon inset in the DOM',
  (size, height) => {
    const dom = mount(
      <BloomScope size={size as keyof typeof heights}>
        <InputGroup testID="group">
          <InputGroupAddon noPadding testID="addon">
            <Text>https://</Text>
          </InputGroupAddon>
          <Text>field</Text>
        </InputGroup>
      </BloomScope>,
    );
    expect((dom.querySelector('[data-testid="group"]') as HTMLElement).style.height).toBe(height);
    expect((dom.querySelector('[data-testid="addon"]') as HTMLElement).style.marginLeft).toBe(
      insets[size as keyof typeof insets],
    );
  },
);

it('defaults to md and honors an explicit nested group size in the DOM', () => {
  const defaults = mount(
    <InputGroup testID="group">
      <InputGroupAddon noPadding testID="addon">
        <Text>https://</Text>
      </InputGroupAddon>
      <Text>field</Text>
    </InputGroup>,
  );
  expect((defaults.querySelector('[data-testid="group"]') as HTMLElement).style.height).toBe(
    '36px',
  );

  const explicit = mount(
    <BloomScope size="xs">
      <BloomScope size="lg">
        <InputGroup testID="group" size="sm">
          <InputGroupAddon noPadding testID="addon">
            <Text>https://</Text>
          </InputGroupAddon>
          <Text>field</Text>
        </InputGroup>
      </BloomScope>
    </BloomScope>,
  );
  expect((explicit.querySelector('[data-testid="group"]') as HTMLElement).style.height).toBe(
    '32px',
  );
  expect((explicit.querySelector('[data-testid="addon"]') as HTMLElement).style.marginLeft).toBe(
    '-2px',
  );
});
