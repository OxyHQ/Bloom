/**
 * @jest-environment jsdom
 *
 * The core group's two web-only strings, read off the DOM react-native-web
 * emits: a swipe row's dismiss target (mounted only while a pane is open) and
 * a menu's flyout submenu (the web presentation; native renders inline).
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Gesture } from 'react-native-gesture-handler';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Text } from 'react-native';

import { MenuSurfaceProvider } from '../floating/context';
import { createFlyoutMenuSub } from '../floating/menu-sub-flyout';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { LocaleProvider } from '../locale';
import { PortalOutlet, PortalProvider } from '../portal';
import { SwipeRow } from '../swipe-row';
import { SWIPE_ACTION_WIDTH } from '../swipe-row/constants';
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
  jest.restoreAllMocks();
});

function mount(ui: React.ReactElement, locale = 'es') {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LocaleProvider locale={locale}>
          <PortalProvider>
            {ui}
            <PortalOutlet />
          </PortalProvider>
        </LocaleProvider>
      </BloomThemeProvider>,
    );
  });
}

function byTestId(id: string): HTMLElement {
  const el = document.body.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

interface RecordedPan {
  __handlers: { onChange?: (event: { changeX: number }) => void; onFinalize?: () => void };
}

function openRow(spy: jest.SpyInstance) {
  const built = spy.mock.results[0]?.value as RecordedPan;
  act(() => {
    built.__handlers.onChange?.({ changeX: -2 * SWIPE_ACTION_WIDTH });
    built.__handlers.onFinalize?.();
  });
}

const DELETE = { key: 'delete', label: 'Borrar', icon: RiDeleteBinLine, tone: 'negative' as const };

describe('swipe-row', () => {
  it('names the dismiss target in the provider locale', () => {
    const spy = jest.spyOn(Gesture, 'Pan');
    mount(
      <SwipeRow actions={{ right: [DELETE] }} height={72} testID="sr">
        <Text>Fila</Text>
      </SwipeRow>,
    );
    openRow(spy);
    expect(byTestId('sr-dismiss').getAttribute('aria-label')).toBe('Cerrar acciones');
  });

  it('lets closeLabel win', () => {
    const spy = jest.spyOn(Gesture, 'Pan');
    mount(
      <SwipeRow actions={{ right: [DELETE] }} height={72} testID="sr" closeLabel="Ocultar">
        <Text>Fila</Text>
      </SwipeRow>,
    );
    openRow(spy);
    expect(byTestId('sr-dismiss').getAttribute('aria-label')).toBe('Ocultar');
  });
});

describe('floating', () => {
  const { Sub, SubTrigger, SubContent } = createFlyoutMenuSub('Test');

  it('names a flyout submenu in the provider locale', () => {
    mount(
      <MenuSurfaceProvider value={{ close: jest.fn(), presentation: 'dropdown' }}>
        <Sub defaultOpen>
          <SubTrigger>Enviar a…</SubTrigger>
          <SubContent testID="sub">
            <Text>Correo</Text>
          </SubContent>
        </Sub>
      </MenuSurfaceProvider>,
      'fr',
    );
    expect(document.body.querySelector('[aria-label="Sous-menu"]')).not.toBeNull();
  });
});
