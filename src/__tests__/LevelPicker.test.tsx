import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { LevelPicker } from '../level-picker';
import {
  LEVEL_STOP_INSET,
  LEVEL_THUMB_SIZE,
  levelFromOffset,
  levelStopPosition,
} from '../level-picker/constants';

const LEVELS = ['Draft', 'Standard', 'Fine', 'Very fine', 'Maximum'];
const TRACK_WIDTH = 200;

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** A stop's centre in pixels, on a rail of {@link TRACK_WIDTH}. */
function centreOf(index: number, count = LEVELS.length): number {
  const { percent, offset } = levelStopPosition(index, count);
  return (percent / 100) * TRACK_WIDTH + offset;
}

/**
 * The `left` a node was positioned at.
 *
 * `styled()` hands react-native an ARRAY — the inline geometry, then a
 * `{ $$css: true, className }` entry — so reading `style.left` off the prop
 * finds nothing, and finds it just as silently when the geometry is right.
 */
function leftOf(node: { props: Record<string, unknown> }): number | undefined {
  const style = node.props.style;
  const entries = Array.isArray(style) ? style : [style];
  for (const entry of entries) {
    const left = (entry as { left?: number } | null)?.left;
    if (typeof left === 'number') return left;
  }
  return undefined;
}

/** The rail's own width, which nothing in this environment lays out. */
function layOutTrack(node: { props: Record<string, unknown> }, width = TRACK_WIDTH): void {
  fireEvent(node as never, 'layout', {
    nativeEvent: { layout: { width, height: 24, x: 0, y: 0 } },
  });
}

/**
 * The stop geometry, which BOTH forks render from — the web one as a `calc()`
 * string, the native one as a measured pixel offset. Testing it here rather
 * than through either fork is the point: it is the thing they have to agree
 * about, and a rendered assertion in one of them says nothing about the other.
 */
describe('levelStopPosition', () => {
  it('insets the first and last stop, and leaves the middle alone', () => {
    expect(levelStopPosition(0, 5)).toEqual({ percent: 0, offset: LEVEL_STOP_INSET });
    expect(levelStopPosition(4, 5)).toEqual({ percent: 100, offset: -LEVEL_STOP_INSET });
    expect(levelStopPosition(2, 5)).toEqual({ percent: 50, offset: 0 });
  });

  it('spaces the stops evenly whatever the count', () => {
    expect(levelStopPosition(1, 3).percent).toBe(50);
    expect(levelStopPosition(1, 5).percent).toBe(25);
    expect(levelStopPosition(3, 9).percent).toBe(37.5);
  });

  it('parks a single stop at the start rather than dividing by zero', () => {
    expect(levelStopPosition(0, 1)).toEqual({ percent: 0, offset: LEVEL_STOP_INSET });
  });

  it('keeps the knob on the rail at both ends', () => {
    // The property the inset exists for, stated in pixels: a 30px knob centred
    // on the first stop of a 200px rail starts at -2, not -15.
    const first = levelStopPosition(0, 5);
    const last = levelStopPosition(4, 5);
    const centre = (p: { percent: number; offset: number }): number =>
      (p.percent / 100) * TRACK_WIDTH + p.offset;
    expect(centre(first) - LEVEL_THUMB_SIZE / 2).toBe(-2);
    expect(centre(last) + LEVEL_THUMB_SIZE / 2).toBe(TRACK_WIDTH + 2);
  });
});

describe('levelFromOffset', () => {
  it('reads back the stop each position was drawn at', () => {
    // The round trip is the real assertion: a hit map that ignores the inset
    // still passes at the middle and fails here, at the two ends, which is
    // exactly where a user aiming for "least" or "most" clicks.
    for (let index = 0; index < LEVELS.length; index += 1) {
      const { percent, offset } = levelStopPosition(index, LEVELS.length);
      const centre = (percent / 100) * TRACK_WIDTH + offset;
      expect(levelFromOffset(centre, TRACK_WIDTH, LEVELS.length)).toBe(index);
    }
  });

  it('snaps to the nearest stop, not the one before it', () => {
    const between = (centreOf(1) + centreOf(2)) / 2;
    // Either side of halfway between stops 1 and 2 rounds the way it fell.
    expect(levelFromOffset(between + 2, TRACK_WIDTH, LEVELS.length)).toBe(2);
    expect(levelFromOffset(between - 2, TRACK_WIDTH, LEVELS.length)).toBe(1);
  });

  it('clamps outside the rail instead of running off the ends', () => {
    expect(levelFromOffset(-500, TRACK_WIDTH, 5)).toBe(0);
    expect(levelFromOffset(5000, TRACK_WIDTH, 5)).toBe(4);
  });

  it('answers 0 for a rail that has not been laid out yet', () => {
    expect(levelFromOffset(50, 0, 5)).toBe(0);
  });
});

