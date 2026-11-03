/**
 * @jest-environment jsdom
 */

/**
 * The web half of `DescribedByHint.test.tsx`: the web keeps `aria-describedby`
 * and reads the described texts itself, so nothing is joined into a hint there.
 * The hook returns the caller's hint untouched (`Button`'s web fork uses it as
 * `title`, react-native-web drops it elsewhere) and a field's control carries
 * the id list as the attribute, through the real react-native-web.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Field } from '../field';
import { TextField, TextFieldInput } from '../text-field';
import { Text } from '../typography';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useDescribedByHint } from '../hooks/use-described-by-hint';

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

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

it("returns the caller's hint untouched: the web reads aria-describedby itself", () => {
  let resolved: string | undefined = 'unset';
  function Probe() {
    resolved = useDescribedByHint({ describedBy: 'd', hint: 'Own hint', name: 'Name' });
    return null;
  }
  mount(
    <>
      <Text nativeID="d">Described</Text>
      <Probe />
    </>,
  );
  expect(resolved).toBe('Own hint');
});

it('a field control carries the id list as the attribute, and no hint text', () => {
  mount(
    <Field label="Password" description="At least 8 characters">
      <TextField>
        <TextFieldInput />
      </TextField>
    </Field>,
  );
  const input = container.querySelector('input') as HTMLInputElement;
  const describedBy = input.getAttribute('aria-describedby') as string;
  expect(document.getElementById(describedBy)?.textContent).toBe('At least 8 characters');
  expect(input.getAttribute('title')).toBeNull();
  expect(input.getAttribute('aria-description')).toBeNull();
});
