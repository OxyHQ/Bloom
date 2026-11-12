/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Text } from 'react-native';
import { BloomScope } from '../appearance';
import { BottomSheet } from '../bottom-sheet/BottomSheet.web';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Sheet() {
  return (
    <BottomSheet
      open
      showHandle={false}
      scrollable={false}
      footer={
        <Button testID="sheet-footer-action">
          <Text>Footer</Text>
        </Button>
      }
      headerOverlay={
        <Button testID="sheet-header-action" size="lg">
          <Text>Header</Text>
        </Button>
      }
    >
      <Button testID="sheet-action">
        <Text>Save</Text>
      </Button>
    </BottomSheet>
  );
}

function expectSheetActions(height: string) {
  for (const id of ['sheet-action', 'sheet-footer-action']) {
    const button = document.querySelector(`[data-testid="${id}"]`);
    if (!button) throw new Error(`Missing BottomSheet action: ${id}`);
    expect(getComputedStyle(button).height).toBe(height);
  }
  const header = document.querySelector('[data-testid="sheet-header-action"]');
  if (!header) throw new Error('Missing BottomSheet header action');
  expect(getComputedStyle(header).height).toBe('44px');
}

it.each([
  [undefined, '36px'],
  ['xs', '24px'],
  ['sm', '32px'],
  ['md', '36px'],
  ['lg', '44px'],
] as const)('preserves sheet slots for %s scope on web', (size, height) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          {size ? (
            <BloomScope size={size}>
              <Sheet />
            </BloomScope>
          ) : (
            <Sheet />
          )}
        </BloomThemeProvider>,
      ),
    );
    expectSheetActions(height);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('preserves the nearest nested scope for sheet slots on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <BloomScope size="lg">
              <Sheet />
            </BloomScope>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    expectSheetActions('44px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
