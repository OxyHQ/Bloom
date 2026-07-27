import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { ThemeColors } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { TabBar, TabBarButton } from '../tab-bar';
import { TabBarGlyph as NativeTabBarGlyph } from '../tab-bar/glyph.native';
import { resolveTabBarTheme } from '../tab-bar/shared';
import { TabBarSurface as NativeTabBarSurface } from '../tab-bar/surface.native';
import type { TabBarItem, TabBarTheme } from '../tab-bar/types';

/**
 * Behaviour tests for the floating tab bar.
 *
 * Three properties of the environment shape every assertion here:
 *
 *  1. Jest has no platform-extension resolution, so `../tab-bar` binds the
 *     NEUTRAL `surface.tsx` / `glyph.tsx`. The two `.native` variants are pulled
 *     in by their full path where they are asserted on directly — which is also
 *     what makes the `expo-glass-effect` / `expo-symbols` mocks load-bearing
 *     rather than decorative.
 *  2. Labels render through `Animated.Text`, a plain host string under the
 *     reanimated mock, so testing-library's text queries cannot see them.
 *     `labelFor` walks the tree instead.
 *  3. The reanimated mock's shared values are plain boxes: writing
 *     `slideIndex.value` does NOT re-render, and `useAnimatedStyle` runs during
 *     render. A mapper reading a shared value that an EFFECT wrote therefore
 *     reflects the write only on the NEXT render — hence `renderSettled`. The
 *     motion itself is verified in a real browser, not here.
 */

/**
 * Stand-in for a Bloom icon element: a host node tagged with the `fill` it was
 * cloned with, so a test can read back the tint the bar injected through
 * `applyIconColor`.
 */
function BareIcon({ id, fill }: { id: string; fill?: string }) {
  return React.createElement('bloom-test-icon', { testID: id, fill });
}

const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: <BareIcon id="home-icon" /> },
  { name: 'search', label: 'Search', icon: <BareIcon id="search-icon" /> },
  { name: 'you', label: 'You', icon: <BareIcon id="you-icon" /> },
];

/**
 * An item whose selected state is a different SHAPE, not a different tint —
 * the icon-set convention (outline vs filled) that `activeIcon` exists for.
 */
const SHAPE_ITEM: TabBarItem = {
  name: 'home',
  label: 'Home',
  icon: <BareIcon id="outline-icon" />,
  activeIcon: <BareIcon id="filled-icon" />,
};

/** Captures the live `ThemeColors` so assertions compare against real tokens. */
function ThemeProbe({ onColors }: { onColors: (colors: ThemeColors) => void }) {
  onColors(useTheme().colors);
  return null;
}

function withTheme(ui: React.ReactElement) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>
  );
}

function renderWithTheme(ui: React.ReactElement) {
  return render(withTheme(ui));
}

/**
 * Render, then re-render an equivalent tree so mappers see the shared-value
 * writes the mount effects made. See note 3 in the file header.
 *
 * Takes a FACTORY, not an element: React bails out of re-rendering a
 * referentially identical element, which would skip the second pass entirely
 * and silently leave the assertion reading first-frame values.
 */
function renderSettled(ui: () => React.ReactElement) {
  const utils = renderWithTheme(ui());
  utils.rerender(withTheme(ui()));
  return utils;
}

/** The theme the bar resolves for `mode="light" colorPreset="teal"`. */
function readTheme(overrides?: Partial<TabBarTheme>): TabBarTheme {
  let resolved: TabBarTheme | undefined;
  renderWithTheme(
    <ThemeProbe
      onColors={(colors) => {
        resolved = resolveTabBarTheme(colors, overrides);
      }}
    />,
  );
  if (!resolved) throw new Error('ThemeProbe never ran');
  return resolved;
}

// Flatten a (possibly nested / conditional) RN style prop into one object.
function flattenStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (s: unknown): void => {
    if (Array.isArray(s)) s.forEach(visit);
    else if (s && typeof s === 'object') Object.assign(out, s);
  };
  visit(style);
  return out;
}

/**
 * The host tag a node renders as, or `null` for a composite.
 *
 * `ReactTestInstance['type']` is typed as `ElementType`, whose string arm is the
 * union of KNOWN intrinsic tags — so comparing it directly to a mock host name
 * like `'Animated.Text'` is a TS2367 "no overlap" error. Widening to `string`
 * behind this accessor is the honest fix: these really are host tags, they are
 * just ones the RN/reanimated mocks invent.
 */
