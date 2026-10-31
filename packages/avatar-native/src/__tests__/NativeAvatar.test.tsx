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
const mockAttach = jest.fn(() => Promise.resolve(mockAttachment));
jest.mock('../pool', () => ({ attachNativeAvatar: () => mockAttach() }));
jest.mock('../bridge', () => ({
  NativeView: (props: object) => require('react').createElement('NativeGPU', props),
}));
const mockError = jest.fn();
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
        onError={mockError}
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

it('settles a native surface allocation failure once and ignores events from the removed view', () => {
  const failed = tree.root.findByType('NativeGPU' as any).props.onSurfaceError;
  act(() => failed());
  expect(mockError).toHaveBeenCalledTimes(1);
  expect(tree.root.findAllByType('NativeGPU' as any)).toHaveLength(0);
  act(() => failed());
  expect(mockError).toHaveBeenCalledTimes(1);
});

it('retains the same attachment across a collapsed layout instead of reseeding motion on return', async () => {
  expect(mockAttach).toHaveBeenCalledTimes(1);
  await act(async () =>
    host().props.onLayout({ nativeEvent: { layout: { width: 0, height: 0 } } }),
  );
  expect(mockAttachment.visibility).toHaveBeenLastCalledWith(false);
  await act(async () =>
    host().props.onLayout({ nativeEvent: { layout: { width: 64, height: 64 } } }),
  );
  expect(mockAttach).toHaveBeenCalledTimes(1);
});
