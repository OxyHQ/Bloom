import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stop } from 'react-native-svg';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { Button, CloseButton } from '../button';
import { BUTTON_GEOMETRY, BUTTON_RADIUS, resolveButtonPalette } from '../button/shared';
import { pressHost } from './support/press-host';
import {
  classNamesOn,
  renderedChildren,
  resolvedStyle,
} from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** Read the live resolved theme the same way `Button` does. */
function captureTheme(): Theme {
  let captured: Theme | undefined;
  function Probe() {
    captured = useTheme();
    return null;
  }
  renderWithTheme(<Probe />);
  if (!captured) throw new Error('theme probe never rendered');
  return captured;
}

describe('Button', () => {
  it('renders children as text', () => {
    const { getByText } = renderWithTheme(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Button testID="btn" onPress={onPress}>Press</Button>,
    );
    // Through `pressHost`, not a bare `fireEvent.press(getByText('Press'))`:
    // that walks up past the button to `<Button onPress={…}>` in this file's own
    // JSX and reports a call the component had no part in.
    pressHost(getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('supports testID prop', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="my-button">Test</Button>,
    );
    expect(getByTestId('my-button')).toBeTruthy();
  });

  it('has accessibilityRole button set on the Pressable', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="a11y-btn">A11y</Button>,
    );
    const btn = getByTestId('a11y-btn');
    expect(btn.props.accessibilityRole).toBe('button');
  });

  it('applies accessibilityLabel', () => {
    const { getByLabelText } = renderWithTheme(
      <Button accessibilityLabel="Save changes">Save</Button>,
    );
    expect(getByLabelText('Save changes')).toBeTruthy();
  });

  it('sets disabled accessibility state', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="dis-btn" disabled>
        Disabled
      </Button>,
    );
    const btn = getByTestId('dis-btn');
    // The `disabled` PROP is what carries this to both platforms: React Native
    // folds it into `accessibilityState`, and react-native-web's `Pressable`
    // derives `aria-disabled` from it (overwriting any the caller passes, so
    // the prop is the only spelling that works there).
    expect(btn.props.disabled).toBe(true);
  });

  it('keeps children mounted when loading so width is preserved', () => {
    const { UNSAFE_queryAllByType } = renderWithTheme(
      <Button loading>Submit</Button>,
    );
    // The text node remains in the tree even though it is visually hidden.
    const texts = UNSAFE_queryAllByType(Text);
    const hasSubmit = texts.some((node) =>
      Array.isArray(node.props.children)
        ? node.props.children.includes('Submit')
        : node.props.children === 'Submit',
    );
    expect(hasSubmit).toBe(true);
  });

  it('disables the underlying Pressable when loading', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="loading-btn" loading>
        Submit
      </Button>,
    );
    const btn = getByTestId('loading-btn');
    expect(btn.props.disabled).toBe(true);
  });

  it('marks loading state as busy + disabled', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="busy-btn" loading>
        Submit
      </Button>,
    );
    const btn = getByTestId('busy-btn');
    // `aria-busy` rather than `accessibilityState.busy`, which react-native-web
    // drops — this is also what `Button.web.tsx` emits, so both forks announce
    // the same thing. React Native folds it back into `accessibilityState`.
    expect(btn.props['aria-busy']).toBe(true);
    expect(btn.props.disabled).toBe(true);
  });
});

