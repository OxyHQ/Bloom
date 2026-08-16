/**
 * `ProfileCard` is a COMPOSITION — a `Card` holding an `Avatar`, one of three
 * metric visuals and an `AvatarGroup` facepile — so everything worth asserting
 * is about what it hands its parts, not about pixels it draws itself. Three
 * things in that wiring fail silently:
 *
 *   - the avatar value going to `uri` instead of `source`, which skips the
 *     consumer's `ImageResolver` and turns every Oxy file id into a placeholder
 *     letter (the org-wide rule this card is one call site of);
 *   - a variant's accent not reaching the metric, which is invisible in any
 *     structural assertion because the card still renders in full;
 *   - the metric union dispatching to the wrong arm, which renders a DIFFERENT
 *     but perfectly valid visual.
 *
 * The identity fallback in the facepile is asserted here too, because it is
 * `AvatarGroup`'s rule and `ProfileCard` is what a consumer hands raw profile
 * items to. See the last test for where it diverges from the org rule.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import { ProfileCard } from '../profile-card';
import { ImageResolverProvider } from '../image-resolver';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { ThemeColors } from '../theme/types';
import type { ProfileCardProps, ProfileCardVariant } from '../profile-card/types';
import { pressHost } from './support/press-host';
import { findHost, hostNodes, resolvedStyle, type HostNode } from './support/rendered-style';

type Rendered = ReturnType<typeof render>;

function renderCard(
  props: Partial<ProfileCardProps> & Pick<ProfileCardProps, 'avatar' | 'value'>,
  resolver?: (id: string, variant?: string) => string | undefined,
): Rendered {
  return render(
    <ImageResolverProvider value={resolver ?? null}>
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <ProfileCard testID="card" {...props} />
      </BloomThemeProvider>
    </ImageResolverProvider>,
  );
}

/** The resolved palette the card renders against. */
function themeColors(): ThemeColors {
  let captured: ThemeColors | null = null;
  function Probe(): null {
    captured = useTheme().colors;
    return null;
  }
  render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <Probe />
    </BloomThemeProvider>,
  );
  if (captured === null) throw new Error('theme probe never rendered');
  return captured;
}

/** Every host node of a type, in document order. */
function hostsOfType(tree: unknown, type: string): HostNode[] {
  return hostNodes(tree).filter((node) => node.type === type);
}

const AVATAR = { source: 'file-abc', name: 'Ada Lovelace' };

