/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import {
  Admonition,
  AdmonitionButton,
  AdmonitionContent,
  AdmonitionIcon,
  AdmonitionRoot,
  AdmonitionRow,
  AdmonitionText,
} from '../admonition';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Portal } from '../portal/Portal.web';
import { PortalOutlet, PortalProvider } from '../portal/Portal.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const SCOPE_TEXT = 'Scoped text';
const ACTION_TEXT = 'Action';
const NOTICE_TEXT = 'Expanded notice';

function Subject({
  outerSize,
  rootSize,
  nestedSize,
  buttonSize,
}: {
  outerSize?: BloomSize;
  rootSize?: BloomSize;
  nestedSize?: BloomSize;
  buttonSize?: BloomSize;
}) {
  return (
    <BloomThemeProvider fonts={false}>
      <PortalProvider>
        <BloomScope size={outerSize}>
          <AdmonitionRoot size={rootSize}>
            <Portal>
              <AdmonitionRow>
                <AdmonitionIcon testID="icon" />
                <AdmonitionContent>
                  {nestedSize ? (
                    <BloomScope size={nestedSize}>
                      <AdmonitionText>{SCOPE_TEXT}</AdmonitionText>
                      <AdmonitionButton size={buttonSize} testID="action">
                        {ACTION_TEXT}
                      </AdmonitionButton>
                    </BloomScope>
                  ) : (
                    <>
                      <AdmonitionText>{SCOPE_TEXT}</AdmonitionText>
                      <AdmonitionButton size={buttonSize} testID="action">
                        {ACTION_TEXT}
                      </AdmonitionButton>
                    </>
                  )}
                </AdmonitionContent>
              </AdmonitionRow>
            </Portal>
          </AdmonitionRoot>
        </BloomScope>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

it.each([
  { name: 'default', props: {}, padding: 16, fontSize: 14, buttonHeight: 36, icon: 20 },
  {
    name: 'nearby xs',
    props: { outerSize: 'xs' as const },
    padding: 8,
    fontSize: 12,
    buttonHeight: 24,
    icon: 16,
  },
  {
    name: 'explicit root sm',
    props: { outerSize: 'lg' as const, rootSize: 'sm' as const },
    padding: 12,
    fontSize: 13,
    buttonHeight: 32,
    icon: 18,
  },
  {
    name: 'nested lg',
    props: { outerSize: 'xs' as const, nestedSize: 'lg' as const },
    padding: 8,
    fontSize: 16,
    buttonHeight: 44,
    icon: 16,
  },
  {
    name: 'explicit button sm inside nested lg',
    props: { outerSize: 'xs' as const, nestedSize: 'lg' as const, buttonSize: 'sm' as const },
    padding: 8,
    fontSize: 16,
    buttonHeight: 32,
    icon: 16,
  },
])(
  'applies $name through public Admonition parts and a portal',
  ({ props, padding, fontSize, buttonHeight, icon }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() => root.render(<Subject {...props} />));
      const paddingHost = Array.from(host.querySelectorAll<HTMLElement>('*')).find(
        (node) => getComputedStyle(node).paddingTop === `${padding}px`,
      );
      const iconHost = document.body.querySelector<HTMLElement>('[data-testid="icon"]');
      const text = Array.from(document.body.querySelectorAll<HTMLElement>('*')).find(
        (node) => node.childNodes.length === 1 && node.textContent === SCOPE_TEXT,
      );
      const action = document.body.querySelector<HTMLElement>('[data-testid="action"]');
      expect(paddingHost).toBeDefined();
      if (!iconHost || !text || !action) throw new Error('Admonition parts did not render');
      expect(getComputedStyle(iconHost).width).toBe(`${icon}px`);
      expect(getComputedStyle(iconHost).height).toBe(`${icon}px`);
      expect(getComputedStyle(text).fontSize).toBe(`${fontSize}px`);
      expect(getComputedStyle(action).height).toBe(`${buttonHeight}px`);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it('lets the one-piece Admonition override the surrounding scope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <BloomScope size="xs">
            <Admonition size="lg">{NOTICE_TEXT}</Admonition>
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );
    const paddingHost = Array.from(host.querySelectorAll<HTMLElement>('*')).find(
      (node) => getComputedStyle(node).paddingTop === '20px',
    );
    const text = Array.from(host.querySelectorAll<HTMLElement>('*')).find(
      (node) =>
        node.style.fontSize !== '' &&
        node.childNodes.length === 1 &&
        node.textContent === NOTICE_TEXT,
    );
    expect(paddingHost).toBeDefined();
    if (!text) throw new Error('Admonition text did not render');
    expect(text.style.fontSize).toBe('16px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
