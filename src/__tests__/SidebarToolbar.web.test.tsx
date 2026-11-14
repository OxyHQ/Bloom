/**
 * @jest-environment jsdom
 *
 * The toolbar's row in a real document, through react-native-web: its slots are one flex row
 * shared in equal parts, and the closed search covers exactly the first, for any number of
 * actions. A three-column grid here once put Alia's "+" (its only action) in the middle column,
 * under the half-width search.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Text } from 'react-native';
import { SidebarToolbar } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TOOLS = ['store', 'new'];

let root: Root;
let host: HTMLDivElement;

function mount(count: number, open = false) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" fonts={false}>
        <SidebarToolbar
          testID="tools"
          search={{ open, onOpenChange: () => {}, value: '', onValueChange: () => {} }}
          actions={TOOLS.slice(0, count).map((tool) => <Text key={tool}>{tool}</Text>)}
        />
      </BloomThemeProvider>,
    ),
  );
  const get = (id: string) => host.querySelector(`[data-testid="${id}"]`) as HTMLElement;
  return { row: get('tools-slots'), search: get('tools-search') };
}

/** `css` as the document keeps it (jsdom writes `calc()` its own way). */
function normal(css: string) {
  const probe = document.createElement('div');
  probe.style.width = css;
  return probe.style.width;
}

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

it.each([
  [0, '100%'],
  [1, 'calc((100% - 8px) / 2)'],
  [2, 'calc((100% - 16px) / 3)'],
])('with %i actions the closed search is the first of the equal slots (%s)', (count, width) => {
  const { row, search } = mount(count);
  expect(row.className).not.toMatch(/grid/);
  const slots = Array.from(row.children) as HTMLElement[];
  expect(slots).toHaveLength(count + 1);
  for (const slot of slots) expect(slot.style.flexGrow).toBe('1');
  expect(search.style.width).toBe(normal(width));
});

it('opens across every slot', () => {
  expect(mount(1, true).search.style.width).toBe('100%');
});
