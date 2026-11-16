import { AppShell } from '../app-shell';
import React, { createContext, useContext } from 'react';
import { render } from '@testing-library/react-native';
import { Platform, Text, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { Dialog } from '../dialog/Dialog';
import { DetailDialog } from '../dialog/DetailDialog';
import { PortalProvider, PortalOutlet } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';
import { resolvedStyle } from './support/rendered-style';

const RecordContext = createContext('missing');
function Body() {
  return <Text testID="record-state">{useContext(RecordContext)}</Text>;
}
const physical = { top: 24, right: 0, bottom: 34, left: 0 };
const originalOS = Platform.OS;
beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  mockWindowSize({ width: 390, height: 844, scale: 1, fontScale: 1 });
});
afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  jest.restoreAllMocks();
});
function Fixture({ detail = false }: { detail?: boolean }) {
  return (
    <SafeAreaInsetsContext.Provider value={physical}>
      <BloomThemeProvider fonts={false}>
        <PortalProvider>
          <View testID="bounded-origin" style={{ width: 200, height: 250 }}>
            <RecordContext.Provider value="Product-owned record">
              {detail ? (
                <DetailDialog open onClose={() => {}} testID="detail" label="Task" header="Task">
                  <Body />
                </DetailDialog>
              ) : (
                <Dialog open placement="end" testID="side" label="Task">
                  <Body />
                </Dialog>
              )}
            </RecordContext.Provider>
          </View>
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>
    </SafeAreaInsetsContext.Provider>
  );
}

it('native side dialogs escape the trigger panel while preserving its record provider', () => {
  const view = render(<Fixture />);
  expect(view.getByTestId('record-state').props.children).toBe('Product-owned record');
  expect(
    view
      .getByTestId('bounded-origin', { includeHiddenElements: true })
      .findAll((node) => typeof node.type === 'string' && node.props.testID === 'side'),
  ).toHaveLength(0);
  expect(view.getByTestId('side')).toBeTruthy();
});

it('native detail geometry consumes device edges once and delegates header clearance', () => {
  const view = render(<Fixture detail />);
  const style = resolvedStyle(view.getByTestId('detail').props.style);
  expect(style).toMatchObject({ top: 32, bottom: 42, width: 374 });
  expect(style.height).toBeUndefined();
  expect(resolvedStyle(view.getByTestId('detail-header').props.style).paddingTop).toBe(0);
  expect(
    view
      .getByTestId('bounded-origin', { includeHiddenElements: true })
      .findAll((node) => typeof node.type === 'string' && node.props.testID === 'detail'),
  ).toHaveLength(0);
  expect(view.getByTestId('record-state').props.children).toBe('Product-owned record');
});

it('a detail opened from a lower inline panel uses preserved window insets', () => {
  const view = render(
    <SafeAreaInsetsContext.Provider value={physical}>
      <BloomThemeProvider fonts={false}>
        <PortalProvider>
          <AppShell
            layout="workspace"
            presentation="continuous"
            panelLayout={{
              axis: 'vertical',
              panels: [
                { id: 'top', content: <Text>Top</Text> },
                {
                  id: 'lower',
                  content: (
                    <DetailDialog
                      open
                      onClose={() => {}}
                      testID="lower-detail"
                      label="Lower record"
                      header="Record"
                    >
                      <Text>Body</Text>
                    </DetailDialog>
                  ),
                },
              ],
            }}
          />
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>
    </SafeAreaInsetsContext.Provider>,
  );
  expect(resolvedStyle(view.getByTestId('lower-detail').props.style)).toMatchObject({
    top: 32,
    bottom: 42,
  });
  expect(resolvedStyle(view.getByTestId('lower-detail-header').props.style).paddingTop).toBe(0);
});
