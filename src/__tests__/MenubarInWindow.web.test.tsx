/**
 * @jest-environment jsdom
 */

/**
 * WEB: without the `menu-bar` capability (OxyOS ADR 0021, decision 2) a
 * `Menubar` draws itself in the page exactly as it did before the capability
 * existed, against the DOM react-native-web really produces.
 *
 * The snapshots were recorded on the commit before the capability, from the
 * same declaration, closed and with each menu open (the anchored panel, in its
 * portal). Anything the bar's headless registration of its items drew would
 * show up here.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import * as Parts from '../menubar/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { declaration } from './support/menubar-declaration';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        {ui}
      </BloomThemeProvider>,
    );
  });
  for (let i = 0; i < 6; i++) {
    act(() => {
      jest.advanceTimersByTime(50);
    });
  }
}

/** The page as markup, with React's per-root `useId` values made comparable. */
const markup = () => document.body.innerHTML.replace(/[_-]r[0-9a-z]+[_-]/g, '-r-');

describe('Menubar without the menu-bar capability (web)', () => {
  it.each([
    ['closed', undefined],
    ['with File open', 'file'],
    ['with Edit open', 'edit'],
    ['with View open', 'view'],
  ])('draws in the page as before, %s', (_name, open) => {
    mount(declaration(Parts, {}, {}, { defaultValue: open }));
    expect(markup()).toMatchSnapshot();
  });
});
