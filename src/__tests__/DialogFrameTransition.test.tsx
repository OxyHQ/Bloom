import { Text, Pressable } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import {
  DialogMorphContent,
  useDialogFrame,
  useDialogMorph,
  type DialogFrame,
} from '../dialog/DialogMorph';

const mockWrites: { initial: unknown; value: unknown }[] = [];
let mockReduced = false;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReduced,
}));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const tracked = new WeakSet<object>();
  return {
    ...base,
    __esModule: true,
    useSharedValue: (initial: unknown) => {
      const shared = base.useSharedValue(initial);
      if (!tracked.has(shared)) {
        tracked.add(shared);
        let current = shared.value;
        Object.defineProperty(shared, 'value', {
          get: () => current,
          set: (value) => {
            mockWrites.push({ initial, value });
            current = value;
          },
        });
      }
      return shared;
    },
  };
});
function Frame({ frame, press }: { frame: DialogFrame; press: () => void }) {
  useDialogFrame(frame);
  return (
    <Pressable onPress={press}>
      <Text>{frame.key}</Text>
    </Pressable>
  );
}
function Fixture({ frame, press }: { frame: DialogFrame; press: () => void }) {
  const morph = useDialogMorph({ enabled: true, measurable: true, maxHeight: 800 });
  return (
    <DialogMorphContent morph={morph}>
      <Frame frame={frame} press={press} />
    </DialogMorphContent>
  );
}
beforeEach(() => {
  mockWrites.length = 0;
  mockReduced = false;
});

it('settles only new frames in their direction without hiding or delaying real content', () => {
  const press = jest.fn();
  const screen = render(<Fixture frame={{ key: 'root' }} press={press} />);
  expect(mockWrites).not.toContainEqual({ initial: 1, value: 0.92 });
  screen.rerender(<Fixture frame={{ key: 'next', direction: 'forward' }} press={press} />);
  fireEvent.press(screen.getByText('next'));
  expect(press).toHaveBeenCalledTimes(1);
  expect(mockWrites).toContainEqual({ initial: 1, value: 0.92 });
  expect(mockWrites).not.toContainEqual({ initial: 1, value: 0 });
  expect(mockWrites).toContainEqual({ initial: 0, value: 8 });
  mockWrites.length = 0;
  screen.rerender(<Fixture frame={{ key: 'next', direction: 'forward' }} press={press} />);
  expect(mockWrites).not.toContainEqual({ initial: 1, value: 0.92 });
  screen.rerender(<Fixture frame={{ key: 'root', direction: 'backward' }} press={press} />);
  expect(mockWrites).toContainEqual({ initial: 0, value: -8 });
});

it.each(['none', 'reduced'] as const)(
  'skips content motion for %s while retaining the new screen',
  (mode) => {
    const press = jest.fn();
    const screen = render(<Fixture frame={{ key: 'root' }} press={press} />);
    mockReduced = mode === 'reduced';
    screen.rerender(
      <Fixture
        frame={{ key: 'next', direction: mode === 'none' ? 'none' : 'forward' }}
        press={press}
      />,
    );
    expect(screen.getByText('next')).toBeTruthy();
    expect(mockWrites).not.toContainEqual({ initial: 1, value: 0.92 });
    expect(mockWrites).not.toContainEqual({ initial: 0, value: 8 });
  },
);
