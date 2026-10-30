import React from 'react';
import { act, render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

// Jest resolves the bare path to the native implementation (`.web` is never picked).
import { AmbientPhoto } from '../ambient-photo/AmbientPhoto';

/** Every photo layer the native tree holds, oldest first, with what it shows. */
function photos(root: ReactTestInstance) {
  // A host component and its rendered element both carry the props: keep one per photo.
  const images = root.findAll(
    (node) => typeof node.props.onLoad === 'function' && node.props.source?.uri,
  );
  return images.filter(
    (node, index) =>
      images.findIndex((other) => other.props.source.uri === node.props.source.uri) === index,
  );
}

const uris = (root: ReactTestInstance) => photos(root).map((node) => node.props.source.uri);

function load(root: ReactTestInstance, uri: string) {
  const image = photos(root).find((node) => node.props.source.uri === uri);
  act(() => image?.props.onLoad({ width: 1280, height: 720 }));
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('holds a new photo invisible until it loads, then reports it shown', () => {
  const onShown = jest.fn();
  const view = render(<AmbientPhoto source="a.jpg" onShown={onShown} />);
  expect(uris(view.UNSAFE_root)).toEqual(['a.jpg']);
  expect(onShown).not.toHaveBeenCalled();

  load(view.UNSAFE_root, 'a.jpg');
  expect(onShown).toHaveBeenCalledWith('a.jpg');
});

it('fades the next photo over the one on screen, then releases the one it covered', () => {
  const view = render(<AmbientPhoto source="a.jpg" fadeMs={1000} />);
  load(view.UNSAFE_root, 'a.jpg');

  view.rerender(<AmbientPhoto source="b.jpg" fadeMs={1000} />);
  expect(uris(view.UNSAFE_root)).toEqual(['a.jpg', 'b.jpg']);
  load(view.UNSAFE_root, 'b.jpg');
  // Both are held while the fade runs...
  expect(uris(view.UNSAFE_root)).toEqual(['a.jpg', 'b.jpg']);

  // ...and the covered photo goes once it is over.
  act(() => jest.advanceTimersByTime(1100));
  expect(uris(view.UNSAFE_root)).toEqual(['b.jpg']);
});

it('replaces a photo still loading, and never shows the one it replaced', () => {
  const onShown = jest.fn();
  const view = render(<AmbientPhoto source="a.jpg" onShown={onShown} />);
  load(view.UNSAFE_root, 'a.jpg');

  view.rerender(<AmbientPhoto source="b.jpg" onShown={onShown} />);
  view.rerender(<AmbientPhoto source="c.jpg" onShown={onShown} />);
  // At most two photos: the one on screen and the newest.
  expect(uris(view.UNSAFE_root)).toEqual(['a.jpg', 'c.jpg']);

  load(view.UNSAFE_root, 'c.jpg');
  expect(onShown.mock.calls.map(([uri]) => uri)).toEqual(['a.jpg', 'c.jpg']);
});

it('is decorative to assistive technology', () => {
  const view = render(<AmbientPhoto source="a.jpg" testID="photo" />);
  // Hidden from assistive technology, so only found when hidden elements are included.
  expect(view.queryByTestId('photo')).toBeNull();
  const host = view.getByTestId('photo', { includeHiddenElements: true });
  expect(host.props.accessibilityElementsHidden).toBe(true);
  expect(host.props.importantForAccessibility).toBe('no-hide-descendants');
});
