import { View } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { BloomImage, getImageSize, prefetchImage } from '../image/BloomImage';
import {
  loadBloomImageModule,
  loadBloomImageView,
  type BloomImageViewProps,
} from '../image/bloom-image-view';
import { loadExpoImage } from '../image/expo-image-module';

jest.mock('../image/bloom-image-view', () => ({
  loadBloomImageView: jest.fn(() => null),
  loadBloomImageModule: jest.fn(() => null),
}));
jest.mock('../image/expo-image-module', () => ({ loadExpoImage: jest.fn(() => null) }));

const NativeView = ({ testID }: BloomImageViewProps) => <View testID={testID} />;

beforeEach(() => {
  jest.mocked(loadBloomImageView).mockReturnValue(NativeView);
  jest.mocked(loadBloomImageModule).mockReturnValue(null);
});

it("draws Bloom's native image view first, with the native view's props", () => {
  const ExpoRenderer = jest.fn(() => null);
  jest.mocked(loadExpoImage).mockReturnValue(ExpoRenderer);
  const onLoad = jest.fn();
  const onError = jest.fn();
  const tree = render(
    <BloomImage
      testID="image"
      source={{ uri: 'https://example.com/a.jpg', headers: { Authorization: 'Bearer t' } }}
      contentFit="contain"
      transition={200}
      recyclingKey="a"
      tintColor="#ff0000"
      alt="A photo"
      onLoad={onLoad}
      onError={onError}
    />,
  );
  const view = tree.UNSAFE_getByType(NativeView);
  expect(view.props).toMatchObject({
    source: 'https://example.com/a.jpg',
    headers: ['Authorization', 'Bearer t'],
    contentFit: 'contain',
    transition: 200,
    cachePolicy: 'memory-disk',
    recyclingKey: 'a',
    blurRadius: 0,
    accessibilityLabel: 'A photo',
  });
  expect(typeof view.props.tint).toBe('number');
  expect(view.props.tint).not.toBe(0);
  act(() => view.props.onLoad({ nativeEvent: { width: 400, height: 300 } }));
  act(() => view.props.onError({ nativeEvent: { error: 'gone' } }));
  expect(onLoad).toHaveBeenCalledWith({ width: 400, height: 300 });
  expect(onError).toHaveBeenCalledWith({ error: 'gone' });
  expect(ExpoRenderer).not.toHaveBeenCalled();
});

it('gives the native view a bare URI and no tint by default', () => {
  const tree = render(<BloomImage source="https://example.com/b.png" />);
  const view = tree.UNSAFE_getByType(NativeView);
  expect(view.props).toMatchObject({
    source: 'https://example.com/b.png',
    headers: [],
    contentFit: 'cover',
    transition: 0,
    tint: 0,
  });
  tree.rerender(<BloomImage source={null} />);
  expect(tree.UNSAFE_getByType(NativeView).props.source).toBeUndefined();
});

it("prefetches and sizes through the native view's cache module", async () => {
  const prefetch = jest.fn(() => Promise.resolve(true));
  const size = jest.fn(() => Promise.resolve([640, 480]));
  jest.mocked(loadBloomImageModule).mockReturnValue({ prefetch, size });
  await expect(prefetchImage('https://example.com/c.jpg')).resolves.toBe(true);
  expect(prefetch).toHaveBeenCalledWith(['https://example.com/c.jpg'], false);
  await expect(getImageSize('https://example.com/c.jpg')).resolves.toEqual({
    width: 640,
    height: 480,
  });
});
