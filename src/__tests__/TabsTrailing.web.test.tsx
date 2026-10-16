/** @jest-environment jsdom */
/**
 * `TabsTrigger trailing` in the DOM react-native-web produces: the trailing
 * button is a sibling of the `tab`, never inside it (a button in a button is
 * invalid markup, and its click would select the tab), and clicking it leaves
 * the selection alone.
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Button } from '../button';
import { Tabs, TabsTrigger } from '../tabs';
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

it('keeps the trailing button outside the tab, and its click off the selection', () => {
  const onValueChange = jest.fn();
  const onSettings = jest.fn();
  const error = jest.spyOn(console, 'error');
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Tabs value="table" onValueChange={onValueChange} variant="filled" label="Views">
          <TabsTrigger value="table" label="Table" />
          <TabsTrigger
            value="board"
            label="Board"
            trailing={
              <Button size="xs" appearance="plain" onPress={onSettings}>
                Settings
              </Button>
            }
          />
        </Tabs>
      </BloomThemeProvider>,
    ),
  );
  const tabs = [...container.querySelectorAll('[role="tab"]')] as HTMLElement[];
  expect(tabs.map((tab) => tab.textContent)).toEqual(['Table', 'Board']);
  const settings = [...container.querySelectorAll('[role="button"], button')].find(
    (node) => node.textContent === 'Settings',
  ) as HTMLElement;
  expect(settings).toBeDefined();
  expect(tabs[1]!.contains(settings)).toBe(false);
  expect(tabs[1]!.parentElement!.contains(settings)).toBe(true);
  act(() => settings.click());
  expect(onSettings).toHaveBeenCalledTimes(1);
  expect(onValueChange).not.toHaveBeenCalled();
  act(() => tabs[1]!.click());
  expect(onValueChange).toHaveBeenCalledWith('board');
  expect(error.mock.calls.flat().join(' ')).not.toMatch(
    /cannot be a descendant|cannot contain a nested/i,
  );
  error.mockRestore();
});