describe('LevelPicker (native)', () => {
  it('names the rail and states its value the way both platforms read', () => {
    const { getByTestId } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={2}
        onValueChange={() => {}}
      />,
    );
    const track = getByTestId('picker-track');
    expect(track.props.accessibilityRole).toBe('adjustable');
    expect(track.props.accessibilityLabel).toBe('Quality');
    // The FLAT props: react-native-web reads nothing else, and React Native
    // folds these back into `accessibilityValue`.
    expect(track.props['aria-valuemin']).toBe(0);
    expect(track.props['aria-valuemax']).toBe(LEVELS.length - 1);
    expect(track.props['aria-valuenow']).toBe(2);
  });

  it('announces the level by NAME, not as an index', () => {
    const { getByTestId } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={3}
        onValueChange={() => {}}
      />,
    );
    expect(getByTestId('picker-track').props['aria-valuetext']).toBe('Very fine');
  });

  it('draws the knob at the stop the value names', () => {
    const { getByTestId, rerender } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
      />,
    );
    layOutTrack(getByTestId('picker-track'));
    expect(leftOf(getByTestId('picker-thumb'))).toBe(LEVEL_STOP_INSET - LEVEL_THUMB_SIZE / 2);

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LevelPicker
          testID="picker"
          accessibilityLabel="Quality"
          levels={LEVELS}
          value={4}
          onValueChange={() => {}}
        />
      </BloomThemeProvider>,
    );
    expect(leftOf(getByTestId('picker-thumb'))).toBe(
      TRACK_WIDTH - LEVEL_STOP_INSET - LEVEL_THUMB_SIZE / 2,
    );
  });

  it('renders no rail furniture before the rail has a width', () => {
    // The positive control for the test above: the knob is absent until a
    // layout arrives, so "it is at the right offset" cannot be satisfied by a
    // stale node, and a piled-up first frame is not what ships.
    const { queryByTestId, getByTestId } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
      />,
    );
    expect(queryByTestId('picker-thumb')).toBeNull();
    layOutTrack(getByTestId('picker-track'));
    expect(queryByTestId('picker-thumb')).not.toBeNull();
  });

  it('exposes increment and decrement, which is what an adjustable offers', () => {
    const onValueChange = jest.fn();
    const { getByTestId } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={1}
        onValueChange={onValueChange}
      />,
    );
    const track = getByTestId('picker-track');
    expect(track.props.accessibilityActions).toEqual([
      { name: 'increment' },
      { name: 'decrement' },
    ]);
    fireEvent(track, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onValueChange).toHaveBeenLastCalledWith(2);
    fireEvent(track, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onValueChange).toHaveBeenLastCalledWith(0);
  });

  it('does not step past either end', () => {
    const onValueChange = jest.fn();
    const { getByTestId } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={onValueChange}
      />,
    );
    fireEvent(getByTestId('picker-track'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('discloses the details from the summary row', () => {
    const onExpandedChange = jest.fn();
    const { getByTestId, getByText } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        detailsLabel="Advanced"
        onExpandedChange={onExpandedChange}>
        <></>
      </LevelPicker>,
    );
    const summary = getByTestId('picker-summary');
    expect(getByText('Advanced')).toBeTruthy();
    expect(summary.props['aria-expanded']).toBe(false);
    fireEvent.press(summary);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(getByTestId('picker-summary').props['aria-expanded']).toBe(true);
  });

  it('hides the region that is not showing from assistive technology', () => {
    // Asserted through the QUERY rather than by reading the prop back: the
    // library's queries skip what `aria-hidden` hides, so this fails if the
    // region is merely painted at zero height — which is what a collapsed
    // clip looks like to everything except a screen reader.
    const { queryByTestId, rerender } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        expanded={false}
      />,
    );
    expect(queryByTestId('picker-details')).toBeNull();
    expect(queryByTestId('picker-track')).not.toBeNull();
    // Positive control, in the same currency: the region IS in the tree, so
    // "not found" above is the hiding and not a missing node.
    expect(queryByTestId('picker-details', { includeHiddenElements: true })).not.toBeNull();

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LevelPicker
          testID="picker"
          accessibilityLabel="Quality"
          levels={LEVELS}
          value={0}
          onValueChange={() => {}}
          expanded
        />
      </BloomThemeProvider>,
    );
    expect(queryByTestId('picker-details')).not.toBeNull();
    expect(queryByTestId('picker-track')).toBeNull();
    expect(queryByTestId('picker-track', { includeHiddenElements: true })).not.toBeNull();
  });

  it('renders the details rows it is given', () => {
    const { getByText } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        expanded>
        <React.Fragment>
          <></>
        </React.Fragment>
      </LevelPicker>,
    );
    expect(getByText('Details')).toBeTruthy();
  });

  it('draws the end captions only when it is given them', () => {
    const { queryByTestId } = renderWithTheme(
      <LevelPicker
        testID="picker"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
      />,
    );
    expect(queryByTestId('picker-captions', { includeHiddenElements: true })).toBeNull();

    const withCaptions = renderWithTheme(
      <LevelPicker
        testID="captioned"
        accessibilityLabel="Quality"
        levels={LEVELS}
        value={0}
        onValueChange={() => {}}
        minLabel="Faster"
        maxLabel="Sharper"
      />,
    );
    // `includeHiddenElements`, because the captions are `aria-hidden`: the
    // level's own name is what a screen reader reads, and a caption repeating
    // the direction of the scale would be a second, competing announcement.
    const options = { includeHiddenElements: true } as const;
    expect(withCaptions.queryByTestId('captioned-captions', options)).not.toBeNull();
    expect(withCaptions.getByText('Faster', options)).toBeTruthy();
    expect(withCaptions.getByText('Sharper', options)).toBeTruthy();
  });
});
