import React from 'react';
import { act, render } from '@testing-library/react-native';
import { composerLoaderGeometry } from '../composer-loader/shared';

jest.mock('react-native', () => ({
  ...jest.requireActual('../../__mocks__/react-native'),
  Platform: { OS: 'android', Version: 36 },
  UIManager: { getViewManagerConfig: jest.fn() },
  requireNativeComponent: jest.fn(() => 'HardwareLight'),
  processColor: (color: string) => (color === 'unsupported' ? null : 0xffff00ff),
}));
const nativeRuntime = require('react-native');
const mockConfig = nativeRuntime.UIManager.getViewManagerConfig as jest.Mock;
const mockRequire = nativeRuntime.requireNativeComponent as jest.Mock;
const mockPlatform = nativeRuntime.Platform;

function subject() {
  let component: typeof import('../composer-loader/AndroidLight').AndroidLight;
  jest.isolateModules(() => {
    jest.doMock('react', () => React);
    component = require('../composer-loader/AndroidLight').AndroidLight;
  });
  return component!;
}
const geometry = composerLoaderGeometry({
  width: 320,
  height: 52,
  arc: 120,
  line: 2.5,
  bloom: 16,
  bloomStrength: 0.3,
  bloomOnly: false,
  taper: 0.5,
  reverse: false,
  offset: 0,
});
const time = { value: 3.25 } as import('react-native-reanimated').SharedValue<number>;
const props = {
  geometry,
  time,
  speed: 4.5,
  reverse: false,
  colors: Array(5).fill('#ff00ff'),
  intensity: 0.7,
  width: 320,
  height: 52,
};
beforeEach(() => {
  mockPlatform.OS = 'android';
  mockPlatform.Version = 36;
  mockConfig.mockReset().mockReturnValue({});
  mockRequire.mockClear();
});

it.each(['missing', 'throws', 'old-api', 'ios'])('keeps SVG when capability is %s', (reason) => {
  if (reason === 'missing') mockConfig.mockReturnValue(null);
  if (reason === 'throws')
    mockConfig.mockImplementation(() => {
      throw new Error('old host');
    });
  if (reason === 'old-api') mockPlatform.Version = 30;
  if (reason === 'ios') mockPlatform.OS = 'ios';
  const Light = subject();
  const tree = render(
    <Light {...props}>
      <>{'svg fallback'}</>
    </Light>,
  );
  expect(tree.toJSON()).toBe('svg fallback');
  expect(mockRequire).not.toHaveBeenCalled();
  if (reason === 'old-api' || reason === 'ios') expect(mockConfig).not.toHaveBeenCalled();
});

it('hands off to SVG after software Canvas without mutating the owner clock', () => {
  const Light = subject();
  const tree = render(
    <Light {...props}>
      <>{'svg fallback'}</>
    </Light>,
  );
  const native = tree.UNSAFE_root.findByType('HardwareLight' as never);
  expect(native.props.animatedProps.seconds).toBe(3.25);
  expect(native.props.strokes).toHaveLength(42);
  act(() => native.props.onUnsupported());
  expect(tree.toJSON()).toBe('svg fallback');
  expect(time.value).toBe(3.25);
  tree.rerender(
    <Light {...props} width={240}>
      <>{'svg fallback'}</>
    </Light>,
  );
  expect(tree.toJSON()).toBe('svg fallback');
});

it('preserves the SVG path for unsupported colors and dash geometry', () => {
  const Light = subject();
  const tree = render(
    <Light {...props} colors={Array(5).fill('unsupported')}>
      <>{'svg fallback'}</>
    </Light>,
  );
  expect(tree.toJSON()).toBe('svg fallback');
  tree.rerender(
    <Light {...props} geometry={{ ...geometry, strokes: [{ ...geometry.strokes[0]!, dash: 120 }] }}>
      <>{'svg fallback'}</>
    </Light>,
  );
  expect(tree.toJSON()).toBe('svg fallback');
});
