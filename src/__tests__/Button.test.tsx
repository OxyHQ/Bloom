import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { ThemeColors } from '../theme/types';
import { Button, PrimaryButton, SecondaryButton, IconButton, GhostButton, TextButton } from '../button';
import { borderRadius } from '../styles/tokens';
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

/** Read the live resolved theme colors the same way `Button` does. */
function captureThemeColors(): ThemeColors {
  let captured: ThemeColors | undefined;
  function Probe() {
    captured = useTheme().colors;
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
    // radius is read from the token rather than restated: what this asserts is
    // that the button's BOX is on the classed node, not what the pill rung is.
    expect(resolvedStyle(style).borderRadius).toBe(borderRadius.full);
  });

  it('applies the press-scale transform to that node too, not to a wrapper', () => {
    const { getByTestId } = renderWithTheme(<Button testID="btn">Press</Button>);
    expect(resolvedStyle(getByTestId('btn').props.style).transform).toBeDefined();
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
    const colors = captureThemeColors();
    const { getByTestId } = renderWithTheme(<IconButton testID="icon" className="flex-1" />);
    const style = resolvedStyle(getByTestId('icon').props.style);
    expect(style.backgroundColor).toBe(colors.background);
    expect(style.borderColor).toBe(colors.border);
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
    const { getByTestId } = renderWithTheme(<TextButton testID="txt">Text</TextButton>);
    const style = resolvedStyle(getByTestId('txt').props.style);
    expect(style.paddingVertical).toBe(4);
    expect(style.paddingHorizontal).toBe(8);
  });

  it('ghost keeps the full size-config padding', () => {
    const { getByTestId } = renderWithTheme(<GhostButton testID="ghost">Ghost</GhostButton>);
    const style = resolvedStyle(getByTestId('ghost').props.style);
    expect(style.paddingVertical).toBe(5);
    expect(style.paddingHorizontal).toBe(16);
  });

  it('keeps the size-config minHeight so the touch target survives', () => {
    const { getByTestId } = renderWithTheme(<TextButton testID="txt">Text</TextButton>);
    expect(resolvedStyle(getByTestId('txt').props.style).minHeight).toBe(36);
  });
});

// ---------------------------------------------------------------------------
//  Geometry table
//
//  `minHeight` is the only thing that decides how tall a button is, on BOTH
//  platforms — which is a property of the PADDING as much as of `minHeight`
//  itself, since a content box that outgrows the floor takes the height back.
//  Measured in Chrome (Tailwind preflight's `line-height: 1.5`, which every
//  consumer inherits): a `medium` button was 40.5px tall with a border and 40px
//  without, against a `minHeight` of 40 that never applied.
//
//  These assertions therefore pin BOTH numbers per size, and the arithmetic
//  between them, so shrinking one without the other goes red here rather than
//  silently on a consumer's page.
// ---------------------------------------------------------------------------

/** The floor `SIZE_HIT_SLOP` exists to reach — Apple's HIG, and `Checkbox`'s. */
const MIN_TOUCH_TARGET = 44;

/** Web's line box: Tailwind preflight sets `line-height: 1.5` on `html`. */
const WEB_LINE_HEIGHT_RATIO = 1.5;

/** The widest border any variant draws, on each of the two vertical edges. */
const MAX_VERTICAL_BORDER = 2;

const GEOMETRY = [
  { size: 'small', height: 32, paddingVertical: 4, fontSize: 14, verticalSlop: 6 },
  { size: 'medium', height: 36, paddingVertical: 5, fontSize: 15, verticalSlop: 4 },
  { size: 'large', height: 44, paddingVertical: 8, fontSize: 16, verticalSlop: 0 },
] as const;

describe('Button geometry', () => {
  it.each(GEOMETRY)(
    '$size is $height tall, from minHeight and not from padding',
    ({ size, height, paddingVertical, fontSize }) => {
      const { getByTestId } = renderWithTheme(
        <Button testID="btn" size={size}>
          Save changes
        </Button>,
      );
      const style = resolvedStyle(getByTestId('btn').props.style);
      expect(style.minHeight).toBe(height);
      expect(style.paddingVertical).toBe(paddingVertical);

      // The content box has to FIT inside `minHeight`, or the height comes from
      // the padding instead and the two forks drift apart again.
      const contentBox =
        2 * paddingVertical + WEB_LINE_HEIGHT_RATIO * fontSize + MAX_VERTICAL_BORDER;
      expect(contentBox).toBeLessThanOrEqual(height);
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

  it.each(GEOMETRY)('$size icon variant is a square that clears its glyph', ({ size, height }) => {
    const { getByTestId } = renderWithTheme(
      <IconButton testID="btn" size={size} icon={<View testID="glyph" />} />,
    );
    const style = resolvedStyle(getByTestId('btn').props.style);
    expect(style.width).toBe(height);
    expect(style.height).toBe(height);
    // Not a fixed 8: at `medium` that would leave an 18px box, and the 20px
    // default icon would be clipped by the variant's own `overflow: 'hidden'`
    // with nothing thrown. The glyph box stays 14 / 22 / 30.
    const glyphBox = height - 2 * Number(style.padding) - MAX_VERTICAL_BORDER;
    expect(glyphBox).toBe({ small: 14, medium: 22, large: 30 }[size]);
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
      <PrimaryButton>Primary</PrimaryButton>,
    );
    expect(getByText('Primary')).toBeTruthy();
  });

  it('SecondaryButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <SecondaryButton>Secondary</SecondaryButton>,
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('IconButton renders without crashing', () => {
    const { getByTestId } = renderWithTheme(
      <IconButton testID="icon-btn" />,
    );
    expect(getByTestId('icon-btn')).toBeTruthy();
  });

  it('GhostButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <GhostButton>Ghost</GhostButton>,
    );
    expect(getByText('Ghost')).toBeTruthy();
  });

  it('TextButton renders without crashing', () => {
    const { getByText } = renderWithTheme(
      <TextButton>Text</TextButton>,
    );
    expect(getByText('Text')).toBeTruthy();
  });
});
