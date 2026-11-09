/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Portal } from '../portal/Portal.web';
import {
  INDICATOR_CASES,
  IndicatorScopes,
  IndicatorSubjects,
  IndependentSubjects,
} from './support/indicator-scope-cases';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe.each([false, true])('web indicator parts, portalled=%s', (portalled) => {
  it.each(INDICATOR_CASES)('$name', ({ scopes, explicit, heights }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      const subjects = <IndicatorSubjects size={explicit} />;
      act(() =>
        root.render(
          <BloomThemeProvider fonts={false}>
            <IndicatorScopes scopes={scopes}>
              {portalled ? <Portal>{subjects}</Portal> : subjects}
            </IndicatorScopes>
          </BloomThemeProvider>,
        ),
      );
      expect(
        ['presence', 'unread', 'energy'].map(
          (id) => getComputedStyle(document.querySelector(`[data-testid="${id}"]`)!).height,
        ),
      ).toEqual(heights.map((height) => `${height}px`));
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  });
});

it.each(['xs', 'lg'] as const)(
  'keeps document and audio artwork independent of %s control size',
  (scope) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      for (const explicit of [false, true]) {
        act(() =>
          root.render(
            <BloomThemeProvider fonts={false}>
              <IndicatorScopes scopes={[scope]}>
                <IndependentSubjects explicit={explicit} />
              </IndicatorScopes>
            </BloomThemeProvider>,
          ),
        );
        expect(getComputedStyle(host.querySelector('[data-testid="wave"]')!).height).toBe(
          explicit ? '72px' : '40px',
        );
        const paragraph = Array.from(host.querySelectorAll('*')).find(
          (node) =>
            node.childNodes.length === 1 &&
            node.firstChild?.nodeType === Node.TEXT_NODE &&
            node.textContent === 'Paragraph',
        )!;
        expect(getComputedStyle(paragraph).fontSize).toBe(explicit ? '16px' : '14px');
        expect(getComputedStyle(host.querySelector('[data-testid="code"]')!).fontSize).toBe(
          explicit ? '13px' : '11px',
        );
      }
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);