// Regression: the native button used to render its `Pressable` inside an
// unstyled `Animated.View` that existed only to hold the press-scale transform.
// That wrapper — not the pressable — was the flex child of whatever laid the
// button out, and it hugged its content, so `className="flex-1"` (and every
// other layout the caller expressed) applied inside a box that never grew. The
// web fork renders one real `<button>` and has always behaved. Nothing errored;
// consumers wrapped each Bloom `Button` in their own `<View>` to compensate.
describe('layout: the button IS the node its parent lays out', () => {
  it('renders the pressable as its outermost node — no wrapper in between', () => {
    const { toJSON } = renderWithTheme(
      <View testID="host">
        <Button testID="btn" className="flex-1">
          Wide
        </Button>
      </View>,
    );
    const rendered = renderedChildren(toJSON(), 'host');
    expect(rendered).toHaveLength(1);
    // The single node the parent lays out is the pressable itself — the one
    // carrying the a11y role, the handlers and the button's own box.
    expect(rendered[0]?.props.testID).toBe('btn');
    expect(rendered[0]?.props.accessibilityRole).toBe('button');
  });

  it('lands the caller className on that same node, beside the button box', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="btn" className="flex-1">
        Wide
      </Button>,
    );
    const style = getByTestId('btn').props.style;
    expect(classNamesOn(style)).toContain('flex-1');
    // Same node, so a layout class and the button's visuals cannot diverge. The
    // radius is read from the geometry table rather than restated: what this
    // asserts is that the button's BOX is on the classed node.
    expect(resolvedStyle(style).borderRadius).toBe(BUTTON_RADIUS);
  });

  // There is no press scale: a press is the active paint alone, so nothing
  // may put a transform on the button.
  it('never scales on press', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="btn" onPress={() => {}}>
        Press
      </Button>,
    );
    pressHost(getByTestId('btn'));
    expect(resolvedStyle(getByTestId('btn').props.style).transform).toBeUndefined();
  });

  it('keeps the caller style winning over the button box', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="btn" style={{ minHeight: 0, paddingHorizontal: 2 }}>
        Tight
      </Button>,
    );
    const style = resolvedStyle(getByTestId('btn').props.style);
    expect(style.minHeight).toBe(0);
    expect(style.paddingHorizontal).toBe(2);
  });

  // Regression: the icon variant used to get its chrome from a DEFAULT
  // `className` that the caller's own `className` replaced outright, so
  // `<IconButton className="flex-1" />` shipped transparent and borderless. It
  // now comes from the same resolved tokens `Button.web.tsx` already used.
  it('keeps the icon variant chrome when the caller passes a className', () => {
    const theme = captureTheme();
    const palette = resolveButtonPalette('outline', theme, 'neutral');
    const { getByTestId } = renderWithTheme(<Button testID="icon" className="flex-1" appearance="outline" tone="neutral" />);
    const style = resolvedStyle(getByTestId('icon').props.style);
    expect(style.backgroundColor).toBe(palette.rest.background);
    expect(style.borderColor).toBe(palette.rest.border);
    expect(style.borderWidth).toBe(1);
    expect(classNamesOn(getByTestId('icon').props.style)).toContain('flex-1');
  });
});

// `variant="text"` was reported as "shrinks horizontal padding on native but is
// byte-identical to ghost on web". The padding is real and DELIBERATE — `text`
// (and its web alias `link`) is a compact inline affordance, `ghost` is a
// full-size button without a background — and web applies exactly the same 4/8
// override in `Button.web.tsx`'s `containerStyle`; only the variant COLOR table
// entry is shared with ghost there. The one genuine divergence left is
// `minHeight`, which web clears for text/link and native deliberately keeps: a
// finger needs the target, a cursor does not.
describe('variant="text" geometry', () => {
  it('is a compact affordance, not a ghost button', () => {
    const { getByTestId } = renderWithTheme(<Button testID="txt" appearance="plain" tone="accent">Text</Button>);
    const style = resolvedStyle(getByTestId('txt').props.style);
    expect(style.paddingVertical).toBeUndefined();
    expect(style.paddingHorizontal).toBe(8);
  });

  it('ghost keeps the full size-config padding', () => {
    const { getByTestId } = renderWithTheme(<Button testID="ghost" appearance="subtle" tone="accent">Ghost</Button>);
    const style = resolvedStyle(getByTestId('ghost').props.style);
    expect(style.paddingVertical).toBeUndefined();
    expect(style.paddingHorizontal).toBe(BUTTON_GEOMETRY.md.paddingHorizontal);
  });

  it('keeps the size-config height so the touch target survives', () => {
    const { getByTestId } = renderWithTheme(<Button testID="txt" appearance="plain" tone="accent">Text</Button>);
    expect(resolvedStyle(getByTestId('txt').props.style).height).toBe(36);
  });
});

