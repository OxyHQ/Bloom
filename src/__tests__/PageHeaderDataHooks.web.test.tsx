/** @jest-environment jsdom */
/**
 * The header's own `data-*` hooks all land on its root. They were three
 * `dataHook` spreads, each a whole `dataSet` prop, so only the last
 * (presentation) survived: `data-bloom-page-header-density="compact"` never
 * reached the DOM and the stylesheet's compact 12px inset never applied on the
 * web, while native drew it.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { PageHeader } from '../page-header';
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

function header(props: Partial<React.ComponentProps<typeof PageHeader>>) {
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <PageHeader testID="header" title="Inbox" {...props} />
      </BloomThemeProvider>,
    ),
  );
  return container.querySelector('[data-testid="header"]') as HTMLElement;
}

it('carries the header, density and presentation hooks together', () => {
  const node = header({ density: 'compact', presentation: 'bar' });
  expect(node.getAttribute('data-bloom-page-header')).toBe('');
  expect(node.getAttribute('data-bloom-page-header-density')).toBe('compact');
  expect(node.getAttribute('data-bloom-page-header-presentation')).toBe('bar');
});

it("so the stylesheet's compact and navigation rules find their bar", () => {
  for (const props of [{ density: 'compact' as const }, { presentation: 'navigation' as const }]) {
    const node = header(props);
    const bar = node.querySelector(':scope > [data-bloom-page-header-bar]');
    expect(bar).not.toBeNull();
    expect(
      node.matches(
        '[data-bloom-page-header-density="compact"], [data-bloom-page-header-presentation="navigation"]',
      ),
    ).toBe(true);
  }
  expect(header({}).getAttribute('data-bloom-page-header-density')).toBe('default');
});
