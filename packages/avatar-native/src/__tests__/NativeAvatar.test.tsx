import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { NativeAvatar } from '../NativeAvatar';
const mockAttachment = {
  contextId: 1,
  surfaceId: 9,
  update: jest.fn(),
  dispose: jest.fn(),
  resize: jest.fn(),
  visibility: jest.fn(),
  surfaceReady: jest.fn(),
  snapshot: jest.fn(),
  pointerDown: jest.fn(() => true),
  pointerMove: jest.fn(),
  pointerEnd: jest.fn(),
  pointerLeave: jest.fn(),
  react: jest.fn(),
};
jest.mock('../pool', () => ({ attachNativeAvatar: () => Promise.resolve(mockAttachment) }));
jest.mock('../bridge', () => ({
  NativeView: (props: object) => require('react').createElement('NativeGPU', props),
}));
let tree: ReactTestRenderer;
const host = () =>
  tree.root.findAll(
    (node) => typeof node.type === 'string' && typeof node.props.onLayout === 'function',
  )[0]!;
const event = (x: number, y: number) => ({ nativeEvent: { locationX: x, locationY: y } });
beforeEach(async () => {
  jest.clearAllMocks();
  await act(async () => {
    tree = create(
      <NativeAvatar
        runtimeUrl="https://example.test/runtime.mjs"
        value={{ character: 'blue', reduced: false, interactive: true }}
        onError={jest.fn()}
      />,
    );
  });
  await act(async () =>
    host().props.onLayout({ nativeEvent: { layout: { width: 64, height: 64 } } }),
  );
});
afterEach(() => act(() => tree.unmount()));
it('rejects a distant release even when the platform did not deliver an intervening move event', () => {
  act(() => {
    host().props.onResponderGrant(event(10, 10));
    host().props.onResponderRelease(event(20, 10));
  });
  expect(mockAttachment.react).not.toHaveBeenCalled();
  act(() => {
    host().props.onResponderGrant(event(10, 10));
    host().props.onResponderRelease(event(12, 10));
  });
  expect(mockAttachment.react).toHaveBeenCalledTimes(1);
});
it('does not react on a cancelled drag and forwards cancellation without final coordinates', () => {
  act(() => {
    host().props.onResponderGrant(event(10, 10));
    host().props.onResponderTerminate();
  });
  expect(mockAttachment.pointerEnd).toHaveBeenLastCalledWith(undefined, undefined);
  expect(mockAttachment.react).not.toHaveBeenCalled();
});
