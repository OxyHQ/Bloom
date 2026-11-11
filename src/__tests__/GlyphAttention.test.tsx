import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { cancelAnimation, withTiming } from 'react-native-reanimated';
import { GlyphAttention } from '../button/GlyphAttention';

jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    __esModule: true,
    ...base,
    withTiming: jest.fn(base.withTiming),
    cancelAnimation: jest.fn(base.cancelAnimation),
  };
});
let mockReduced = false;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReduced,
}));

it('drives one cancellable native pulse per changed token and suppresses reduced motion', () => {
  jest.mocked(withTiming).mockClear();
  jest.mocked(cancelAnimation).mockClear();
  const draw = (token: number, blocked = false) => (
    <GlyphAttention token={token} blocked={blocked}>
      <Text>Expand</Text>
    </GlyphAttention>
  );
  const screen = render(draw(0));
  const glyph = screen.getByText('Expand');
  expect(withTiming).not.toHaveBeenCalled();
  screen.rerender(draw(1));
  expect(withTiming).toHaveBeenCalledTimes(2);
  expect(withTiming).toHaveBeenNthCalledWith(1, 1.12, expect.objectContaining({ duration: 100 }));
  expect(withTiming).toHaveBeenNthCalledWith(2, 1, expect.objectContaining({ duration: 220 }));
  screen.rerender(draw(1));
  expect(withTiming).toHaveBeenCalledTimes(2);
  screen.rerender(draw(3));
  expect(withTiming).toHaveBeenCalledTimes(4);
  expect(screen.getByText('Expand')).toBe(glyph);
  screen.rerender(draw(4, true));
  screen.rerender(draw(4));
  expect(withTiming).toHaveBeenCalledTimes(4);
  mockReduced = true;
  screen.rerender(draw(5));
  mockReduced = false;
  screen.rerender(draw(5));
  expect(withTiming).toHaveBeenCalledTimes(4);
  screen.rerender(draw(6));
  expect(withTiming).toHaveBeenCalledTimes(6);
  const beforeUnmount = jest.mocked(cancelAnimation).mock.calls.length;
  screen.unmount();
  expect(jest.mocked(cancelAnimation).mock.calls.length).toBeGreaterThan(beforeUnmount);
});
