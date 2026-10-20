/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { PageHeaderTitleInput } from '../page-header';
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
function render(props: Partial<React.ComponentProps<typeof PageHeaderTitleInput>> = {}) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PageHeaderTitleInput label="Title" value="Projects" {...props} />
      </BloomThemeProvider>,
    ),
  );
}
it('starts at one row and delegates wrapping and shrinking to CSS content sizing', () => {
  render();
  const input = container.querySelector('textarea')!;
  expect(input.rows).toBe(1);
  // jsdom does not serialize field-sizing yet; React still forwards the CSS property.
  expect((input.style as CSSStyleDeclaration & { fieldSizing?: string }).fieldSizing).toBe(
    'content',
  );
  expect(getComputedStyle(input).resize).toBe('none');
  expect(getComputedStyle(input).overflowY).toBe('hidden');
  expect(getComputedStyle(input).overflowX).toBe('hidden');
  expect(input.style.height).toBe('');
  render({ value: 'A long workspace heading\nwith another line\nand a third line' });
  expect(input.value).toContain('a third line');
  expect(input.rows).toBe(1);
  expect((input.style as CSSStyleDeclaration & { fieldSizing?: string }).fieldSizing).toBe(
    'content',
  );
  render({ value: 'Short' });
  expect(input.value).toBe('Short');
  expect(input.style.height).toBe('');
});
it('respects explicit bounds without changing the content sizing contract', () => {
  render({ style: { minHeight: 24, maxHeight: 120, lineHeight: 24, overflow: 'scroll' } });
  const input = container.querySelector('textarea')!;
  expect(getComputedStyle(input).minHeight).toBe('24px');
  expect(getComputedStyle(input).maxHeight).toBe('120px');
  expect(getComputedStyle(input).overflowY).toBe('scroll');
  expect((input.style as CSSStyleDeclaration & { fieldSizing?: string }).fieldSizing).toBe(
    'content',
  );
});
it('supports opting into an ordinary single-line input', () => {
  render({ multiline: false });
  expect(container.querySelector('textarea')).toBeNull();
  expect(container.querySelector('input')!.value).toBe('Projects');
});
