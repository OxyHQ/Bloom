import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { ThemeColors } from '../theme/types';
import { Button, PrimaryButton, SecondaryButton, IconButton, GhostButton, TextButton } from '../button';
import { borderRadius } from '../styles/tokens';
import { SHADOW_BOX } from '../design-tokens/shadows';
import { resolveGlassColors } from '../theme/glass-colors';
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
    const { getByText } = renderWithTheme(
      <Button onPress={onPress}>Press</Button>,
    );
    fireEvent.press(getByText('Press'));
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
    expect(style.paddingVertical).toBe(8);
    expect(style.paddingHorizontal).toBe(16);
  });

  it('keeps the size-config minHeight so the touch target survives', () => {
    const { getByTestId } = renderWithTheme(<TextButton testID="txt">Text</TextButton>);
    expect(resolvedStyle(getByTestId('txt').props.style).minHeight).toBe(40);
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

/**
 * The FILLED variant is GLASS on native too, and it is the SAME tokens the web
 * fork reads — the whole point of `theme/glass-colors.ts` being one module.
 *
 * The native half cannot assert the blur or the sheen from their values (they
 * are an `expo-blur` component and an SVG, not style keys), so it asserts the
 * layer is MOUNTED and that the box carries the two things that must not be on
 * it: the hairline, which has to trace the real edge, and the drop shadow, which
 * a clipping node would swallow on iOS.
 */
describe('the filled variant is glass', () => {
  it('paints the box from the glass tokens and mounts the surface under the label', () => {
    const colors = captureThemeColors();
    const glass = resolveGlassColors(colors, 'primary');
    const { getByTestId, queryByTestId } = renderWithTheme(<Button testID="b">Go</Button>);
    const style = resolvedStyle(getByTestId('b').props.style);

    // The fill is the SURFACE's job; the box must stay clear or the blur has
    // nothing to show through.
    expect(style.backgroundColor).toBe('transparent');
    expect(style.borderColor).toBe(glass.hairline);
    expect(style.borderWidth).toBe(glass.hairlineWidth);
    expect(style.boxShadow).toBe(SHADOW_BOX.glass);
    // …and the drop shadow only. The rim is an INSET, and an inset on this node
    // would be painted over by the very layer it is meant to sit on top of.
    expect(style.boxShadow).not.toContain('inset');

    expect(queryByTestId('b-glass')).not.toBeNull();
  });

  it('labels it with the pair member legible on the tint, not the opaque fill', () => {
    const colors = captureThemeColors();
    const glass = resolveGlassColors(colors, 'primary');
    const { getByText } = renderWithTheme(<Button>Go</Button>);
    expect(resolvedStyle(getByText('Go').props.style).color).toBe(glass.fillForeground);
    // The one it must NOT be: `primaryForeground` is white here, sized for the
    // opaque fill this replaced.
    expect(glass.fillForeground).not.toBe(colors.primaryForeground);
  });

  it('speaks the error tone for destructive, the same tone a destructive Chip uses', () => {
    const colors = captureThemeColors();
    const { getByTestId } = renderWithTheme(
      <Button testID="d" variant="destructive">
        Delete
      </Button>,
    );
    expect(resolvedStyle(getByTestId('d').props.style).borderColor).toBe(
      resolveGlassColors(colors, 'error').hairline,
    );
  });

  it('leaves the unfilled variants without a surface at all', () => {
    const { queryByTestId } = renderWithTheme(
      <GhostButton testID="g">Ghost</GhostButton>,
    );
    expect(queryByTestId('g-glass')).toBeNull();
  });
});