// ---------------------------------------------------------------------------
//  Geometry table — button sizes (`button/shared.ts`)
//
//  Height is FIXED on both forks and the label's line box is centred inside
//  it, so these pin the height, the radius, and that the line box plus the
//  widest border fits — a line height that outgrew the box would clip.
// ---------------------------------------------------------------------------

/** The floor `SIZE_HIT_SLOP` exists to reach — Apple's HIG, and `Checkbox`'s. */
const MIN_TOUCH_TARGET = 44;

/** The widest border any variant draws, on each of the two vertical edges. */
const MAX_VERTICAL_BORDER = 2;

const GEOMETRY = [
  { size: 'xs', height: 24, lineHeight: 16, verticalSlop: 10 },
  { size: 'sm', height: 32, lineHeight: 20, verticalSlop: 6 },
  { size: 'md', height: 36, lineHeight: 20, verticalSlop: 4 },
  { size: 'lg', height: 44, lineHeight: 20, verticalSlop: 0 },
] as const;

describe('Button geometry', () => {
  it.each(GEOMETRY)(
    '$size is a $height tall pill',
    ({ size, height, lineHeight }) => {
      const { getByTestId } = renderWithTheme(
        <Button testID="btn" size={size} appearance="outline" tone="neutral">
          Save changes
        </Button>,
      );
      const style = resolvedStyle(getByTestId('btn').props.style);
      expect(style.height).toBe(height);
      expect(style.borderRadius).toBe(BUTTON_RADIUS);
      expect(lineHeight + MAX_VERTICAL_BORDER).toBeLessThanOrEqual(height);
    },
  );

  // `hitSlop` is read against the `Pressable` element, not the host view:
  // Pressable feeds it to Pressability and never forwards it, so the resolved
  // value is invisible from `getByTestId`.
  it.each(GEOMETRY)(
    '$size reaches the touch-target floor on native, with slop where it must',
    ({ size, height, verticalSlop }) => {
      const { UNSAFE_getByType } = renderWithTheme(
        <Button testID="btn" size={size}>
          Save changes
        </Button>,
      );
      expect(UNSAFE_getByType(Pressable).props.hitSlop).toEqual({
        top: verticalSlop,
        bottom: verticalSlop,
        left: 0,
        right: 0,
      });
      expect(height + 2 * verticalSlop).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    },
  );

  it.each(GEOMETRY)('$size icon variant is an unpadded square', ({ size, height }) => {
    const { getByTestId } = renderWithTheme(
      <Button testID="btn" size={size} icon={() => <View testID="glyph" />} appearance="outline" tone="neutral" />,
    );
    const style = resolvedStyle(getByTestId('btn').props.style);
    expect(style.width).toBe(height);
    expect(style.height).toBe(height);
    expect(style.paddingHorizontal).toBe(0);
  });

  it('iconOnly renders the leading icon at the size\'s glyph size and no label', () => {
    const Glyph = jest.fn((_: { width?: number; height?: number; fill?: string }) => null);
    const { getByTestId, queryByText } = renderWithTheme(
      <Button testID="btn" size="sm" icon={Glyph} accessibilityLabel="Add" />,
    );
    expect(queryByText('Add')).toBeNull();
    expect(Glyph.mock.calls[0]?.[0]).toMatchObject({ width: 16, height: 16 });
    expect(resolvedStyle(getByTestId('btn').props.style).width).toBe(32);
  });

  it('a caller hitSlop still replaces the default', () => {
    const slop = { top: 1, bottom: 2, left: 3, right: 4 };
    const { UNSAFE_getByType } = renderWithTheme(
      <Button testID="btn" hitSlop={slop}>
        Save
      </Button>,
    );
    expect(UNSAFE_getByType(Pressable).props.hitSlop).toEqual(slop);
  });
});

