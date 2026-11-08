/** @jest-environment jsdom */
import type React from 'react';
import { act, useContext, useSyncExternalStore } from 'react';
import { HeaderActionsHostContext } from '../page-header/context';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => ({ ...jest.requireActual('react-native-web') }));
import { HeaderActions } from '../page-header/HeaderActions.web';
import { PageHeader } from '../page-header/PageHeader';
import type { HeaderAction } from '../page-header/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
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
function node(id: string) {
  return document.querySelector(`[data-testid="${id}"]`) as HTMLElement;
}
function layout(id: string, width: number) {
  const element = node(id) as HTMLElement & { __reactLayoutHandler?: (event: unknown) => void };
  expect(element).toBeTruthy();
  expect(element.__reactLayoutHandler).toBeInstanceOf(Function);
  act(() =>
    element.__reactLayoutHandler?.({ nativeEvent: { layout: { x: 0, y: 0, width, height: 38 } } }),
  );
}
function measure(actions: readonly HeaderAction[]) {
  for (const { id } of actions) {
    layout(`actions-measure-${id}-full`, 90);
    layout(`actions-measure-${id}-compact`, 34);
  }
  layout('actions-measure-overflow', 34);
  flush();
}
const action = (id: string, props: Partial<HeaderAction> = {}): HeaderAction => ({
  id,
  label: id,
  icon: RiSearchLine,
  onPress: jest.fn(),
  ...props,
});
function hidden(id: string) {
  return node(id).closest('[data-header-action-id]')?.getAttribute('aria-hidden') === 'true';
}

it('uses header-local room and preserves mounted buttons and a custom draft across resize', () => {
  const actions = [
    action('share'),
    action('stop', { essential: true }),
    action('close', { essential: true }),
  ];
  const render = () => (
    <PageHeader
      testID="header"
      title="Document"
      actions={
        <HeaderActions
          testID="actions"
          actions={actions}
          persistentActions={<input data-testid="draft" defaultValue="saved" />}
        />
      }
    />
  );
  mount(render());
  layout('header', 900);
  measure(actions);
  const stop = node('actions-stop');
  const draft = node('draft') as HTMLInputElement;
  draft.value = 'still editing';
  layout('header', 240);
  flush();
  expect(hidden('actions-share')).toBe(true);
  expect(hidden('actions-stop')).toBe(false);
  expect(hidden('actions-close')).toBe(false);
  expect(node('actions-stop')).toBe(stop);
  expect(node('draft')).toBe(draft);
  layout('header', 900);
  flush();
  expect(hidden('actions-share')).toBe(false);
  expect(draft.value).toBe('still editing');
});

it('moves keyboard focus to overflow when its inline action no longer fits', () => {
  const actions = [action('share'), action('stop', { essential: true })];
  mount(<HeaderActions testID="actions" actions={actions} availableWidth={250} />);
  measure(actions);
  act(() => node('actions-share').focus());
  expect(document.activeElement).toBe(node('actions-share'));
  mount(<HeaderActions testID="actions" actions={actions} availableWidth={70} />);
  expect(document.activeElement).toBe(node('actions-overflow'));
});

it('keeps an open overflow item mounted and actionable while the header grows', () => {
  const press = jest.fn();
  const actions = [action('share', { onPress: press }), action('stop', { essential: true })];
  mount(<HeaderActions testID="actions" actions={actions} availableWidth={70} />);
  measure(actions);
  act(() => node('actions-overflow').click());
  flush();
  const item = node('actions-menu-share');
  expect(item).toBeTruthy();
  mount(<HeaderActions testID="actions" actions={actions} availableWidth={500} />);
  expect(node('actions-menu-share')).toBe(item);
  expect(hidden('actions-share')).toBe(true);
  act(() => item.click());
  flush();
  expect(press).toHaveBeenCalledTimes(1);
  expect(hidden('actions-share')).toBe(false);
});

it('announces busy/toggle state and prevents busy activation', () => {
  const press = jest.fn();
  const actions = [action('sync', { busy: true, essential: true, selected: true, onPress: press })];
  mount(<HeaderActions testID="actions" actions={actions} availableWidth={200} />);
  measure(actions);
  const button = node('actions-sync');
  expect(button.getAttribute('aria-busy')).toBe('true');
  expect(button.getAttribute('aria-pressed')).toBe('true');
  act(() => button.click());
  expect(press).not.toHaveBeenCalled();
});

it('honors an explicit zero-width budget and recovers when its host grows', () => {
  const actions = [action('stop', { essential: true })];
  mount(<HeaderActions testID="actions" availableWidth={0} actions={actions} />);
  measure(actions);
  expect(node('actions').style.maxWidth).toBe('0px');
  const stop = node('actions-stop');
  mount(<HeaderActions testID="actions" availableWidth={90} actions={actions} />);
  expect(node('actions').style.maxWidth).toBe('90px');
  expect(node('actions-stop')).toBe(stop);
});

it.each([
  [320, false, 280],
  [640, false, 584],
  [320, true, 288],
] as const)(
  'reserves the actual header insets at width %s, compact %s',
  (width, compact, expected) => {
    function Budget() {
      const host = useContext(HeaderActionsHostContext)!;
      const value = useSyncExternalStore(host.subscribe, host.getWidth, host.getWidth);
      return <span data-testid="budget">{value}</span>;
    }
    mount(
      <PageHeader testID="header" density={compact ? 'compact' : 'default'} actions={<Budget />} />,
    );
    layout('header', width);
    expect(node('budget').textContent).toBe(String(expected));
  },
);
