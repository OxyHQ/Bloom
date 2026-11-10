import { render } from '@testing-library/react-native';
import { BottomBar } from '../bottom-bar';
import { BloomScope } from '../appearance';
import { PageHeader } from '../page-header';
import { TabBar, TabBarButton } from '../tab-bar';
import type { TabBarItem } from '../tab-bar/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: null },
  { name: 'search', label: 'Search', icon: null },
];

function Subject({ size }: { size: 'xs' | 'lg' }) {
  return (
    <BloomThemeProvider>
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

function tabBarHeights(root: ReturnType<typeof render>['UNSAFE_root']): number[] {
  return root
    .findAll(
      (node) => typeof node.type === 'string' && resolvedStyle(node.props?.style).height === 58,
    )
    .map((node) => resolvedStyle(node.props.style).height as number);
}

it('keeps fixed navigation geometry independent of the app control size scope', () => {
  const screen = render(<Subject size="xs" />);
  const measure = () => ({
    header: resolvedStyle(screen.getByTestId('header-bar').props.style).minHeight,
    tabs: tabBarHeights(screen.UNSAFE_root),
    bottom: resolvedStyle(screen.getByTestId('bottom').props.style).height,
  });
  const compact = measure();
  screen.rerender(<Subject size="lg" />);
  expect(measure()).toEqual(compact);
  expect(compact.header).toBe(44);
  expect(compact.tabs).toContain(58);
  expect(compact.bottom).toBe(74);
});
