import { useContext } from 'react';
import { render } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { AppShell } from '../app-shell';
import { PageHeader } from '../page-header';
import { Screen } from '../screen';
import { ScreenScope, useContentSafeAreaInsets } from '../layout';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';
import { mockWindowSize } from './support/window-size';

function Insets({ name }: { name: string }) {
  const physical = useContext(SafeAreaInsetsContext);
  const content = useContentSafeAreaInsets();
  return <Text testID={name}>{JSON.stringify({ physical, content })}</Text>;
}
const physical = { top: 47, right: 7, bottom: 34, left: 20 };
const originalOS = Platform.OS;
beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  mockWindowSize({ width: 1440, height: 900, scale: 1, fontScale: 1 });
});
afterEach(() => {
  Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  jest.restoreAllMocks();
});

it('consumes frame edges once through a bounded panel and restores physical edges in an independent modal scope', () => {
  const result = render(
    <SafeAreaInsetsContext.Provider value={physical}>
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AppShell
          layout="workspace"
          presentation="continuous"
          testID="shell"
          panelLayout={{
            panels: [
              {
                id: 'main',
                role: 'main',
                content: (
                  <Screen header={<PageHeader title="Page" testID="page-header" />}>
                    <Insets name="content" />
                    <Screen
                      header={<PageHeader title="Nested" testID="nested-header" />}
                      scroll="none"
                    />
                    <PageHeader title="Explicit" testID="explicit-header" safeArea />
                    <ScreenScope>
                      <PageHeader title="Modal" testID="modal-header" />
                      <Insets name="modal" />
                    </ScreenScope>
                  </Screen>
                ),
              },
            ],
          }}
        />
      </BloomThemeProvider>
    </SafeAreaInsetsContext.Provider>,
  );
  expect(resolvedStyle(result.getByTestId('shell-safe-area').props.style)).toMatchObject({
    paddingTop: 47,
    paddingBottom: 34,
  });
  expect(resolvedStyle(result.getByTestId('page-header').props.style).paddingTop).toBe(0);
  expect(resolvedStyle(result.getByTestId('nested-header').props.style).paddingTop).toBe(0);
  expect(resolvedStyle(result.getByTestId('explicit-header').props.style).paddingTop).toBe(47);
  expect(resolvedStyle(result.getByTestId('modal-header').props.style).paddingTop).toBe(47);
  expect(JSON.parse(result.getByTestId('content').props.children)).toEqual({
    physical,
    content: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  expect(JSON.parse(result.getByTestId('modal').props.children)).toEqual({
    physical,
    content: physical,
  });
});
