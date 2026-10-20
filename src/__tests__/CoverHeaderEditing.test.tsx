import type React from 'react';
import { Platform, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { CoverHeader, CoverImage, CoverFill, type CoverHeaderProps } from '../cover-header';
import { BloomImage } from '../image';
import { Button } from '../button';
import { Surface } from '../surface';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { coverGeometry, dragCoverPosition, coverSourceIdentity } from '../cover-header/geometry';
import { resolvedStyle } from './support/rendered-style';

const source = { uri: 'https://example.com/cover.jpg', headers: { Authorization: 'test' } };
function wrap(ui: React.ReactElement) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>
  );
}
function header(props: Partial<CoverHeaderProps> = {}) {
  return (
    <CoverHeader
      testID="cover"
      coverSource={source}
      repositionable
      onCoverPositionCommit={() => {}}
      {...props}
    />
  );
}
function load(
  ui: ReturnType<typeof render>,
  width = 400,
  height = 200,
  naturalWidth = 400,
  naturalHeight = 400,
) {
  fireEvent(ui.getByTestId('cover-cover-image-frame', { includeHiddenElements: true }), 'layout', {
    nativeEvent: { layout: { width, height } },
  });
  act(() =>
    ui.UNSAFE_getByType(BloomImage).props.onLoad({ width: naturalWidth, height: naturalHeight }),
  );
}
function drag(ui: ReturnType<typeof render>, x: number, y: number) {
  const gesture = ui.UNSAFE_getByType(GestureDetector).props.gesture;
  act(() => gesture.__handlers.onBegin({}));
  act(() => gesture.__handlers.onUpdate({ translationX: x, translationY: y }));
}
const previousOS = Platform.OS;
afterEach(() => {
  Platform.OS = previousOS;
});

it('converts pointer pixels using actual overflow, clamps and preserves axes without crop', () => {
  const portrait = coverGeometry(
    { width: 400, height: 200 },
    { width: 400, height: 400 },
    'cover',
  )!;
  expect(portrait).toEqual({ width: 400, height: 400, overflowX: 0, overflowY: 200 });
  expect(dragCoverPosition({ x: 0.5, y: 0.5 }, { x: 100, y: 50 }, portrait, 'both')).toEqual({
    x: 0.5,
    y: 0.25,
  });
  expect(dragCoverPosition({ x: 0.5, y: 0.5 }, { x: 0, y: -500 }, portrait, 'vertical').y).toBe(1);
  const landscape = coverGeometry(
    { width: 200, height: 200 },
    { width: 800, height: 400 },
    'cover',
  )!;
  expect(dragCoverPosition({ x: 0.5, y: 0.5 }, { x: 50, y: 20 }, landscape, 'vertical')).toEqual({
    x: 0.5,
    y: 0.5,
  });
  expect(dragCoverPosition({ x: 0.5, y: 0.5 }, { x: 50, y: 20 }, landscape, 'both').x).toBe(0.25);
  expect(
    coverGeometry({ width: 400, height: 200 }, { width: 400, height: 400 }, 'contain'),
  ).toEqual({ width: 200, height: 200, overflowX: 0, overflowY: 0 });
});

it('keeps one gesture host and image, changes only draft during drag, and commits on Save', async () => {
  const commit = jest.fn();
  const preview = jest.fn();
  const ui = render(
    wrap(header({ onCoverPositionCommit: commit, onCoverPositionChange: preview })),
  );
  load(ui);
  const host = ui.getByTestId('cover-position-editor');
  fireEvent.press(ui.getByText('Reposition'));
  expect(ui.getByTestId('cover-position-editor')).toBe(host);
  expect(host.props.collapsable).toBe(false);
  drag(ui, 0, 50);
  expect(ui.UNSAFE_getByType(CoverImage).props.position).toEqual({ x: 0.5, y: 0.25 });
  expect(preview).toHaveBeenLastCalledWith({ x: 0.5, y: 0.25 });
  expect(commit).not.toHaveBeenCalled();
  await act(async () => fireEvent.press(ui.getByText('Save')));
  expect(commit).toHaveBeenCalledWith({ x: 0.5, y: 0.25 });
  expect(ui.queryByText('Cancel')).toBeNull();
});

it('Cancel restores the controlled position without persistence', () => {
  const commit = jest.fn();
  const ui = render(
    wrap(header({ coverPosition: { x: 0.5, y: 0.8 }, onCoverPositionCommit: commit })),
  );
  load(ui);
  fireEvent.press(ui.getByText('Reposition'));
  drag(ui, 0, 100);
  fireEvent.press(ui.getByText('Cancel'));
  expect(ui.UNSAFE_getByType(CoverImage).props.position.y).toBe(0.8);
  expect(commit).not.toHaveBeenCalled();
});