function hostName(node: ReactTestInstance): string | null {
  const { type } = node;
  return typeof type === 'string' ? type : null;
}

/**
 * Every tab trigger, in bar order.
 *
 * Restricted to HOST nodes: the tree carries both the composite `Pressable` and
 * the host element it renders, and both hold the same props — counting them all
 * would double every tab.
 */
function triggers(root: ReactTestInstance): ReactTestInstance[] {
  return root.findAll(
    (node) => hostName(node) !== null && node.props?.accessibilityRole === 'tab',
  );
}

/** The `Animated.Text` label node of the tab whose text is `label`. */
function labelFor(root: ReactTestInstance, label: string): ReactTestInstance {
  const found = root.findAll(
    (node) => hostName(node) === 'Animated.Text' && node.props?.children === label,
  );
  const first = found[0];
  if (!first) throw new Error(`No tab label rendered with text "${label}"`);
  return first;
}

/** Every host node rendered as `tag`. */
function hosts(root: ReactTestInstance, tag: string): ReactTestInstance[] {
  return root.findAll((node) => hostName(node) === tag);
}

function selectedFlags(root: ReactTestInstance): boolean[] {
  return triggers(root).map((node) => node.props.accessibilityState.selected);
}

function Bar({
  activeIndex,
  onIndexChange,
  theme,
  focusedIndex,
}: {
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
  theme?: Partial<TabBarTheme>;
  /** When set, drives the FOCUS path (`isFocused`) instead of `activeIndex`. */
  focusedIndex?: number;
}) {
  return (
    <TabBar activeIndex={activeIndex} onIndexChange={onIndexChange} theme={theme}>
      {ITEMS.map((item, index) => (
        <TabBarButton
          key={item.name}
          item={item}
          index={index}
          isFocused={focusedIndex === undefined ? undefined : focusedIndex === index}
        />
      ))}
    </TabBar>
  );
}

