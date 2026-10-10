/**
 * `Card` is the one place that decides what a card surface is made of, and the
 * card-shaped families compose it instead of drawing that chrome by hand. Two distinct
 * things therefore need pinning:
 *
 *   1. the axes themselves — a rung from `RADIUS` rather than a free number, and
 *      an explicit `border`/`elevation` beating the variant's default, which is
 *      what keeps "this surface is a bit different" from becoming a new variant;
 *   2. the RESOLVED chrome of each composing surface (plus the hover card's own
 *      floating-panel chrome, pinned here beside them), because the
 *      composition's whole warrant was that it moved no pixels. A browser run
 *      measured that once; this is what keeps it true, and it can see it because
 *      Bloom applies background, radius, border and shadow as inline resolved
 *      tokens rather than classes.
 */

import { resolveSurfaceTint } from '../surface/shared';
import { View } from 'react-native';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Card } from '../card';
import { buildTheme } from '../theme/build-theme';
import { RADIUS, BORDER_WIDTH } from '../design-tokens/scales';
import { SHADOW_BOX } from '../design-tokens/shadows';
import { SettingsListGroup, SettingsListItem } from '../settings-list';
import { UserHoverCard } from '../user-hover-card';
import { MENU_SHADOW } from '../floating/menu-palette';
import { LinkPreviewCard } from '../link-preview';
import { findHost, resolvedStyle, type HostNode } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The chrome that actually landed on a `Card`, addressed by its `testID`. */
function chromeOf(tree: unknown, testID: string) {
  const host = findHost(tree, testID);
  if (host === null) throw new Error(`no host rendered for testID "${testID}"`);
  return resolvedStyle(host.props.style);
}

/**
 * The first host node carrying a corner radius, in document order. The composing
 * families wrap their card in layout containers, so "the outermost node" is the
 * wrong address — but only the card itself is rounded.
 */
function roundedNode(node: unknown): HostNode {
  const stack: unknown[] = [node];
  while (stack.length > 0) {
    const current = stack.shift();
    if (Array.isArray(current)) {
      stack.unshift(...current);
      continue;
    }
    if (typeof current !== 'object' || current === null) continue;
    const host = current as HostNode;
    if (typeof host.type === 'string') {
      if (resolvedStyle(host.props?.style).borderRadius != null) return host;
      if (host.children) stack.unshift(...host.children);
    }
  }
  throw new Error('no rounded node in tree');
}

describe('Card axes', () => {
  it('keeps the outlined fill on shared glass material while explicit appearance wins', () => {
    const opaque = renderWithTheme(<Card testID="c" appearance="outline" />);
    expect(
      opaque
        .getByTestId('c')
        .find((node) => typeof node.props.fill === 'string' && node.props.radius !== undefined)
        .props.fill,
    ).toBe(resolveSurfaceTint(buildTheme('oxy', 'light').colors.card));
    const outline = renderWithTheme(<Card appearance="outline" testID="c" />);
    expect(chromeOf(outline.toJSON(), 'c').backgroundColor).toBe('transparent');
  });
  it('takes its corner from a RADIUS rung, not a free number', () => {
    const { toJSON } = renderWithTheme(
      <Card radius="radius-20" testID="c">
        {null}
      </Card>,
    );
    expect(chromeOf(toJSON(), 'c').borderRadius).toBe(RADIUS['radius-20']);
    expect(RADIUS['radius-20']).toBe(20);
  });

  it('defaults to the radius-20 rung', () => {
    const { toJSON } = renderWithTheme(<Card testID="c">{null}</Card>);
    expect(chromeOf(toJSON(), 'c').borderRadius).toBe(RADIUS['radius-20']);
  });

  it.each([
    ['plain', 0, 'none'],
    ['solid', 0, SHADOW_BOX.s],
    ['outline', 1, 'none'],
    ['subtle', 0, 'none'],
  ] as const)('variant %s resolves to border %s / shadow %s', (variant, borderWidth, shadow) => {
    const { toJSON } = renderWithTheme(
      <Card appearance={variant} testID="c">
        {null}
      </Card>,
    );
    const style = chromeOf(toJSON(), 'c');
    expect(style.borderWidth).toBe(borderWidth);
    expect(style.boxShadow ?? 'none').toBe(shadow);
  });

  it('lets an explicit axis beat the variant default, in both directions', () => {
    const added = renderWithTheme(
      <Card appearance="plain" border="hairline" elevation="m" testID="c">
        {null}
      </Card>,
    );
    const addedStyle = chromeOf(added.toJSON(), 'c');
    expect(addedStyle.borderWidth).toBe(BORDER_WIDTH.hairline);
    expect(addedStyle.boxShadow).toBe(SHADOW_BOX.m);

    const removed = renderWithTheme(
      <Card appearance="solid" elevation="none" testID="c">
        {null}
      </Card>,
    );
    expect(chromeOf(removed.toJSON(), 'c').boxShadow).toBeUndefined();
  });

  it('uses the contextual page fill for neutral subtle and outline appearances', () => {
    const filled = renderWithTheme(
      <Card appearance="subtle" testID="c">
        {null}
      </Card>,
    );
    const outlined = renderWithTheme(
      <Card appearance="outline" testID="c">
        {null}
      </Card>,
    );
    const filledBg = filled
      .getByTestId('c')
      .find((node) => typeof node.props.fill === 'string' && node.props.radius !== undefined)
      .props.fill;
    const outlinedBg = outlined
      .getByTestId('c')
      .find((node) => typeof node.props.fill === 'string' && node.props.radius !== undefined)
      .props.fill;
    expect(typeof filledBg).toBe('string');
    expect(filledBg).toBe(resolveSurfaceTint(buildTheme('oxy', 'light').colors.card));
    expect(filledBg).toBe(outlinedBg);
  });

  it('is a button when pressable and a link when told so', () => {
    const button = renderWithTheme(
      <Card onPress={() => {}} testID="c">
        {null}
      </Card>,
    );
    expect(findHost(button.toJSON(), 'c')?.props.accessibilityRole).toBe('button');

    const link = renderWithTheme(
      <Card onPress={() => {}} accessibilityRole="link" testID="c">
        {null}
      </Card>,
    );
    expect(findHost(link.toJSON(), 'c')?.props.accessibilityRole).toBe('link');
  });

  it('keeps the shadow node unclipped by default', () => {
    const { toJSON } = renderWithTheme(<Card testID="c">{null}</Card>);
    expect(chromeOf(toJSON(), 'c').overflow).toBeUndefined();
  });
});

