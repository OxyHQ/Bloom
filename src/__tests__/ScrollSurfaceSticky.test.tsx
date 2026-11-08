import { fireEvent, render } from '@testing-library/react-native';
import { Platform, ScrollView, Text } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ScrollSurface } from '../layout/ScrollSurface';
import {
  canStickScrollChrome,
  scrollChromeFadeHeight,
  stickyFooterTranslation,
} from '../layout/scroll-surface-sticky';

it('keeps both chrome regions inside one native scroll owner and releases oversized chrome', () => {
  const previous = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  try {
    const view = render(
      <BloomThemeProvider fonts={false}>
        <ScrollSurface
          testID="surface"
          stickyHeader={<Text>Heading</Text>}
          stickyFooter={<Text>Footer</Text>}
        >
          <Text>Body</Text>
        </ScrollSurface>
      </BloomThemeProvider>,
    );
    expect(view.UNSAFE_getAllByType(ScrollView)).toHaveLength(1);
    const layout = (id: string, height: number) =>
      fireEvent(view.getByTestId(id), 'layout', {
        nativeEvent: { layout: { width: 240, height } },
      });
    layout('surface-sticky-header', 60);
    layout('surface-sticky-footer', 70);
    layout('surface', 300);
    expect(view.getByTestId('surface').props.stickyHeaderIndices).toEqual([0]);
    expect(view.getByTestId('surface').props.removeClippedSubviews).toBe(false);
    const header = view.getByTestId('surface-sticky-header');
    let ancestor = header.parent;
    while (ancestor && ancestor.props.testID !== 'surface') ancestor = ancestor.parent;
    expect(ancestor).not.toBeNull();
    layout('surface', 150);
    expect(view.getByTestId('surface').props.stickyHeaderIndices).toEqual([]);
    expect(view.getByText('Footer')).toBeTruthy();
    expect(view.getByText('Heading')).toBeTruthy();
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: previous });
  }
});
it('pins the native footer to the viewport bottom and returns it to normal flow at the end', () => {
  expect(stickyFooterTranslation(0, 300, 900, true)).toBe(-600);
  expect(stickyFooterTranslation(200, 300, 900, true)).toBe(-400);
  expect(stickyFooterTranslation(600, 300, 900, true)).toBe(0);
  expect(stickyFooterTranslation(700, 300, 900, true)).toBe(0);
  expect(stickyFooterTranslation(-60, 300, 900, true)).toBe(-600);
  expect(stickyFooterTranslation(0, 300, 200, true)).toBe(0);
  expect(stickyFooterTranslation(0, 300, 900, false)).toBe(0);
});
it('reserves usable content space and avoids sticking before viewport measurement', () => {
  expect(canStickScrollChrome(0, 0, 0)).toBe(false);
  expect(canStickScrollChrome(300, 100, 152)).toBe(true);
  expect(canStickScrollChrome(300, 100, 153)).toBe(false);
});

it('leaves a readable middle between the two fades in short viewports', () => {
  expect(scrollChromeFadeHeight(40, 180, 120)).toBe(15);
  expect(scrollChromeFadeHeight(40, 320, 120)).toBe(40);
  expect(scrollChromeFadeHeight(40, 100, 140)).toBe(0);
});
