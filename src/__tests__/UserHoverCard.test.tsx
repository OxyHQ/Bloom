/**
 * `UserHoverCard` is presentational on purpose: Bloom holds NO follow logic, so
 * the consumer passes the SDK's own follow button through the `action` slot.
 * The tests therefore pin the CONTRACT — what the card renders, what it
 * delegates, and the one thing that goes wrong silently.
 *
 * That one thing is the avatar prop. The value reaches `Avatar` as `source`,
 * never `uri`: `source` sends a non-URL string (an Oxy file id) through the
 * consumer's `ImageResolver`, while `uri` is taken as a raw URL, so a file id
 * 404s and every avatar in the ecosystem falls back to its initial. Nothing
 * throws; the card just shows a letter.
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { render, fireEvent, within } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ImageResolverProvider, type ImageResolver } from '../image-resolver';
import {
  USER_HOVER_CARD_CONTENT_WIDTH,
  USER_HOVER_CARD_INSET,
  USER_HOVER_CARD_WIDTH,
  UserHoverCard,
} from '../user-hover-card';
import { findHost, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('UserHoverCard', () => {
  it('renders the identity: display name, handle with its @, and bio', () => {
    const { getByText } = renderWithTheme(
      <UserHoverCard displayName="Nate Isern" username="nate" bio="Building Oxy." />,
    );
    expect(getByText('Nate Isern')).toBeTruthy();
    expect(getByText('@nate')).toBeTruthy();
    expect(getByText('Building Oxy.')).toBeTruthy();
  });

  it('omits the handle line entirely when there is no username', () => {
    const { queryByText, getByText } = renderWithTheme(<UserHoverCard displayName="Anon" />);
    expect(getByText('Anon')).toBeTruthy();
    expect(queryByText('@')).toBeNull();
  });

  it('renders each stat as a value and a label', () => {
    const { getByText } = renderWithTheme(
      <UserHoverCard
        displayName="Nate"
        stats={[
          { label: 'Following', value: '312' },
          { label: 'Followers', value: '4.8K' },
        ]}
      />,
    );
    expect(getByText('Following')).toBeTruthy();
    expect(getByText('312')).toBeTruthy();
    expect(getByText('Followers')).toBeTruthy();
    expect(getByText('4.8K')).toBeTruthy();
  });

  it('renders whatever the consumer puts in the action slot, holding no follow state', () => {
    const { getByText } = renderWithTheme(
      <UserHoverCard displayName="Nate" action={<Text>Follow</Text>} />,
    );
    expect(getByText('Follow')).toBeTruthy();
  });

  it('renders the footer slot, so a consumer can add what Bloom does not know', () => {
    const { getByText } = renderWithTheme(
      <UserHoverCard displayName="Nate" footer={<Text>Contribution graph</Text>} />,
    );
    expect(getByText('Contribution graph')).toBeTruthy();
  });

  it('renders the footer OUTSIDE the identity button, not within it', () => {
    // The slot is a SIBLING of the identity area on purpose. Nested, a press
    // anywhere on the consumer's content (a chart, a line of text — anything
    // that is not itself pressable) would open the profile, and on web the
    // block would sit inside a real `<button>`, where interactive content is
    // invalid HTML. Both failures are silent.
    //
    // The first assertion is this test's positive control: without it, deleting
    // the slot entirely would satisfy "not inside the button".
    const { getByText, getByLabelText } = renderWithTheme(
      <UserHoverCard
        displayName="Nate"
        username="nate"
        onPressProfile={() => {}}
        footer={<Text>Contribution graph</Text>}
      />,
    );
    expect(getByText('Contribution graph')).toBeTruthy();
    expect(within(getByLabelText('Nate (@nate)')).queryByText('Contribution graph')).toBeNull();
  });

  it('renders the badge slot beside the handle, INSIDE the identity area', () => {
    // The mirror of the footer test above, and the pair is the design: `footer`
    // is a sibling of the identity area, `badge` is a child of it, because a
    // marker that belongs beside the handle cannot be anywhere else. Asserting
    // both directions is what makes either one a decision rather than an
    // accident of where the JSX happened to land.
    const { getByText, getByLabelText } = renderWithTheme(
      <UserHoverCard
        displayName="Nate"
        username="nate"
        onPressProfile={() => {}}
        badge={<Text>channel</Text>}
        footer={<Text>Contribution graph</Text>}
      />,
    );
    const identity = within(getByLabelText('Nate (@nate)'));
    expect(identity.queryByText('channel')).not.toBeNull();
    expect(identity.queryByText('@nate')).not.toBeNull();
    expect(identity.queryByText('Contribution graph')).toBeNull();
    expect(getByText('Contribution graph')).toBeTruthy();
  });

  it('renders the badge even with no handle, because it describes the account', () => {
    const { getByText, queryByText } = renderWithTheme(
      <UserHoverCard displayName="Anon" badge={<Text>channel</Text>} />,
    );
    expect(getByText('channel')).toBeTruthy();
    expect(queryByText('@')).toBeNull();
  });

  it('keeps a pressable badge’s press out of the identity handler', () => {
    // Measured in Chrome too: react-native-web implements the responder system,
    // so this holds on web as well and needs no `stopPropagation`.
    const onPressProfile = jest.fn();
    const onPressBadge = jest.fn();
    const { getByText } = renderWithTheme(
      <UserHoverCard
        displayName="Nate"
        username="nate"
        onPressProfile={onPressProfile}
        badge={
          <Pressable onPress={onPressBadge}>
            <Text>channel</Text>
          </Pressable>
        }
      />,
    );
    fireEvent.press(getByText('channel'));
    expect(onPressBadge).toHaveBeenCalledTimes(1);
    expect(onPressProfile).not.toHaveBeenCalled();
  });

  it('renders at the published geometry, so slot content can be sized to a number', () => {
    // The card does not clip, so a consumer that guesses the inner width finds
    // out by painting outside the border. These three numbers are the contract
    // that makes guessing unnecessary, and the arithmetic between them is the
    // part worth pinning: the CONTENT width is decided, the card's width is
    // derived.
    expect(USER_HOVER_CARD_WIDTH).toBe(
      USER_HOVER_CARD_CONTENT_WIDTH + USER_HOVER_CARD_INSET * 2,
    );
    const { toJSON } = renderWithTheme(<UserHoverCard displayName="Nate" testID="card" />);
    const host = findHost(toJSON(), 'card');
    if (host === null) throw new Error('no host rendered for testID "card"');
    const style = resolvedStyle(host.props.style);
    expect(style.width).toBe(USER_HOVER_CARD_WIDTH);
    expect(style.padding).toBe(USER_HOVER_CARD_INSET);
    // Both reasons `docs/card.mdx` gives for opting out of `Card`'s clip apply
    // to this card, and slot content that overflows is meant to be visible.
    expect(style.overflow).toBe('visible');
  });

  it('leaves a pressable inside the footer working on its own', () => {
    const onPressFooter = jest.fn();
    const { getByText } = renderWithTheme(
      <UserHoverCard
        displayName="Nate"
        username="nate"
        onPressProfile={() => {}}
        footer={
          <Pressable onPress={onPressFooter}>
            <Text>See all activity</Text>
          </Pressable>
        }
      />,
    );
    fireEvent.press(getByText('See all activity'));
    expect(onPressFooter).toHaveBeenCalledTimes(1);
  });

  it('makes the identity pressable only when given a handler', () => {
    const onPressProfile = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <UserHoverCard displayName="Nate" username="nate" onPressProfile={onPressProfile} />,
    );
    fireEvent.press(getByLabelText('Nate (@nate)'));
    expect(onPressProfile).toHaveBeenCalledTimes(1);
  });

  it('resolves the avatar through the ImageResolver, so a bare file id works', () => {
    // The failure this pins is total and silent: passed as `uri`, a file id is
    // used as a URL, the image 404s, and every card shows a placeholder letter.
    const resolve = jest.fn<ReturnType<ImageResolver>, Parameters<ImageResolver>>(
      (id, variant) => `https://cloud.oxy.so/${id}?variant=${variant ?? ''}`,
    );
    render(
      <BloomThemeProvider mode="light" colorPreset="oxy">
        <ImageResolverProvider value={resolve}>
          <UserHoverCard displayName="Nate" avatar="file-abc123" />
        </ImageResolverProvider>
      </BloomThemeProvider>,
    );
    expect(resolve).toHaveBeenCalledWith('file-abc123', 'thumb');
  });
});
