/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { ComposerIconButton } from '../chat-composer/ComposerIconButton.web';
import type { BloomIconComponent } from '../icons/icon-component';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let coarse: boolean;
let media: MediaQueryList;
const originalMatchMedia = window.matchMedia;
const TestIcon: BloomIconComponent = () => null;

beforeEach(() => {
  coarse = false;
  media = new (class extends EventTarget {
    get matches() {
      return coarse;
    }
    media = '(pointer: coarse)';
    onchange: MediaQueryList['onchange'] = null;
    addListener() {}
    removeListener() {}
  })();
  window.matchMedia = () => media;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.matchMedia = originalMatchMedia;
});

function render(size: number, scope: 'xs' | 'sm' | 'md' | 'lg') {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light">
        <BloomScope size={scope}>
          <ComposerIconButton
            icon={TestIcon}
            accessibilityLabel="Attach"
            size={size}
            testID="composer-icon"
          />
        </BloomScope>
      </BloomThemeProvider>,
    ),
  );
  const button = container.querySelector<HTMLButtonElement>('[data-testid="composer-icon"]');
  if (!button) throw new Error('ComposerIconButton did not render');
  return button;
}

function pointer(isCoarse: boolean) {
  act(() => {
    coarse = isCoarse;
    media.dispatchEvent(new Event('change'));
  });
}

it.each(['xs', 'sm', 'md', 'lg'] as const)(
  'keeps its numeric visual size and reserves 44px for coarse pointers in %s scope',
  (scope) => {
    for (const size of [28, 32, 36]) {
      const button = render(size, scope);
      expect(button.style.width).toBe(`${size}px`);
      expect(button.style.height).toBe(`${size}px`);

      pointer(true);
      expect(container.querySelector('[data-testid="composer-icon"]')).toBe(button);
      expect(button.style.minWidth).toBe('44px');
      expect(button.style.minHeight).toBe('44px');

      pointer(false);
      expect(button.style.minWidth).toBe('0');
      expect(button.style.minHeight).toBe('0');
      expect(button.style.width).toBe(`${size}px`);
      act(() => root.render(null));
    }
  },
);
