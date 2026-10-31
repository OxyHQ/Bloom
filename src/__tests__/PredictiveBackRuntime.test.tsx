import { StrictMode } from 'react';
import { render } from '@testing-library/react-native';
import { BackHandler, Platform } from 'react-native';
import { usePredictiveBackRuntime } from '../tab-pager/expo-router/use-predictive-back-runtime';

let mockNativeAvailable = true;
jest.mock('../tab-pager/expo-router/PredictiveBackHost', () => ({
  isPredictiveBackAvailable: () => mockNativeAvailable,
}));
const navigation = { registerNativeBackNavigation() {}, dispatchWithResult() {} };
const setter = jest.fn();
const handler = BackHandler as typeof BackHandler & {
  setNativeNavigationEnabled?: (enabled: boolean) => void;
};
function Owner({ supported = true }: { supported?: boolean }) {
  usePredictiveBackRuntime(supported ? navigation : {});
  return null;
}
beforeEach(() => {
  Platform.OS = 'android';
  mockNativeAvailable = true;
  setter.mockClear();
  handler.setNativeNavigationEnabled = setter;
});
afterEach(() => {
  delete handler.setNativeNavigationEnabled;
});
test('new JavaScript on an older binary never opts into native routing', () => {
  mockNativeAvailable = false;
  render(<Owner />);
  expect(setter).not.toHaveBeenCalled();
});
test('unsupported router or RN API preserves the existing Back path', () => {
  const unsupported = render(<Owner supported={false} />);
  expect(setter).not.toHaveBeenCalled();
  unsupported.unmount();
  delete handler.setNativeNavigationEnabled;
  render(<Owner />);
  expect(setter).not.toHaveBeenCalled();
});
test('web and iOS do not change global Back ownership', () => {
  Platform.OS = 'web';
  const web = render(<Owner />);
  web.unmount();
  Platform.OS = 'ios';
  render(<Owner />);
  expect(setter).not.toHaveBeenCalled();
});
test('nested providers release runtime ownership only after the final unmount', () => {
  const first = render(<Owner />);
  const second = render(<Owner />);
  expect(setter.mock.calls).toEqual([[true]]);
  first.unmount();
  expect(setter.mock.calls).toEqual([[true]]);
  second.unmount();
  expect(setter.mock.calls).toEqual([[true], [false]]);
});
test('StrictMode setup and cleanup leave the runtime balanced', () => {
  const tree = render(
    <StrictMode>
      <Owner />
    </StrictMode>,
  );
  expect(setter.mock.calls[setter.mock.calls.length - 1]).toEqual([true]);
  tree.unmount();
  expect(setter.mock.calls[setter.mock.calls.length - 1]).toEqual([false]);
  expect(setter.mock.calls.filter(([enabled]) => enabled)).toHaveLength(
    setter.mock.calls.filter(([enabled]) => !enabled).length,
  );
});
