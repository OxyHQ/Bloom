/**
 * @jest-environment jsdom
 *
 * Bloom's base web rules reach the page once the theme provider mounts: on web
 * a control takes no text selection (`styles/base-web-css.ts`), whatever family
 * drew it, while links — which sit inside prose — keep theirs.
 */
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BASE_WEB_CSS } from '../styles/base-web-css';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { installConstructedStyleSheets } from './support/constructed-style-sheets';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('base web rules', () => {
  it('are adopted by the theme provider, and make controls unselectable', () => {
    const sheets = installConstructedStyleSheets();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      act(() => {
        root.render(<BloomThemeProvider mode="light" colorPreset="teal">{null}</BloomThemeProvider>);
      });
      const base = sheets.adopted().find((sheet) => sheet.cssText === BASE_WEB_CSS);
      expect(base).toBeDefined();
      for (const selector of ['button', '[role="button"]', '[role="tab"]', '[role="menuitem"]', '[role="option"]']) {
        expect(BASE_WEB_CSS).toContain(selector);
      }
      expect(BASE_WEB_CSS).toMatch(/user-select:\s*none/);
      // Links stay selectable: they are part of the prose around them.
      expect(BASE_WEB_CSS).not.toContain('[role="link"]');
    } finally {
      act(() => root.unmount());
      container.remove();
      sheets.uninstall();
    }
  });
});
