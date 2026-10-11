/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
// The assertions read the field box; icon artwork is unrelated.
jest.mock('../icons/remix/RiSearchLine', () => ({ RiSearchLine: () => null }));
jest.mock('../icons/remix/RiCloseLine', () => ({ RiCloseLine: () => null }));

import { FIELD_BOX_CSS, horizontalPadding } from '../text-field/FieldBox';
import { TEXT_FIELD_ADDON_PADDING, TEXT_FIELD_GEOMETRY } from '../text-field/shared';
import { TextField, TextFieldInput } from '../text-field';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

/**
 * The field box puts its resting styles in an `@layer base` rule read through
 * custom properties, each falling back to `initial` when unset. If that rule
 * declares BOTH `padding-left` and `padding-inline-start`, the later one wins
 * for the same side, so the unset logical pair zeroed every TextField's
 * `paddingHorizontal` on web (7.17.0 to 7.33.0: a Search magnifier flush
 * against the pill's edge). jsdom does not run that cascade, so the structural
 * test below is what pins it; the browser symptom is measured in the PR.
 */
const declared = (css: string) =>
  [...css.matchAll(/([a-z-]+):var\(--bloom-field-/g)].map((m) => m[1] ?? '');

it('declares each side of the horizontal padding through one family only', () => {
  const props = declared(FIELD_BOX_CSS);
  expect(props.length).toBeGreaterThan(5);
  const physical = props.filter((p) => p === 'padding-left' || p === 'padding-right');
  const logical = props.filter((p) => p.startsWith('padding-inline'));
  expect(logical).toEqual(['padding-inline-start', 'padding-inline-end']);
  expect(physical).toEqual([]);
});

it('folds physical padding into the logical pair by direction, logical winning', () => {
  expect(horizontalPadding({ paddingLeft: 4, paddingRight: 8 }, 'ltr')).toEqual({
    paddingInlineStart: 4,
    paddingInlineEnd: 8,
  });
  expect(horizontalPadding({ paddingLeft: 4, paddingRight: 8 }, 'rtl')).toEqual({
    paddingInlineStart: 8,
    paddingInlineEnd: 4,
  });
  expect(
    horizontalPadding({ paddingLeft: 4, paddingInlineStart: 12, paddingRight: 8 }, 'ltr'),
  ).toEqual({ paddingInlineStart: 12, paddingInlineEnd: 8 });
  expect(horizontalPadding({}, 'ltr')).toEqual({
    paddingInlineStart: undefined,
    paddingInlineEnd: undefined,
  });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
let direction: string;
beforeEach(() => {
  direction = document.documentElement.dir;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.dir = direction;
});

const fieldBox = () => {
  const box = container.querySelector('input')?.closest('[data-bloom-field-box]');
  if (!(box instanceof HTMLElement)) throw new Error('no field box around the input');
  return box;
};
const variable = (el: HTMLElement, name: string) =>
  el.style.getPropertyValue(`--bloom-field-${name}`);

it.each(['ltr', 'rtl'])('hands a plain field its side padding in %s', (dir) => {
  document.documentElement.dir = dir;
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <TextField>
          <TextFieldInput label="Name" />
        </TextField>
      </BloomThemeProvider>,
    ),
  );
  const box = fieldBox();
  const inset = `${TEXT_FIELD_GEOMETRY.md.paddingHorizontal}px`;
  expect(variable(box, 'padding-inline-start')).toBe(inset);
  expect(variable(box, 'padding-inline-end')).toBe(inset);
});

it.each([
  ['ltr', 'paddingLeft', 'paddingRight'],
  ['rtl', 'paddingRight', 'paddingLeft'],
] as const)('keeps the addon padding on its physical side in %s', (dir, start, end) => {
  document.documentElement.dir = dir;
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <TextField leadingAddon={<span>+34</span>}>
          <TextFieldInput label="Phone" />
        </TextField>
      </BloomThemeProvider>,
    ),
  );
  const box = fieldBox();
  const padding = TEXT_FIELD_ADDON_PADDING.md;
  expect(variable(box, 'padding-inline-start')).toBe(`${padding[start]}px`);
  expect(variable(box, 'padding-inline-end')).toBe(`${padding[end]}px`);
});