describe('Card content clipping', () => {
  it('clips with inset shape while preserving the outer shadow host', () => {
    const { toJSON } = renderWithTheme(
      <Card clipContent border="medium" radius="radius-20" testID="c">
        <View testID="inside" />
      </Card>,
    );
    expect(chromeOf(toJSON(), 'c')).toMatchObject({ borderRadius: 20, borderWidth: 2 });
    expect(chromeOf(toJSON(), 'c').overflow).toBeUndefined();
    expect(chromeOf(toJSON(), 'c-clip')).toMatchObject({ borderRadius: 18, overflow: 'hidden' });
  });
});

describe('the surfaces that compose Card keep their own chrome', () => {
  it('settings-list group: radius-16, no border, no shadow, clipped', () => {
    const { toJSON } = renderWithTheme(
      <SettingsListGroup title="Account">
        <SettingsListItem title="Profile" onPress={() => {}} />
      </SettingsListGroup>,
    );
    const style = resolvedStyle(roundedNode(toJSON()).props.style);
    expect(style.borderRadius).toBe(RADIUS['radius-16']);
    expect(style.borderWidth).toBe(0);
    expect(style.boxShadow).toBeUndefined();
    expect(style.overflow).toBeUndefined();
  });

  it('user-hover-card: floating panel — radius 16, 1px border, shadow-dropdown', () => {
    // No longer composes `Card`: the hover card now wears the ported menu
    // surface (`floating/menu-palette.ts`) so it matches the panels around it.
    const { toJSON } = renderWithTheme(
      <UserHoverCard displayName="Nate" username="nate" animateIn={false} />,
    );
    const style = resolvedStyle(roundedNode(toJSON()).props.style);
    expect(style.borderRadius).toBe(16);
    expect(style.borderWidth).toBe(1);
    expect(style.boxShadow).toBe(MENU_SHADOW.light);
    expect(style.overflow).toBe('visible');
  });

  it('link-preview: radius-20 with a real border and background, not classes', () => {
    const { toJSON } = renderWithTheme(<LinkPreviewCard url="https://oxy.so" onPress={() => {}} />);
    const style = resolvedStyle(roundedNode(toJSON()).props.style);
    expect(style.borderRadius).toBe(RADIUS['radius-20']);
    // The chrome used to be `border border-border bg-card`, which is inert on
    // web until the consumer wires the Tailwind pipeline — the card then drew
    // as an unbordered transparent block with no error anywhere.
    expect(style.borderWidth).toBe(1);
    expect(typeof style.backgroundColor).toBe('string');
    expect(style.overflow).toBeUndefined();
  });
});

it.each([false, true])(
  'forwards ref and measurement to the card host (interactive=%s)',
  (interactive) => {
    const handle = { measure: jest.fn() };
    const ref = React.createRef<import('react-native').View>();
    const onLayout = jest.fn();
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <Card
          ref={ref}
          testID="measured-card"
          onLayout={onLayout}
          onPress={interactive ? () => {} : undefined}
        >
          Content
        </Card>
      </BloomThemeProvider>,
      {
        createNodeMock: (element) =>
          (element.props as { testID?: string }).testID === 'measured-card' ? handle : null,
      },
    );
    expect(ref.current).toBe(handle);
    const event = { nativeEvent: { layout: { x: 0, y: 0, width: 310, height: 96 } } };
    fireEvent(screen.getByTestId('measured-card'), 'layout', event);
    expect(onLayout).toHaveBeenCalledWith(event);
    screen.unmount();
    expect(ref.current).toBeNull();
  },
);

it('shares radius precedence with Surface while preserving the actual card host', () => {
  const fallback = renderWithTheme(<Card testID="geometry" style={{ borderRadius: 8 }} />);
  expect(chromeOf(fallback.toJSON(), 'geometry').borderRadius).toBe(8);
  fallback.unmount();
  const explicit = renderWithTheme(
    <Card testID="geometry" radius="radius-20" style={{ borderRadius: 8 }} />,
  );
  expect(chromeOf(explicit.toJSON(), 'geometry').borderRadius).toBe(20);
});
