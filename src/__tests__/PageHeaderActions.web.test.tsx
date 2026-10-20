/** @jest-environment jsdom */
import type React from 'react';
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native-web'),
  useWindowDimensions: () => ({ width: 1600, height: 900, scale: 1, fontScale: 1 }),
}));
import { PageHeader } from '../page-header';
import { BloomScope } from '../appearance';
import { ScreenScope } from '../layout/screen-scope';
import { OverlayRoot } from '../overlay';
import { Button } from '../button/index.web';
import { Dialog, useDialogControl } from '../dialog/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resetOverlayStack } from '../overlay/stack';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  jest.useFakeTimers();
  resetOverlayStack();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetOverlayStack();
  jest.useRealTimers();
});
function flush() {
  for (let i = 0; i < 5; i++) act(() => jest.advanceTimersByTime(100));
}
function mount(children: React.ReactNode) {
  act(() => root.render(<BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>));
  flush();
}
function headerLayout(width: number) {
  const header = document.querySelector('[data-testid="header"]') as HTMLElement & {
    __reactLayoutHandler?: (event: {
      nativeEvent: { layout: { x: number; y: number; width: number; height: number } };
    }) => void;
  };
  expect(typeof header.__reactLayoutHandler).toBe('function');
  act(() =>
    header.__reactLayoutHandler?.({ nativeEvent: { layout: { x: 0, y: 0, width, height: 56 } } }),
  );
  flush();
}

it('uses its own 639/640 boundary and does not publish each resized pixel', () => {
  const actions = jest.fn(({ compact }: { compact: boolean }) => (
    <span>{compact ? 'Compact' : 'Full'}</span>
  ));
  mount(<PageHeader testID="header" title="Page" actions={actions} />);
  expect(actions.mock.calls[actions.mock.calls.length - 1]?.[0]).toEqual({
    compact: true,
    spacious: false,
  });
  headerLayout(639);
  actions.mockClear();
  headerLayout(638);
  headerLayout(400);
  expect(actions).not.toHaveBeenCalled();
  headerLayout(640);
  expect(actions).toHaveBeenCalledTimes(1);
  expect(actions).toHaveBeenLastCalledWith({ compact: false, spacious: false });
  headerLayout(641);
  headerLayout(1000);
  expect(actions).toHaveBeenCalledTimes(1);
  headerLayout(639);
  expect(actions).toHaveBeenCalledTimes(2);
  expect(actions).toHaveBeenLastCalledWith({ compact: true, spacious: false });
});

it('preserves an open action dialog and its edited input across compact transitions', () => {
  const mounted = jest.fn();
  const unmounted = jest.fn();
  function ShareAction({ compact }: { compact: boolean }) {
    const dialog = useDialogControl();
    useEffect(() => {
      mounted();
      return unmounted;
    }, []);
    return (
      <>
        <Button onPress={() => dialog.open()} accessibilityLabel="Share page">
          {compact ? 'Share icon' : 'Share page'}
        </Button>
        <Dialog control={dialog} title="Sharing">
          <input aria-label="Recipient" defaultValue="" />
        </Dialog>
      </>
    );
  }
  mount(
    <PageHeader
      testID="header"
      title="Page"
      actions={({ compact }) => (
        <>
          {!compact && <Button key="favorite">Favorite</Button>}
          <ShareAction key="share" compact={compact} />
        </>
      )}
    />,
  );
  headerLayout(1000);
  const button = document.querySelector('[aria-label="Share page"]') as HTMLElement;
  act(() => button.click());
  flush();
  const dialog = document.querySelector('[role="dialog"]');
  const input = document.querySelector('[aria-label="Recipient"]') as HTMLInputElement;
  expect(dialog).not.toBeNull();
  input.value = 'person@example.test';
  headerLayout(320);
  headerLayout(640);
  expect(document.querySelector('[role="dialog"]')).toBe(dialog);
  expect(document.querySelector('[aria-label="Recipient"]')).toBe(input);
  expect(input.value).toBe('person@example.test');
  expect(mounted).toHaveBeenCalledTimes(1);
  expect(unmounted).not.toHaveBeenCalled();
});

it('uses compact navigation actions without changing size or leaking density into overlays', () => {
  mount(
    <BloomScope size="md">
      <PageHeader
        presentation="navigation"
        testID="header"
        title="Current page"
        actions={
          <>
            <Button testID="navigation-action" appearance="plain">
              Share
            </Button>
            <Button testID="explicit-action" size="lg" appearance="plain">
              Large
            </Button>
            <Button testID="normal-action" density="default">
              Normal
            </Button>
            <OverlayRoot>
              <Button testID="overlay-action">Overlay</Button>
            </OverlayRoot>
            <ScreenScope>
              <Button testID="screen-action">Screen</Button>
            </ScreenScope>
          </>
        }
      />
      <Button testID="outside-action">Outside</Button>
    </BloomScope>,
  );
  const style = (id: string) =>
    getComputedStyle(document.querySelector(`[data-testid="${id}"]`) as HTMLElement);
  expect(style('navigation-action').height).toBe('28px');
  expect(style('navigation-action').fontSize).toBe('14px');
  expect(style('explicit-action').height).toBe('32px');
  for (const id of ['normal-action', 'overlay-action', 'screen-action', 'outside-action'])
    expect(style(id).height).toBe('36px');
  expect(style('header-actions').gap).toBe('2px');
});

it('expands mounted navigation actions for a coarse pointer while retaining normal md typography', () => {
  const previous = window.matchMedia;
  let coarse = false;
  const query: MediaQueryList = new (class extends EventTarget {
    get matches() {
      return coarse;
    }
    media = '(pointer: coarse)';
    onchange: MediaQueryList['onchange'] = null;
    addListener() {}
    removeListener() {}
  })();
  window.matchMedia = () => query;
  try {
    mount(
      <PageHeader
        presentation="navigation"
        actions={<Button testID="touch-action">Share</Button>}
      />,
    );
    const button = document.querySelector('[data-testid="touch-action"]') as HTMLElement;
    expect(getComputedStyle(button).height).toBe('28px');
    act(() => {
      coarse = true;
      query.dispatchEvent(new Event('change'));
    });
    expect(getComputedStyle(button).height).toBe('44px');
    expect(getComputedStyle(button).fontSize).toBe('14px');
  } finally {
    window.matchMedia = previous;
  }
});

it('publishes spacious only across its own 1279/1280 threshold', () => {
  const actions = jest.fn(() => <span>Actions</span>);
  mount(<PageHeader testID="header" title="Page" actions={actions} />);
  headerLayout(1279);
  actions.mockClear();
  headerLayout(1278);
  expect(actions).not.toHaveBeenCalled();
  headerLayout(1280);
  expect(actions).toHaveBeenLastCalledWith({ compact: false, spacious: true });
  actions.mockClear();
  headerLayout(1600);
  expect(actions).not.toHaveBeenCalled();
  headerLayout(1279);
  expect(actions).toHaveBeenLastCalledWith({ compact: false, spacious: false });
});
