import { Image as NativeImage } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BloomImage } from '../image/BloomImage';

jest.mock('../image/expo-image-module', () => ({ loadExpoImage: () => null }));

it('normalizes native fallback image dimensions', () => {
  const onLoad = jest.fn();
  const screen = render(
    <BloomImage testID="image" source="https://example.com/photo.png" onLoad={onLoad} />,
  );
  fireEvent(screen.getByTestId('image'), 'load', {
    nativeEvent: { source: { width: 640, height: 480, uri: 'https://example.com/photo.png' } },
  });
  expect(onLoad.mock.calls).toEqual([[{ width: 640, height: 480 }]]);
});

it('normalizes RN-web DOM load events using intrinsic, not rendered dimensions', () => {
  const onLoad = jest.fn();
  const screen = render(
    <BloomImage testID="image" source="https://example.com/photo.png" onLoad={onLoad} />,
  );
  fireEvent(screen.getByTestId('image'), 'load', {
    nativeEvent: { target: { naturalWidth: 1200, naturalHeight: 800, width: 60, height: 40 } },
  });
  expect(onLoad.mock.calls).toEqual([[{ width: 1200, height: 800 }]]);
});

it('does not crash if a renderer cannot provide intrinsic dimensions', () => {
  const onLoad = jest.fn();
  const screen = render(<BloomImage testID="image" source={null} onLoad={onLoad} />);
  fireEvent(screen.getByTestId('image'), 'load', { nativeEvent: { target: null } });
  expect(onLoad.mock.calls).toEqual([[{ width: 0, height: 0 }]]);
});

it('also accepts browser load events without a nativeEvent wrapper', () => {
  const onLoad = jest.fn();
  const screen = render(
    <BloomImage testID="image" source="https://example.com/photo.png" onLoad={onLoad} />,
  );
  fireEvent(screen.getByTestId('image'), 'load', {
    target: { naturalWidth: 640, naturalHeight: 480 },
  });
  expect(onLoad).toHaveBeenCalledWith({ width: 640, height: 480 });
});

it('recovers decoded web events without a target through the cached intrinsic-size reader', () => {
  const size = jest.spyOn(NativeImage, 'getSize').mockImplementation((_uri, success) => {
    success(1600, 2400);
  });
  const onLoad = jest.fn();
  const screen = render(
    <BloomImage testID="image" source="https://example.com/portrait.jpg" onLoad={onLoad} />,
  );
  fireEvent(screen.getByTestId('image'), 'load', { nativeEvent: new Event('load') });
  expect(size).toHaveBeenCalledWith(
    'https://example.com/portrait.jpg',
    expect.any(Function),
    expect.any(Function),
  );
  expect(onLoad).toHaveBeenCalledWith({ width: 1600, height: 2400 });
  size.mockRestore();
});

it('ignores a late dimension probe after source change or unmount', () => {
  const results: Array<(width: number, height: number) => void> = [];
  const size = jest.spyOn(NativeImage, 'getSize').mockImplementation((_uri, success) => {
    results.push(success);
  });
  const onLoad = jest.fn();
  const screen = render(<BloomImage testID="image" source="first.jpg" onLoad={onLoad} />);
  fireEvent(screen.getByTestId('image'), 'load', { nativeEvent: {} });
  screen.rerender(<BloomImage testID="image" source="second.jpg" onLoad={onLoad} />);
  act(() => results[0]?.(100, 100));
  expect(onLoad).not.toHaveBeenCalled();
  fireEvent(screen.getByTestId('image'), 'load', { nativeEvent: {} });
  screen.unmount();
  act(() => results[1]?.(200, 200));
  expect(onLoad).not.toHaveBeenCalled();
  size.mockRestore();
});

it('reports unavailable dimensions and errors, and invalidates probes when the image fails', () => {
  let success: (width: number, height: number) => void = () => {};
  let fail: (error: Error) => void = () => {};
  const size = jest.spyOn(NativeImage, 'getSize').mockImplementation((_uri, done, reject) => {
    success = done;
    fail = reject!;
  });
  const onLoad = jest.fn();
  const onError = jest.fn();
  const screen = render(
    <BloomImage testID="image" source="first.jpg" onLoad={onLoad} onError={onError} />,
  );
  fireEvent(screen.getByTestId('image'), 'load', { nativeEvent: {} });
  act(() => fail(new Error('metadata unavailable')));
  expect(onLoad).toHaveBeenCalledWith({ width: 0, height: 0 });
  expect(onError).toHaveBeenCalledWith({ error: 'metadata unavailable' });
  onLoad.mockClear();
  fireEvent(screen.getByTestId('image'), 'load', { nativeEvent: {} });
  fireEvent(screen.getByTestId('image'), 'error', { nativeEvent: { error: 'image unavailable' } });
  act(() => success(100, 100));
  expect(onLoad).not.toHaveBeenCalled();
  expect(onError).toHaveBeenLastCalledWith({ error: 'image unavailable' });
  size.mockRestore();
});