describe('Button variants', () => {
  it('PrimaryButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <Button appearance="solid" tone="accent">Primary</Button>,
    );
    expect(getByText('Primary')).toBeTruthy();
  });

  it('SecondaryButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <Button appearance="outline" tone="neutral">Secondary</Button>,
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('IconButton renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="icon-btn" appearance="outline" tone="neutral" />,
    );
    expect(getByTestId('icon-btn')).toBeTruthy();
  });

  it('GhostButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <Button appearance="subtle" tone="accent">Ghost</Button>,
    );
    expect(getByText('Ghost')).toBeTruthy();
  });

  it('TextButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <Button appearance="plain" tone="accent">Text</Button>,
    );
    expect(getByText('Text')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
//  IconButton / LinkButton / CloseButton details
// ---------------------------------------------------------------------------

describe('button details', () => {
  it('xs keeps the 2px gap (`gap-0.5` applies to every size)', () => {
    expect(BUTTON_GEOMETRY.xs.gap).toBe(2);
  });

  it('labels use the type ramp step, in Inter', () => {
    const { getByText } = renderWithTheme(<Button size="xs">Go</Button>);
    const style = resolvedStyle(getByText('Go').props.style);
    expect(style).toMatchObject({ fontSize: 12, lineHeight: 16, letterSpacing: 0.15, fontWeight: '600' });
    expect(style.fontFamily).toBe('Inter');
  });

  it('a bordered medium icon-only button grows with its border (38 × 36)', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="btn" icon={() => null} accessibilityLabel="Add" appearance="outline" tone="neutral" />,
    );
    const style = resolvedStyle(getByTestId('btn').props.style);
    expect(style.width).toBe(36);
    expect(style.height).toBe(36);
  });

  it('IconButton takes an icon COMPONENT and draws it 16px at small', () => {
    const Glyph = jest.fn((_: { width?: number; height?: number; fill?: string }) => null);
    renderWithTheme(<Button size="sm" icon={Glyph} accessibilityLabel="More" appearance="outline" tone="neutral" />);
    expect(Glyph.mock.calls[0]?.[0]).toMatchObject({ width: 16, height: 16 });
  });

  it('IconButton dims to 0.6 when disabled', () => {
    const { getByTestId } = renderWithTheme(
      <Button testID="btn" disabled leading={<View />} accessibilityLabel="More" appearance="outline" tone="neutral" />,
    );
    expect(resolvedStyle(getByTestId('btn').props.style).opacity).toBe(0.5);
  });

  it('LinkButton has no container: no height, no padding, a 4px gap', () => {
    const { getByTestId } = renderWithTheme(<Button testID="btn" href="https://example.com" appearance="plain" tone="accent">Learn more</Button>);
    const style = resolvedStyle(getByTestId('btn').props.style);
    expect(style.height).toBeUndefined();
    expect(style.paddingHorizontal).toBe(0);
    expect(style.gap).toBe(4);
    expect(style.backgroundColor).toBe('transparent');
  });

  it('LinkButton variant picks the link colour', () => {
    const theme = captureTheme();
    const { getByText } = renderWithTheme(<Button appearance="plain" tone="neutral">Docs</Button>);
    expect(resolvedStyle(getByText('Docs').props.style).color).toBe(
      resolveButtonPalette('plain', theme, 'neutral').rest.foreground,
    );
  });

  it.each([
    ['xs', 20],
    ['sm', 24],
    ['md', 32],
    ['lg', 44],
  ] as const)('CloseButton %s is a %ipx disc', (size, box) => {
    const { getByTestId } = renderWithTheme(
      <CloseButton testID="close" size={size} accessibilityLabel="Close" />,
    );
    const style = resolvedStyle(getByTestId('close').props.style);
    expect(style.width).toBe(box);
    expect(style.height).toBe(box);
    expect(style.borderRadius).toBe(box / 2);
  });
});

describe('filled button material', () => {
  it.each(['accent', 'danger', 'success', 'warning', 'info'] as const)('renders two different opaque SVG stops for %s', tone => {
    const screen = renderWithTheme(<Button tone={tone}>Save</Button>);
    const stops = screen.UNSAFE_getAllByType(Stop).map(stop => stop.props.stopColor);
    expect(stops).toHaveLength(2);
    expect(stops[0]).not.toBe(stops[1]);
    expect(stops.every(color => typeof color === 'string' && !color.startsWith('rgba'))).toBe(true);
  });
});
