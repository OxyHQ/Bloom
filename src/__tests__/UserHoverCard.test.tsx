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
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ImageResolverProvider, type ImageResolver } from '../image-resolver';
import { UserHoverCard } from '../user-hover-card';

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