describe('ProfileCard', () => {
  it('routes the avatar value through `source`, so a file id reaches the ImageResolver', () => {
    // The CRITICAL rule, and the one whose breakage looks like a styling bug:
    // `uri` is used raw, so an Oxy file id would 404 and the card would show a
    // placeholder letter with nothing in the console.
    const resolver = jest.fn((id: string, variant?: string) => `https://cdn/${id}/${variant}`);
    const tree = renderCard({ avatar: AVATAR, value: '1,204' }, resolver).toJSON();

    expect(resolver).toHaveBeenCalledWith('file-abc', 'thumb');
    const images = hostsOfType(tree, 'Image');
    expect(images).toHaveLength(1);
    expect(images[0]?.props.source).toEqual({ uri: 'https://cdn/file-abc/thumb' });
  });

  it.each<[ProfileCardVariant, keyof ThemeColors]>([
    ['wallet', 'success'],
    ['shopping', 'warning'],
    ['social', 'primary'],
    ['stat', 'info'],
  ])('gives the %s variant its own semantic accent', (variant, token) => {
    const colors = themeColors();
    const tree = renderCard({
      avatar: AVATAR,
      value: '1,204',
      variant,
      metric: { kind: 'dots', filled: 1, total: 2 },
    }).toJSON();

    // The first dot is the filled one; the second is the empty track, which is
    // what makes this able to tell an accent from "everything is one colour".
    const dots = hostsOfType(tree, 'View').filter(
      (node) => resolvedStyle(node.props.style).borderRadius === 4.5,
    );
    expect(dots).toHaveLength(2);
    expect(resolvedStyle(dots[0]?.props.style).backgroundColor).toBe(colors[token]);
    expect(resolvedStyle(dots[1]?.props.style).backgroundColor).toBe(
      colors.backgroundSecondary,
    );
  });

  it('lets a metric name its own colour, overriding the variant accent', () => {
    const colors = themeColors();
    const tree = renderCard({
      avatar: AVATAR,
      value: '1,204',
      variant: 'wallet',
      metric: { kind: 'dots', filled: 1, total: 2, filledColor: '#123456' },
    }).toJSON();

    const dots = hostsOfType(tree, 'View').filter(
      (node) => resolvedStyle(node.props.style).borderRadius === 4.5,
    );
    expect(resolvedStyle(dots[0]?.props.style).backgroundColor).toBe('#123456');
    expect(resolvedStyle(dots[0]?.props.style).backgroundColor).not.toBe(colors.success);
  });

  it('dispatches each metric kind to a different visual', () => {
    // `progress` and `split` are both `StatBar`s and both render a label, so the
    // label alone cannot tell them apart — the progress arm announces its value
    // as a progressbar, the split arm renders a percentage instead.
    const progress = renderCard({
      avatar: AVATAR,
      value: '1,204',
      metric: { kind: 'progress', label: 'Goal', value: 30, max: 120 },
    });
    const progressBar = hostNodes(progress.toJSON()).find(
      (node) => node.props.accessibilityRole === 'progressbar',
    );
    expect(progressBar?.props['aria-valuenow']).toBe(30);
    expect(progressBar?.props['aria-valuemax']).toBe(120);

    const split = renderCard({
      avatar: AVATAR,
      value: '1,204',
      metric: {
        kind: 'split',
        label: 'Flow',
        percent: 62,
        leftValue: 'in',
        rightValue: 'out',
      },
    });
    expect(split.getByText('62%')).toBeTruthy();
    expect(
      hostNodes(split.toJSON()).some((node) => node.props.accessibilityRole === 'progressbar'),
    ).toBe(false);

    const custom = renderCard({
      avatar: AVATAR,
      value: '1,204',
      metric: { kind: 'custom', node: <RNText testID="own">mine</RNText> },
    });
    expect(findHost(custom.toJSON(), 'own')).not.toBeNull();
  });

  it('sizes itself by layout: a fixed widget or a full-width row', () => {
    const widget = findHost(renderCard({ avatar: AVATAR, value: '1' }).toJSON(), 'card');
    expect(resolvedStyle(widget?.props.style).width).toBe(240);

    const wide = findHost(
      renderCard({ avatar: AVATAR, value: '1', layout: 'wide' }).toJSON(),
      'card',
    );
    expect(resolvedStyle(wide?.props.style).width).toBe('100%');
  });

  it('caps the facepile at four and counts the rest', () => {
    const items = ['ada', 'grace', 'alan', 'linus', 'margaret', 'katherine'].map((username) => ({
      id: username,
      username,
    }));
    const withDefault = renderCard({
      avatar: AVATAR,
      value: '1',
      footer: { label: 'Top', items },
    });
    expect(withDefault.getByText('+2')).toBeTruthy();

    // …and the cap is a prop, not a constant: raising it consumes the overflow.
    const raised = renderCard({
      avatar: AVATAR,
      value: '1',
      footer: { label: 'Top', items, max: 6 },
    });
    expect(raised.queryByText('+2')).toBeNull();
  });

  it('falls back to the handle for a facepile item with no display name', () => {
    // What a consumer hands over is a raw profile: `displayName` is optional
    // ecosystem-wide, so the initial has to come from the handle when it is
    // absent — INCLUDING when "absent" arrives as `''` or `'   '`, which is
    // what the API sends and what `??` does not catch. Each letter below has
    // exactly one possible source, so a fall-through cannot be confused with a
    // collision.
    const rendered = renderCard({
      avatar: { source: 'file-abc', name: 'Nova' },
      value: '1',
      footer: {
        label: 'Top',
        items: [
          { id: '1', displayName: 'Ada Lovelace', username: 'ada' },
          { id: '2', username: 'grace' },
          { id: '3', displayName: '   ', username: 'zoe' },
          { id: '4', displayName: '', username: 'hopper' },
        ],
      },
    });

    expect(rendered.getByText('A')).toBeTruthy();
    // No `displayName` at all.
    expect(rendered.getByText('G')).toBeTruthy();
    // Whitespace-only, and empty-string: both fall through to the handle.
    expect(rendered.getByText('Z')).toBeTruthy();
    expect(rendered.getByText('H')).toBeTruthy();
    // The card's own avatar carries a name too, so it renders an initial rather
    // than an image — which makes the image count a clean zero and turns it into
    // a real discriminator: before the fix the two blank names each rendered a
    // default-avatar IMAGE, the one placeholder that says nothing about who the
    // person is. Counting images is what separates "the initial rendered" from
    // "something else did".
    expect(rendered.getByText('N')).toBeTruthy();
    expect(hostsOfType(rendered.toJSON(), 'Image')).toHaveLength(0);
  });

  it('is pressable as a whole only when the caller asks for it', () => {
    const onPress = jest.fn();
    const rendered = renderCard({ avatar: AVATAR, value: '1', onPress });

    // The handler has to land on the CARD's own host node — see `pressHost`,
    // which asserts that and presses THAT node. Splitting the two (assert on
    // the node `findHost` returns, press the one `getByTestId` returns) would
    // pass a component that made a different node the pressable one.
    pressHost(rendered.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);

    // And a card nobody asked to be pressable stays a plain surface, rather than
    // a button-shaped thing that swallows presses meant for what is under it.
    const inert = renderCard({ avatar: AVATAR, value: '1' });
    expect(findHost(inert.toJSON(), 'card')?.props.onPress).toBeUndefined();
  });
});
