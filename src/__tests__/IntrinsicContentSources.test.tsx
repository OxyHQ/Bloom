import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Screen, ScreenScrollView } from '../screen';
import { ScreenHostContext } from '../screen/context';
import { VirtualList } from '../list';

it.each(['list', 'scroll'] as const)(
  'publishes %s native content events without confusing viewport fill with content',
  (kind) => {
    const metrics = {
      scrollY: makeMutable(0),
      contentHeight: makeMutable(-1),
      viewportHeight: makeMutable(800),
      intrinsicContentHeight: makeMutable(-1),
    };
    const ui = (growing = false) => (
      <BloomThemeProvider fonts={false}>
        <ScreenHostContext.Provider value={{ active: true, kind: 'native', metrics }}>
          <Screen scroll="auto">
            {kind === 'list' ? (
              <VirtualList
                testID="content"
                data={['row']}
                renderItem={({ item }) => <Text>{item}</Text>}
                contentContainerStyle={growing ? { flexGrow: 1 } : undefined}
              />
            ) : (
              <ScreenScrollView
                testID="content"
                contentContainerStyle={growing ? { flexGrow: 1 } : undefined}
              >
                <Text>row</Text>
              </ScreenScrollView>
            )}
          </Screen>
        </ScreenHostContext.Provider>
      </BloomThemeProvider>
    );
    const tree = render(ui());
    fireEvent(tree.getByTestId('content'), 'layout', { nativeEvent: { layout: { height: 600 } } });
    expect(metrics.viewportHeight.value).toBe(600);
    fireEvent(tree.getByTestId('content'), 'contentSizeChange', 400, 117);
    expect(metrics.intrinsicContentHeight.value).toBe(117);
    fireEvent(tree.getByTestId('content'), 'contentSizeChange', 400, 2400);
    expect(metrics.intrinsicContentHeight.value).toBe(2400);
    tree.rerender(ui(true));
    fireEvent(tree.getByTestId('content'), 'contentSizeChange', 400, 800);
    expect(metrics.intrinsicContentHeight.value).toBe(-1);
    tree.unmount();
    expect(metrics.intrinsicContentHeight.value).toBe(-1);
  },
);