describe('TabBar', () => {
  it('renders every item label', () => {
    const { UNSAFE_root } = renderWithTheme(<Bar activeIndex={0} />);
    for (const item of ITEMS) expect(labelFor(UNSAFE_root, item.label)).toBeTruthy();
  });

  it("renders each item's own icon node, on both crossfade layers", () => {
    const { getAllByTestId } = renderWithTheme(<Bar activeIndex={0} />);
    // The bar renders the glyph twice per tab: an inactive layer with the
    // active layer crossfading on top.
    for (const id of ['home-icon', 'search-icon', 'you-icon']) {
      expect(getAllByTestId(id)).toHaveLength(2);
    }
  });

  it('injects the layer tint as the icon fill, from theme tokens', () => {
    const theme = readTheme();
    const { getAllByTestId } = renderWithTheme(<Bar activeIndex={0} />);
    const fills = getAllByTestId('home-icon').map((node) => node.props.fill);
    expect(fills).toEqual(expect.arrayContaining([theme.inactiveTint, theme.activeTint]));
  });

  it('marks the tab at activeIndex as selected for accessibility', () => {
    const { UNSAFE_root } = renderWithTheme(<Bar activeIndex={1} />);
    expect(selectedFlags(UNSAFE_root)).toEqual([false, true, false]);
  });

  it('moves the selection when activeIndex changes', () => {
    const { UNSAFE_root, rerender } = renderWithTheme(<Bar activeIndex={0} />);
    rerender(withTheme(<Bar activeIndex={2} />));
    expect(selectedFlags(UNSAFE_root)).toEqual([false, false, true]);
  });

  it('tints the label of the tab the highlight sits on', () => {
    const theme = readTheme();
    const { UNSAFE_root } = renderSettled(() => <Bar activeIndex={1} />);
    expect(flattenStyle(labelFor(UNSAFE_root, 'Search').props.style).color).toBe(theme.activeTint);
    expect(flattenStyle(labelFor(UNSAFE_root, 'Home').props.style).color).toBe(theme.inactiveTint);
  });

  it('calls onIndexChange with the pressed index', () => {
    const onIndexChange = jest.fn();
    const { UNSAFE_root } = renderWithTheme(<Bar activeIndex={0} onIndexChange={onIndexChange} />);
    fireEvent.press(triggers(UNSAFE_root)[2] as ReactTestInstance);
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it('does not report the press itself on the focus-driven path', () => {
    // With `isFocused` supplied the router trigger's own onPress navigates;
    // reporting through the bar as well would navigate twice.
    const onIndexChange = jest.fn();
    const { UNSAFE_root } = renderWithTheme(
      <Bar focusedIndex={0} onIndexChange={onIndexChange} />,
    );
    fireEvent.press(triggers(UNSAFE_root)[1] as ReactTestInstance);
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('lets isFocused override the bar activeIndex', () => {
    const { UNSAFE_root } = renderWithTheme(
      <TabBar activeIndex={0}>
        {ITEMS.map((item, index) => (
          <TabBarButton key={item.name} item={item} index={index} isFocused={index === 2} />
        ))}
      </TabBar>,
    );
    // Index 0 is the bar's activeIndex, but every button carries an explicit
    // isFocused, so focus comes from the buttons alone.
    expect(selectedFlags(UNSAFE_root)).toEqual([false, false, true]);
  });

  it('drives the highlight from isFocused when the bar is uncontrolled', () => {
    const theme = readTheme();
    // The router path: `RouterTabBarProps` omits `activeIndex` on purpose, so
    // the focused BUTTON is the only writer of the highlight. This is what
    // keeps the pill correct through deep links and back gestures.
    const { UNSAFE_root } = renderSettled(() => <Bar focusedIndex={2} />);
    // The label tint follows the sliding highlight, so it reports where the
    // pill actually is.
    expect(flattenStyle(labelFor(UNSAFE_root, 'You').props.style).color).toBe(theme.activeTint);
    expect(flattenStyle(labelFor(UNSAFE_root, 'Home').props.style).color).toBe(theme.inactiveTint);
  });

  describe('activeIcon', () => {
    function ShapeBar() {
      return (
        <TabBar activeIndex={0}>
          <TabBarButton item={SHAPE_ITEM} index={0} />
        </TabBar>
      );
    }

    it('renders the item icon underneath and activeIcon on the crossfade layer', () => {
      // A tint crossfade cannot express an outline-to-filled swap: both layers
      // would draw the same path in two colors. The layers must render two
      // different NODES.
      const { getAllByTestId } = renderWithTheme(<ShapeBar />);
      expect(getAllByTestId('outline-icon')).toHaveLength(1);
      expect(getAllByTestId('filled-icon')).toHaveLength(1);
    });

    it('puts activeIcon on the ACTIVE layer, not the inactive one', () => {
      // The tint each node was cloned with is what identifies its layer — the
      // crossfading layer is the one painted with `activeTint`.
      const theme = readTheme();
      const { getAllByTestId } = renderWithTheme(<ShapeBar />);
      expect(getAllByTestId('filled-icon')[0]?.props.fill).toBe(theme.activeTint);
      expect(getAllByTestId('outline-icon')[0]?.props.fill).toBe(theme.inactiveTint);
    });

    it('falls back to icon on both layers when the item has no activeIcon', () => {
      // Full backward compatibility: an item that only carries `icon` behaves
      // exactly as it did before `activeIcon` existed.
      const theme = readTheme();
      const { getAllByTestId } = renderWithTheme(<Bar activeIndex={0} />);
      const fills = getAllByTestId('home-icon').map((node) => node.props.fill);
      expect(fills).toHaveLength(2);
      expect(fills).toEqual(expect.arrayContaining([theme.inactiveTint, theme.activeTint]));
    });

    it('is honoured by the native glyph too, per crossfade layer', () => {
      const theme = readTheme();
      const active = renderWithTheme(
        <NativeTabBarGlyph item={SHAPE_ITEM} tint={theme.activeTint} size={21} active />,
      );
      expect(active.queryByTestId('filled-icon')).toBeTruthy();
      expect(active.queryByTestId('outline-icon')).toBeNull();

      const inactive = renderWithTheme(
        <NativeTabBarGlyph item={SHAPE_ITEM} tint={theme.inactiveTint} size={21} active={false} />,
      );
      expect(inactive.queryByTestId('outline-icon')).toBeTruthy();
      expect(inactive.queryByTestId('filled-icon')).toBeNull();
    });

    it('keeps the SF Symbol path on iOS, which is tinted natively', () => {
      // A symbol IS tinted per layer by the system, so the tint crossfade is
      // still the right expression there and `activeIcon` stays unused.
      const theme = readTheme();
      const { UNSAFE_root, queryByTestId } = renderWithTheme(
        <NativeTabBarGlyph
          item={{ ...SHAPE_ITEM, sfSymbol: 'house.fill' }}
          tint={theme.activeTint}
          size={21}
          active
        />,
      );
      expect(hosts(UNSAFE_root, 'SymbolView')).toHaveLength(1);
      expect(queryByTestId('filled-icon')).toBeNull();
    });
  });

  describe('theming', () => {
    it('resolves its defaults from Bloom tokens, never a hardcoded palette', () => {
      const theme = readTheme();
      // Upstream shipped a fixed dark palette; every role must instead come
      // from the active preset, which resolves to Bloom's `rgb(...)` tokens.
      for (const [role, value] of Object.entries(theme)) {
        expect([role, value]).toEqual([role, expect.stringMatching(/^rgba?\(/)]);
      }
      expect(theme.activeTint).not.toBe('#FFFFFF');
      expect(theme.activeTint).not.toBe(theme.inactiveTint);
    });

    it('paints the highlight with the resolved highlight token', () => {
      const theme = readTheme();
      const { UNSAFE_root } = renderWithTheme(<Bar activeIndex={0} />);
      const painted = UNSAFE_root.findAll(
        (node) => flattenStyle(node.props?.style).backgroundColor === theme.highlight,
      );
      expect(painted.length).toBeGreaterThan(0);
    });

    it('applies a partial theme override without dropping the other roles', () => {
      const defaults = readTheme();
      const overridden = readTheme({ highlight: 'rgb(1 2 3)' });
      expect(overridden.highlight).toBe('rgb(1 2 3)');
      expect(overridden.activeTint).toBe(defaults.activeTint);
      expect(overridden.glassTint).toBe(defaults.glassTint);
    });

    it('never lets an explicit undefined in a partial punch a hole', () => {
      const defaults = readTheme();
      expect(readTheme({ activeTint: undefined }).activeTint).toBe(defaults.activeTint);
    });

    it('paints the bar with an overridden highlight', () => {
      const { UNSAFE_root } = renderWithTheme(
        <Bar activeIndex={0} theme={{ highlight: 'rgb(9 9 9)' }} />,
      );
      const painted = UNSAFE_root.findAll(
        (node) => flattenStyle(node.props?.style).backgroundColor === 'rgb(9 9 9)',
      );
      expect(painted.length).toBeGreaterThan(0);
    });
  });

  describe('native platform variants', () => {
    it('falls back to the solid theme fill when liquid glass is unavailable', () => {
      // The `expo-glass-effect` mock reports `isLiquidGlassAvailable() === false`
      // (see the note in that file), so this is the branch every Android and
      // pre-iOS-26 device takes.
      const theme = readTheme();
      const { UNSAFE_root } = renderWithTheme(
        <NativeTabBarSurface theme={theme} style={{ borderRadius: 29 }} />,
      );
      expect(hosts(UNSAFE_root, 'GlassView')).toHaveLength(0);
      const surface = hosts(UNSAFE_root, 'Animated.View')[0];
      expect(flattenStyle(surface?.props.style).backgroundColor).toBe(theme.solidFallback);
    });

    it('renders an SF Symbol on iOS when the item carries one', () => {
      const theme = readTheme();
      const item: TabBarItem = { ...(ITEMS[0] as TabBarItem), sfSymbol: 'house.fill' };
      const { UNSAFE_root } = renderWithTheme(
        <NativeTabBarGlyph item={item} tint={theme.activeTint} size={21} active />,
      );
      const symbol = hosts(UNSAFE_root, 'SymbolView')[0];
      expect(symbol?.props.name).toBe('house.fill');
      expect(symbol?.props.tintColor).toBe(theme.activeTint);
      expect(symbol?.props.size).toBe(21);
    });

    it('falls back to the item icon when no SF Symbol is given', () => {
      const theme = readTheme();
      const { queryByTestId, UNSAFE_root } = renderWithTheme(
        <NativeTabBarGlyph item={ITEMS[0] as TabBarItem} tint={theme.activeTint} size={21} active />,
      );
      expect(hosts(UNSAFE_root, 'SymbolView')).toHaveLength(0);
      expect(queryByTestId('home-icon')).toBeTruthy();
    });
  });
});
