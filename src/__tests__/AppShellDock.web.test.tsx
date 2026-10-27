/**
 * @jest-environment jsdom
 *
 * The dock on the web: one registered custom property per edge carries the
 * motion, so the slot (`calc()` of the progress), the content's offset (a
 * percentage translate of the same progress) and every CSS width that reads
 * the navigation follow ONE curve on the compositor. These suites read the
 * markup React leaves; `scripts/verify-app-shell-dock.mjs` measures the frames.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 1280,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 800,
    configurable: true,
  });
  return jest.requireActual('react-native-web');
});
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { Text } from 'react-native';
import { AppShell, AppShellPanel, useAppShell } from '../app-shell/index.web';
import type { AppShellContextValue } from '../app-shell/context';
import type { AppShellProps } from '../app-shell/types';
import { shellLayoutCss } from '../app-shell/shell-layout-css';
import { DOCK_PROPERTY_CSS } from '../app-shell/EdgeDock';
import { motionCss } from '../motion/spec';
import { RiHomeLine } from '../icons/remix';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useSidebarMetrics } from '../sidebar/metrics';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NAV = [{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }];
const SPRING = { response: 0.215, dampingRatio: 0.79 };

let shell: AppShellContextValue | null = null;
function Probe() {
  shell = useAppShell();
  return <Text>Page</Text>;
}

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  shell = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

function mount(props: Partial<AppShellProps> = {}, dock: object = { peek: true }) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AppShell
          testID="shell"
          variant="feed"
          panels
          scroll="fixed"
          header={null}
          navigationAlign="content"
          navigationGap={0}
          navFrom={0}
          framedFrom={0}
          contentMaxWidth="none"
          frameInset={{ top: 6, end: 7, bottom: 7, start: 7 }}
          sidebar={{
            items: NAV,
            surface: 'plain',
            variant: 'panel',
            collapsed: false,
            collapseDisabled: true,
            width: 190,
            dock,
          }}
          {...props}
        >
          <AppShellPanel>
            <Probe />
          </AppShellPanel>
        </AppShell>
      </BloomThemeProvider>,
    ),
  );
}

const node = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

describe('the web dock', () => {
  it('declares its progress properties as interpolable numbers', () => {
    expect(DOCK_PROPERTY_CSS).toContain(
      "@property --bloom-nav-dock{syntax:'<number>';inherits:true;initial-value:1}",
    );
    expect(DOCK_PROPERTY_CSS).toContain("@property --bloom-top-peek{syntax:'<number>'");
  });

  it('carries the progress on the root with the spring of the way it goes', () => {
    mount();
    const rootStyle = node('shell').style;
    expect(rootStyle.getPropertyValue('--bloom-nav-dock')).toBe('1');
    expect(rootStyle.transitionProperty).toContain('--bloom-nav-dock');
    const css = motionCss(SPRING);
    expect(rootStyle.transitionDuration).toBe(css.duration);
    expect(rootStyle.transitionTimingFunction).toContain('linear(0');
    expect(node('shell-navigation').style.width).toBe(
      'calc(7px + 183px * var(--bloom-nav-dock, 1))',
    );
    expect(node('shell-navigation-host').style.transform).toBe(
      'translateX(calc(-1 * 100% * (1 - var(--bloom-nav-dock, 1))))',
    );

    act(() => shell!.navigationDock.setHidden(true));
    expect(node('shell').style.getPropertyValue('--bloom-nav-dock')).toBe('0');
    expect(node('shell').getAttribute('data-bloom-dock-moving')).toBe('true');
    const host = node('shell-navigation-host');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.hasAttribute('inert')).toBe(true);
    // The strip waits for the motion to land, so a pointer at the edge cannot
    // open a peek of a region still leaving.
    expect(node('shell-navigation-edge')).toBeNull();
    act(() => {
      const event = new Event('transitionend', { bubbles: true }) as TransitionEvent;
      Object.defineProperty(event, 'propertyName', { value: '--bloom-nav-dock' });
      node('shell').dispatchEvent(event);
    });
    expect(node('shell').hasAttribute('data-bloom-dock-moving')).toBe(false);
    expect(node('shell-navigation-edge')).not.toBeNull();
  });

  it('peeks on the peek property, with the in and out curves, and docks from it at once', () => {
    jest.useFakeTimers();
    mount({}, { peek: true, defaultHidden: true });
    act(() => shell!.navigationDock.peek(true));
    const host = node('shell-navigation-host');
    expect(host.style.getPropertyValue('--bloom-nav-peek')).toBe('1');
    expect(host.style.transitionDuration).toBe(
      motionCss({ response: 0.185, dampingRatio: 0.77 }).duration,
    );
    expect(host.style.transform).toBe(
      'translateX(calc(-1 * (100% + 12px) * (1 - var(--bloom-nav-peek))))',
    );
    expect(host.style.top).toBe('5px');
    expect(host.getAttribute('aria-hidden')).toBeNull();

    act(() => shell!.navigationDock.peek(false));
    act(() => jest.advanceTimersByTime(120));
    expect(host.style.getPropertyValue('--bloom-nav-peek')).toBe('0');
    expect(host.style.transitionDuration).toBe('150ms');
    expect(shell!.navigationDock.peeking).toBe(true);
    act(() => jest.advanceTimersByTime(150));
    expect(shell!.navigationDock.peeking).toBe(false);

    act(() => shell!.navigationDock.peek(true));
    act(() => shell!.navigationDock.setHidden(false));
    expect(node('shell').style.getPropertyValue('--bloom-nav-dock')).toBe('1');
    expect(node('shell').style.transitionDuration).toBe('0ms');
  });

  it('lets the window show through a transparent shell', () => {
    mount({ background: 'transparent' });
    expect(node('shell').style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });
});

describe('the CSS compositor', () => {
  function Css({ dock, onCss }: { dock: boolean; onCss: (css: string) => void }) {
    const metrics = useSidebarMetrics();
    onCss(
      shellLayoutCss('s', {
        sidebar: {
          items: NAV,
          surface: 'plain',
          variant: 'panel',
          collapsed: false,
          ...(dock ? { dock: { peek: true } } : {}),
        },
        navFrom: 0,
        framedFrom: 0,
        panels: true,
        variant: 'feed',
        navigationAlign: 'content',
        frameInset: { top: 6, end: 7, bottom: 7, start: 7 },
        metrics: { ...metrics, expanded: 190 },
        layout: { panels: [{ id: 'page' }] },
        gap: 7,
        gutter: 16,
        navigationGap: 0,
        contentWidth: 600,
        userCollapsed: false,
        fillWidth: true,
      }),
    );
    return null;
  }
  const compile = (dock: boolean) => {
    let css = '';
    act(() =>
      root.render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <Css dock={dock} onCss={(value) => (css = value)} />
        </BloomThemeProvider>,
      ),
    );
    return css;
  };

  it('closes a docked navigation from its width to the frame inset it leaves', () => {
    const css = compile(true);
    expect(css).toContain(
      '--bloom-nav-content-width:190px;--bloom-nav-width:calc(7px + 183px * var(--bloom-nav-dock, 1));--bloom-nav-gap:0px;',
    );
    expect(css).toContain('[data-bloom-dock-moving]');
    expect(compile(false)).toContain('--bloom-nav-width:190px;--bloom-nav-gap:0px;');
  });

  it('frames each edge on its own and never centres a filled envelope', () => {
    const css = compile(true);
    expect(css).toContain('--bloom-frame-end:7px');
    expect(css).toContain('--bloom-body-gutter-top:6px;--bloom-body-gutter-bottom:7px');
    expect(css).toContain('--bloom-frame-alignment:var(--bloom-frame-start)');
  });
});