it('retains failed draft for retry and prevents duplicate pending saves', async () => {
  let reject: (error: Error) => void = () => {};
  const commit = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, fail) => {
          reject = fail;
        }),
    )
    .mockResolvedValue(undefined);
  const ui = render(wrap(header({ onCoverPositionCommit: commit })));
  load(ui);
  fireEvent.press(ui.getByText('Reposition'));
  drag(ui, 0, 50);
  fireEvent.press(ui.getByText('Save'));
  fireEvent.press(ui.getByText('Save', { includeHiddenElements: true }));
  expect(commit).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('offline')));
  expect(ui.getByRole('alert').props.children).toContain('Could not save');
  expect(ui.UNSAFE_getByType(CoverImage).props.position.y).toBe(0.25);
  await act(async () => fireEvent.press(ui.getByText('Save')));
  expect(commit).toHaveBeenLastCalledWith({ x: 0.5, y: 0.25 });
  expect(ui.queryByText('Cancel')).toBeNull();
});

it('invalidates edits and late asynchronous results when the image changes or unmounts', async () => {
  let finish: () => void = () => {};
  const commit = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const ui = render(wrap(header({ onCoverPositionCommit: commit })));
  load(ui);
  fireEvent.press(ui.getByText('Reposition'));
  fireEvent.press(ui.getByText('Save'));
  ui.rerender(
    wrap(header({ coverSource: 'https://example.com/new.jpg', onCoverPositionCommit: commit })),
  );
  expect(ui.queryByText('Cancel')).toBeNull();
  load(ui);
  fireEvent.press(ui.getByText('Reposition'));
  await act(async () => finish());
  expect(ui.getByText('Cancel')).toBeTruthy();
  fireEvent.press(ui.getByText('Save'));
  ui.unmount();
  await act(async () => finish());
});

