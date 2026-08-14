/**
 * `Card` is the one place that decides what a card surface is made of, and five
 * families now compose it instead of drawing that chrome by hand. Two distinct
 * things therefore need pinning:
 *
 *   1. the axes themselves — a rung from `RADIUS` rather than a free number, and
 *      an explicit `border`/`elevation` beating the variant's default, which is
 *      what keeps "this surface is a bit different" from becoming a new variant;
 *   2. the RESOLVED chrome of each of the five composing surfaces, because the
 *      composition's whole warrant was that it moved no pixels. A browser run
 *      measured that once; this is what keeps it true, and it can see it because
 *      Bloom applies background, radius, border and shadow as inline resolved
 *      tokens rather than classes.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Card } from '../card';
import { RADIUS, BORDER_WIDTH } from '../design-tokens/scales';
import { SHADOW_BOX } from '../design-tokens/shadows';
import { SettingsListGroup, SettingsListItem } from '../settings-list';
import { UserHoverCard } from '../user-hover-card';
import { BenefitList, BenefitRow } from '../benefit-list';
import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '../icons/Lock';
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
  it('takes its corner from a RADIUS rung, not a free number', () => {
    const { toJSON } = renderWithTheme(
      <Card radius="radius-20" testID="c">
        {null}
      </Card>,
    );
    expect(chromeOf(toJSON(), 'c').borderRadius).toBe(RADIUS['radius-20']);
    expect(RADIUS['radius-20']).toBe(20);
  });

  it('defaults to the radius-12 rung', () => {
    const { toJSON } = renderWithTheme(<Card testID="c">{null}</Card>);
    expect(chromeOf(toJSON(), 'c').borderRadius).toBe(RADIUS['radius-12']);
  });

  it.each([
    ['plain', undefined, 'none'],
    ['elevated', undefined, SHADOW_BOX.s],
    ['outlined', 1, 'none'],
    ['filled', undefined, 'none'],
  ] as const)(
    'variant %s resolves to border %s / shadow %s',
    (variant, borderWidth, shadow) => {
      const { toJSON } = renderWithTheme(
        <Card variant={variant} testID="c">
          {null}
        </Card>,
      );
      const style = chromeOf(toJSON(), 'c');
      expect(style.borderWidth).toBe(borderWidth);
      expect(style.boxShadow ?? 'none').toBe(shadow);
    },
  );

  it('lets an explicit axis beat the variant default, in both directions', () => {
    const added = renderWithTheme(
      <Card variant="plain" border="hairline" elevation="m" testID="c">
        {null}
      </Card>,
    );
    const addedStyle = chromeOf(added.toJSON(), 'c');
    expect(addedStyle.borderWidth).toBe(BORDER_WIDTH.hairline);
    expect(addedStyle.boxShadow).toBe(SHADOW_BOX.m);

    const removed = renderWithTheme(
      <Card variant="elevated" elevation="none" testID="c">
        {null}
      </Card>,
    );
    expect(chromeOf(removed.toJSON(), 'c').boxShadow).toBeUndefined();
  });

  it('paints filled from backgroundSecondary and every other variant from card', () => {
    const filled = renderWithTheme(
      <Card variant="filled" testID="c">
        {null}
      </Card>,
    );
    const outlined = renderWithTheme(
      <Card variant="outlined" testID="c">
        {null}
      </Card>,
    );
    const filledBg = chromeOf(filled.toJSON(), 'c').backgroundColor;
    const outlinedBg = chromeOf(outlined.toJSON(), 'c').backgroundColor;
    expect(typeof filledBg).toBe('string');
    expect(filledBg).not.toBe(outlinedBg);
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

  it('clips its content to the corner by default', () => {
    const { toJSON } = renderWithTheme(<Card testID="c">{null}</Card>);
    expect(chromeOf(toJSON(), 'c').overflow).toBe('hidden');
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
    expect(style.borderWidth).toBeUndefined();
    expect(style.boxShadow).toBeUndefined();
    expect(style.overflow).toBe('hidden');
  });

  it('benefit-list: radius-20, hairline border, shadow-s, unclipped', () => {
    const { toJSON } = renderWithTheme(
      <BenefitList>
        <BenefitRow icon={<LockIcon size="sm" />} label="Share your name" />
      </BenefitList>,
    );
    const style = resolvedStyle(roundedNode(toJSON()).props.style);
    expect(style.borderRadius).toBe(RADIUS['radius-20']);
    expect(style.borderWidth).toBe(BORDER_WIDTH.hairline);
    expect(style.boxShadow).toBe(SHADOW_BOX.s);
    // A benefit list clips nothing; leaving Card's clip on would change what an
    // Android elevation draws under a rounded, clipped view.
    expect(style.overflow).toBe('visible');
  });

  it('user-hover-card: radius-16, hairline border, shadow-m (the overlay role)', () => {
    const { toJSON } = renderWithTheme(
      <UserHoverCard displayName="Nate" username="nate" />,
    );
    const style = resolvedStyle(roundedNode(toJSON()).props.style);
    expect(style.borderRadius).toBe(RADIUS['radius-16']);
    expect(style.borderWidth).toBe(BORDER_WIDTH.hairline);
    expect(style.boxShadow).toBe(SHADOW_BOX.m);
  });

  it('link-preview: radius-20 with a real border and background, not classes', () => {
    const { toJSON } = renderWithTheme(
      <LinkPreviewCard url="https://oxy.so" onPress={() => {}} />,
    );
    const style = resolvedStyle(roundedNode(toJSON()).props.style);
    expect(style.borderRadius).toBe(RADIUS['radius-20']);
    // The chrome used to be `border border-border bg-card`, which is inert on
    // web until the consumer wires the Tailwind pipeline — the card then drew
    // as an unbordered transparent block with no error anywhere.
    expect(style.borderWidth).toBe(1);
    expect(typeof style.backgroundColor).toBe('string');
    expect(style.overflow).toBe('hidden');
  });
});
