import { render } from '@testing-library/react-native';
import { Platform, ScrollView, Text } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ScrollArea } from '../layout/ScrollArea';
import { resolvedStyle } from './support/rendered-style';
it.each(['ios', 'android'])(
  'keeps %s decoration inside scroll content beneath the native indicator',
  (platform) => {
    const previous = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: platform });
    try {
      const view = render(
        <BloomThemeProvider fonts={false}>
          <ScrollArea testID="owner" stickyHeaderIndices={[0]} viewportOverlay={<Text>Fade</Text>}>
            <Text>Header</Text>
            <Text>Body</Text>
          </ScrollArea>
        </BloomThemeProvider>,
      );
      expect(view.UNSAFE_getAllByType(ScrollView)).toHaveLength(1);
      const decoration = view.getByTestId('scroll-viewport-decoration', {
        includeHiddenElements: true,
      });
      let parent = decoration.parent;
      while (parent && parent.props.testID !== 'owner') parent = parent.parent;
      expect(parent).not.toBeNull();
      expect(resolvedStyle(decoration.props.style).position).toBe('absolute');
      expect(decoration.props.pointerEvents).toBe('none');
      expect(decoration.props.importantForAccessibility).toBe('no-hide-descendants');
      expect(view.getByTestId('owner').props.stickyHeaderIndices).toEqual([0]);
      expect(view.getByTestId('owner').props.showsVerticalScrollIndicator).toBe(true);
      expect(view.getByTestId('owner').props.removeClippedSubviews).toBe(false);
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: previous });
    }
  },
);
