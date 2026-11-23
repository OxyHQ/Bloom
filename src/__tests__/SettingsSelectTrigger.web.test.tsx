/**
 * @jest-environment jsdom
 */

/**
 * The compact SettingsSelect trigger on the web draws the select size's own
 * field, as Bloom 22 drew it there (its size classes outranked the compact
 * style): at `md` 12px sides, 7px top and bottom, an 8px gap. Checked in Chrome
 * too: `scripts/no-nativewind/verify-web.mjs` on the `Components/SettingsSelect`
 * stories, Bloom 22's Storybook against this one, draws the same field.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { SettingsSelect } from '../settings-modal/SettingsSelect.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

it("draws the compact trigger as the size's own field: 12px sides, 7px top and bottom, an 8px gap", () => {
  act(() => {
    root.render(
      <BloomThemeProvider fonts={false}>
        <SettingsSelect
          label="Mode"
          value="a"
          onChange={() => {}}
          items={[{ value: 'a', label: 'A' }]}
        />
      </BloomThemeProvider>,
    );
  });
  const fields = Array.from(container.querySelectorAll('*')).filter((element) => {
    const style = getComputedStyle(element);
    return style.minHeight === '36px' && style.borderTopWidth === '1px';
  });
  expect(fields).toHaveLength(1);
  const style = getComputedStyle(fields[0] as Element);
  expect({
    left: style.paddingLeft,
    right: style.paddingRight,
    top: style.paddingTop,
    bottom: style.paddingBottom,
    gap: style.gap,
  }).toEqual({ left: '12px', right: '12px', top: '7px', bottom: '7px', gap: '8px' });
});
