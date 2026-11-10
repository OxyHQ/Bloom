/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { Text, View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, Text, View } };
});
jest.mock('../hooks/use-keyboard-visible', () => ({ useKeyboardVisible: () => false }));

import { BottomBar } from '../bottom-bar/BottomBar.web';
import { BloomScope } from '../appearance';
import { PageHeader } from '../page-header';
import { TabBar, TabBarButton } from '../tab-bar/index.web';
import type { TabBarItem } from '../tab-bar/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: null },
  { name: 'search', label: 'Search', icon: null },
];

function Subject({ size }: { size: 'xs' | 'lg' }) {
  return (
    <BloomThemeProvider fonts={false}>
      <BloomScope size={size}>
        <PageHeader testID="header" presentation="navigation" title="Inbox" onBack={null} />
        <TabBar testID="tabs" activeIndex={0} blur={false}>
          {ITEMS.map((item, index) => (
            <TabBarButton key={item.name} item={item} index={index} />
          ))}
        </TabBar>
        <BottomBar
          testID="bottom"
          items={ITEMS}
          value="home"
          onValueChange={() => {}}
          blur={false}
        />
      </BloomScope>
    </BloomThemeProvider>
  );
}

function element(testID: string): HTMLElement {
  const node = document.body.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
  if (!node) throw new Error(`Missing navigation element ${testID}`);
  return node;
}

it('keeps fixed navigation geometry independent of the app control size scope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const measure = () => ({
      header: getComputedStyle(element('header-bar')).minHeight,
      tabs: Array.from(element('tabs').querySelectorAll<HTMLElement>('*'))
        .map((node) => getComputedStyle(node).height)
        .find((height) => height === '58px'),
      bottom: getComputedStyle(element('bottom')).height,
    });
    act(() => root.render(<Subject size="xs" />));
    const compact = measure();
    act(() => root.render(<Subject size="lg" />));
    expect(measure()).toEqual(compact);
    expect(compact.header).toBe('44px');
    expect(compact.tabs).toBe('58px');
    expect(compact.bottom).toBe('74px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
