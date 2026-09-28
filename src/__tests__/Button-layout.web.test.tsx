/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({ isDark: false, colors: {
    backgroundSecondary: '#eeeeee', backgroundTertiary: '#dddddd', textTertiary: '#888888', border: '#999999', card: '#ffffff', background: '#ffffff', text: '#17251e', textSecondary: '#65716a',
    primary: '#166534', primaryForeground: '#ffffff', negative: '#991b1b', negativeForeground: '#ffffff',
    primarySubtle: 'rgba(22,101,52,0.13)', primarySubtleForeground: '#14532d',
  } }),
}));
import { Button } from '../button/Button.web';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { jest.useFakeTimers(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });


it('forwards the DOM anchor and reports the RN layout shape when requested', () => {
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width:80, height:36 } as DOMRect);
  const ref = React.createRef<import('react-native').View>(); const layout = jest.fn();
  act(() => root.render(<Button ref={ref} onLayout={layout}>Measure</Button>));
  expect(ref.current).toBe(container.querySelector('button'));
  expect(layout).toHaveBeenCalledTimes(1);
  expect(layout.mock.calls[0][0].nativeEvent.layout).toMatchObject({ width:80, height:36 });
  act(() => window.dispatchEvent(new Event('resize')));
  expect(layout).toHaveBeenCalledTimes(1);
  act(() => root.render(null)); expect(ref.current).toBeNull();
  jest.restoreAllMocks();
});
it('composes the child ref and forwards hidden semantics without another DOM node', () => {
  const ref = React.createRef<import('react-native').View>(); const childRef = React.createRef<HTMLAnchorElement>();
  act(() => root.render(<Button ref={ref} asChild accessibilityElementsHidden><a ref={childRef} href="#">Link</a></Button>));
  expect(container.children).toHaveLength(1);
  const anchor = container.querySelector('a')!;
  expect(ref.current).toBe(anchor); expect(childRef.current).toBe(anchor);
  expect(anchor.getAttribute('aria-hidden')).toBe('true');
});
