/**
 * @jest-environment jsdom
 */

/**
 * WEB: display text names the ONE display family and leaves the cut to the
 * browser's font matching (`@font-face` at 400 and 700). Native's per-cut
 * family names (`fonts/display-face.ts`) never reach the DOM.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { H1, Text, Title } from '..';

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

const rendered = () =>
  `${container.innerHTML}\n${Array.from(document.querySelectorAll('style'))
    .map((sheet) => sheet.textContent)
    .join('\n')}`;

it('sets bold display text in var(--bloom-font-display), never a per-cut family', () => {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Text variant="display-1-bold">Display</Text>
        <H1>Heading</H1>
        <Title>Title</Title>
      </BloomThemeProvider>,
    ),
  );
  for (const label of ['Display', 'Heading', 'Title']) {
    const node = Array.from(container.querySelectorAll('*')).find(
      (el) => el.textContent === label && el.children.length === 0,
    ) as HTMLElement;
    expect(getComputedStyle(node).fontFamily).toBe('var(--bloom-font-display)');
  }
  expect(rendered()).not.toContain('BlomusModernus-Bold');
});
