import { fireEvent, render } from '@testing-library/react-native';
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
  const screen = render(
    <BloomImage testID="image" source="https://example.com/photo.png" onLoad={onLoad} />,
  );
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