it('offers native adjustable actions and excludes horizontal motion for vertical persistence', () => {
  Platform.OS = 'ios';
  const ui = render(wrap(header({ repositionAxes: 'vertical' })));
  load(ui);
  fireEvent.press(ui.getByText('Reposition'));
  const host = ui.getByTestId('cover-position-editor');
  expect(host.props.accessibilityRole).toBe('adjustable');
  expect(host.props.onKeyDown).toBeUndefined();
  expect(host.props.accessibilityActions.map((action: { name: string }) => action.name)).toEqual([
    'increment',
    'decrement',
  ]);
  fireEvent(host, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
  expect(ui.UNSAFE_getByType(CoverImage).props.position.y).toBe(0.45);
});

it('supports web keyboard steps, bounds, Escape and explicit Enter commit', async () => {
  Platform.OS = 'web';
  const commit = jest.fn();
  const ui = render(wrap(header({ onCoverPositionCommit: commit })));
  load(ui);
  fireEvent.press(ui.getByText('Reposition'));
  const key = (key: string, shiftKey = false) =>
    fireEvent(ui.getByTestId('cover-position-editor'), 'keyDown', {
      nativeEvent: { key, shiftKey },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    });
  key('ArrowDown', true);
  expect(ui.UNSAFE_getByType(CoverImage).props.position.y).toBe(0.3);
  key('End');
  expect(ui.UNSAFE_getByType(CoverImage).props.position.y).toBe(1);
  key('Home');
  expect(ui.UNSAFE_getByType(CoverImage).props.position.y).toBe(0);
  key('Escape');
  expect(commit).not.toHaveBeenCalled();
  fireEvent.press(ui.getByText('Reposition'));
  key('ArrowUp');
  await act(async () => key('Enter'));
  expect(commit).toHaveBeenCalledWith({ x: 0.5, y: 0.55 });
});

it('does not offer crop editing for custom fills, contain, readonly, or uncropped images', () => {
  for (const props of [
    { cover: <View /> },
    { coverFit: 'contain' as const },
    { repositionable: false },
  ]) {
    const ui = render(wrap(header(props)));
    expect(ui.queryByText('Reposition')).toBeNull();
    ui.unmount();
  }
  const ui = render(wrap(header()));
  load(ui, 400, 200, 400, 200);
  fireEvent.press(ui.getByText('Reposition'));
  expect(ui.queryByText('Cancel')).toBeNull();
});

it('CoverImage passes signed sources, clamps crop, recenters contain and resets natural size on source changes', () => {
  const ui = render(<CoverImage source={source} position={{ x: -2, y: 4 }} testID="image" />);
  fireEvent(ui.getByTestId('image-frame', { includeHiddenElements: true }), 'layout', {
    nativeEvent: { layout: { width: 400, height: 200 } },
  });
  act(() => ui.UNSAFE_getByType(BloomImage).props.onLoad({ width: 400, height: 400 }));
  expect(ui.UNSAFE_getByType(BloomImage).props.source).toBe(source);
  expect(resolvedStyle(ui.UNSAFE_getByType(BloomImage).props.style)).toMatchObject({
    top: -200,
    left: 0,
    width: 400,
  });
  ui.rerender(<CoverImage source={source} contentFit="contain" testID="image" />);
  expect(resolvedStyle(ui.UNSAFE_getByType(BloomImage).props.style)).toMatchObject({
    left: 100,
    top: 0,
    width: 200,
  });
  ui.rerender(<CoverImage source="https://example.com/new.jpg" testID="image" />);
  expect(resolvedStyle(ui.UNSAFE_getByType(BloomImage).props.style).width).toBeUndefined();
});

it.each(['web', 'ios'] as const)('CoverFill draws the same actual gradient on %s', (platform) => {
  Platform.OS = platform;
  const ui = render(
    <CoverFill
      gradient={{ from: '#123456', to: '#abcdef' }}
      testID="fill"
      style={{ height: 80 }}
    />,
  );
  const style = resolvedStyle(ui.getByTestId('fill', { includeHiddenElements: true }).props.style);
  expect(style[platform === 'web' ? 'backgroundImage' : 'experimental_backgroundImage']).toBe(
    'linear-gradient(135deg, #123456 0%, #abcdef 100%)',
  );
  expect(style.height).toBe(80);
});

it('preserves an active draft across signed URL renewal with stable asset identity', () => {
  const first = { uri: 'first.jpg', cacheKey: 'same-asset' };
  const renewed = { uri: 'renewed.jpg', cacheKey: 'same-asset' };
  expect(coverSourceIdentity(first)).toBe(coverSourceIdentity(renewed));
  const ui = render(
    wrap(header({ coverSource: { uri: 'https://example.com/first' }, coverSourceKey: 'asset1' })),
  );
  load(ui);
  fireEvent.press(ui.getByText('Reposition'));
  drag(ui, 0, 50);
  ui.rerender(
    wrap(header({ coverSource: { uri: 'https://example.com/renewed' }, coverSourceKey: 'asset1' })),
  );
  expect(ui.getByText('Cancel')).toBeTruthy();
  expect(ui.UNSAFE_getByType(CoverImage).props.position.y).toBe(0.25);
  expect(resolvedStyle(ui.UNSAFE_getByType(BloomImage).props.style).height).toBe(400);
  ui.rerender(
    wrap(header({ coverSource: { uri: 'https://example.com/other' }, coverSourceKey: 'asset2' })),
  );
  expect(ui.queryByText('Cancel')).toBeNull();
});

it('owns the standard Change cover action without a second material around buttons', () => {
  const change = jest.fn();
  const ui = render(wrap(header({ onChangeCover: change, repositionable: false })));
  fireEvent.press(ui.getByText('Change cover'));
  expect(change).toHaveBeenCalledTimes(1);
  const action = ui.UNSAFE_getByType(Button);
  expect(action.props).toMatchObject({ appearance: 'subtle', tone: 'neutral' });
  let ancestor = action.parent;
  while (ancestor) {
    expect(ancestor.type).not.toBe(Surface);
    ancestor = ancestor.parent;
  }
  ui.rerender(wrap(header({ repositionable: false })));
  expect(ui.queryByText('Change cover')).toBeNull();
});

it('lets the browser scroll until explicit crop editing and restores panning on cancel or permission loss', () => {
  Platform.OS = 'web';
  const ui = render(wrap(header({ repositionable: false })));
  const touchPolicy = () => ui.UNSAFE_getByType(GestureDetector).props.gesture.__config;
  expect(touchPolicy()).toMatchObject({ enabled: false, touchAction: 'auto' });
  ui.rerender(wrap(header()));
  load(ui);
  expect(touchPolicy()).toMatchObject({ enabled: false, touchAction: 'auto' });
  fireEvent.press(ui.getByText('Reposition'));
  expect(touchPolicy()).toMatchObject({ enabled: true, touchAction: 'none' });
  fireEvent.press(ui.getByText('Cancel'));
  expect(touchPolicy()).toMatchObject({ enabled: false, touchAction: 'auto' });
  fireEvent.press(ui.getByText('Reposition'));
  ui.rerender(wrap(header({ repositionable: false })));
  expect(touchPolicy()).toMatchObject({ enabled: false, touchAction: 'auto' });
});
