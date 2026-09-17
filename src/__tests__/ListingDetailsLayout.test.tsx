/**
 * The width-driven halves of the listing-details parts, which `ListingDetails.test.tsx`
 * cannot reach: react-native-web fires `onLayout` from a ResizeObserver jsdom
 * does not have. Here the layout events are fired by hand.
 */
import React from 'react';
import { act, fireEvent, render, within } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  AmenityList,
  LISTING_PHOTO_GRID_BREAKPOINT,
  ListingHeader,
  ListingPhotoGrid,
  ReviewCard,
  ReviewSummary,
} from '../listing-details';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The shared react-native mock's `StyleSheet.flatten` is the identity; merge arrays here. */
function flat(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return style && typeof style === 'object' ? (style as Record<string, unknown>) : {};
}

const hidden = { includeHiddenElements: true } as const;

const layout = (width: number, height = 100) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height } } });

const PHOTOS = Array.from({ length: 6 }, (_, i) => ({ source: `https://example.test/${i}.jpg` }));

describe('ListingPhotoGrid layout="auto"', () => {
  it('holds a placeholder until measured, then picks carousel below 744 and grid from 744', () => {
    const api = renderWithTheme(<ListingPhotoGrid photos={PHOTOS} testID="g" />);
    expect(api.queryByTestId('g-grid')).toBeNull();
    expect(api.queryByTestId('g-carousel')).toBeNull();

    act(() => fireEvent(api.getByTestId('g'), 'layout', layout(LISTING_PHOTO_GRID_BREAKPOINT - 1)));
    expect(api.getByTestId('g-carousel')).toBeTruthy();
    expect(api.getByTestId('g-counter', hidden)).toBeTruthy();
    expect(api.queryByTestId('g-grid')).toBeNull();

    act(() => fireEvent(api.getByTestId('g'), 'layout', layout(LISTING_PHOTO_GRID_BREAKPOINT)));
    expect(api.getByTestId('g-grid')).toBeTruthy();
    expect(api.queryByTestId('g-carousel')).toBeNull();
  });

  it('darkens a photo to 10% on hover and clears it on hover out', () => {
    const api = renderWithTheme(<ListingPhotoGrid photos={PHOTOS} layout="grid" onPressPhoto={() => {}} testID="g" />);
    const opacity = () => flat(api.getByTestId('g-photo-0-scrim').props.style).opacity;
    expect(opacity()).toBe(0);
    act(() => fireEvent(api.getByTestId('g-photo-0'), 'hoverIn'));
    expect(opacity()).toBe(0.1);
    act(() => fireEvent(api.getByTestId('g-photo-0'), 'hoverOut'));
    expect(opacity()).toBe(0);
  });
});

describe('ListingHeader actions', () => {
  it('sit beside the title from 640 wide and under the meta row below it', () => {
    const api = renderWithTheme(
      <ListingHeader title="Flat" rating={4.9} actions={<></>} testID="h" />,
    );
    const root = api.getByTestId('h');
    act(() => fireEvent(root, 'layout', layout(375)));
    expect(api.queryByTestId('h-title-row')).toBeNull();
    expect(api.getByTestId('h-actions')).toBeTruthy();

    act(() => fireEvent(root, 'layout', layout(640)));
    const row = api.getByTestId('h-title-row');
    expect(flat(row.props.style).flexDirection).toBe('row');
    expect(within(row).getByTestId('h-actions')).toBeTruthy();
  });
});

describe('AmenityList columns="auto"', () => {
  const items = [{ label: 'Wifi' }, { label: 'Kitchen' }, { label: 'Heating' }];

  it('one full-width column below 560, two equal columns from 560', () => {
    const api = renderWithTheme(<AmenityList items={items} testID="am" />);
    const width = () => flat(api.getByTestId('am-item-0').props.style).width;
    act(() => fireEvent(api.getByTestId('am'), 'layout', layout(375)));
    expect(width()).toBe('100%');
    act(() => fireEvent(api.getByTestId('am'), 'layout', layout(724)));
    // (724 - 24 gap) / 2
    expect(width()).toBe(350);
  });
});

describe('ReviewSummary', () => {
  it('stacks below 640 and puts the distribution (240) beside the categories from 640', () => {
    const api = renderWithTheme(
      <ReviewSummary
        rating={4.9}
        categories={[{ label: 'Value', value: 4.6 }]}
        distribution={[{ label: '5', value: 0.9 }]}
        testID="s"
      />,
    );
    const distWidth = () => flat(api.getByTestId('s-distribution').props.style).width;
    act(() => fireEvent(api.getByTestId('s'), 'layout', layout(375)));
    expect(distWidth()).toBe('100%');
    act(() => fireEvent(api.getByTestId('s'), 'layout', layout(1000)));
    expect(distWidth()).toBe(240);
  });
});

describe('ReviewCard "Show more"', () => {
  function textNodes(api: ReturnType<typeof render>) {
    const clamped = api.getByTestId('rv-text');
    const all = api.UNSAFE_root.findAll(
      (node) => node.props.onLayout !== undefined && node.props.children === 'Long text' && node !== clamped,
    );
    return { clamped, full: all[all.length - 1]! };
  }

  it('appears only when the unclamped copy is taller, and toggles aria-expanded', () => {
    const onExpandedChange = jest.fn();
    const api = renderWithTheme(
      <ReviewCard name="Inês" text="Long text" numberOfLines={3} onExpandedChange={onExpandedChange} testID="rv" />,
    );
    const { clamped, full } = textNodes(api);
    expect(clamped.props.numberOfLines).toBe(3);

    act(() => {
      fireEvent(clamped, 'layout', layout(300, 60));
      fireEvent(full, 'layout', layout(300, 60));
    });
    expect(api.queryByTestId('rv-toggle')).toBeNull();

    act(() => fireEvent(full, 'layout', layout(300, 100)));
    const toggle = api.getByTestId('rv-toggle');
    expect(toggle.props['aria-expanded']).toBe(false);
    expect(toggle.props.accessibilityState).toEqual({ expanded: false });
    expect(toggle.props.accessibilityLabel).toBe('Show more');

    act(() => fireEvent.press(toggle));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(api.getByTestId('rv-text').props.numberOfLines).toBeUndefined();
    expect(api.getByTestId('rv-toggle').props['aria-expanded']).toBe(true);
    expect(api.getByTestId('rv-toggle').props.accessibilityLabel).toBe('Show less');
  });

  it('numberOfLines={0} never clamps and renders no measuring copy', () => {
    const api = renderWithTheme(<ReviewCard name="Inês" text="Long text" numberOfLines={0} testID="rv" />);
    expect(api.getByTestId('rv-text').props.numberOfLines).toBeUndefined();
    expect(api.UNSAFE_root.findAll((n) => n.props.children === 'Long text' && typeof n.type === 'string')).toHaveLength(1);
  });
});
