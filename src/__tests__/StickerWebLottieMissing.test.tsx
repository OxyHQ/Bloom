/**
 * @jest-environment jsdom
 *
 * The WEB `Sticker` in an app WITHOUT `@lottiefiles/dotlottie-react`.
 *
 * Metro bundles a missing optional peer as a module that throws when loaded, so
 * the loader's `import()` rejects. That must look like every other failure: the
 * still, for good, and one dev warning naming the package. Its own file because
 * jest keeps one evaluation of a mocked module per test file.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated'),
  useReducedMotion: () => false,
}));

jest.mock('@lottiefiles/dotlottie-react', () => {
  throw new Error("Cannot find module '@lottiefiles/dotlottie-react'");
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Sticker, resetLottiePlayer } from '../sticker/index.web';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  resetLottiePlayer();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it('keeps the still and warns once when the web player is not installed', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

  for (const id of ['a', 'b']) {
    act(() => {
      root.render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <Sticker
            animation="https://cloud.oxy.invalid/s.json"
            fallback="https://cloud.oxy.invalid/s.webp"
            testID={id}
          />
        </BloomThemeProvider>,
      );
    });
    await act(async () => {
      for (let i = 0; i < 5; i += 1) await Promise.resolve();
    });

    expect(container.querySelector(`[data-testid="${id}-still"]`)).not.toBeNull();
    expect(container.querySelector(`[data-testid="${id}-animation"]`)).toBeNull();
  }

  const lottieWarnings = warn.mock.calls.filter(([message]) =>
    String(message).includes('@lottiefiles/dotlottie-react'),
  );
  expect(lottieWarnings).toHaveLength(1);
  warn.mockRestore();
});
