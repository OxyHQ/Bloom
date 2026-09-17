import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Announcement } from '../announcement';
import type { AnnouncementProps } from '../announcement';

const renderAnnouncement = (props: Partial<AnnouncementProps> = {}) =>
  render(
    <BloomThemeProvider mode="light" colorPreset="blue">
      <Announcement title="Upgrade to Pro" testID="card" {...props} />
    </BloomThemeProvider>,
  );

const hostName = (node: { type: unknown }): string => (typeof node.type === 'string' ? node.type : '');

function flat(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return style && typeof style === 'object' ? (style as Record<string, unknown>) : {};
}

describe('Announcement', () => {
  it('paints the card: radius 12, padding 12, gap 12, border, no shadow', () => {
    const { getByTestId } = renderAnnouncement();
    const style = flat(getByTestId('card').props.style);
    expect(style).toMatchObject({ borderRadius: 12, padding: 12, gap: 12, borderWidth: 1, width: '100%' });
    expect(style.boxShadow).toBeUndefined();
  });

  it('renders title on body-medium and description on body-2-medium', () => {
    const { getByText } = renderAnnouncement({ description: 'Unlock more.' });
    expect(flat(getByText('Upgrade to Pro').props.style)).toMatchObject({ fontSize: 14, lineHeight: 20, fontWeight: '500' });
    expect(flat(getByText('Unlock more.').props.style)).toMatchObject({ fontSize: 13, lineHeight: 18, fontWeight: '500' });
  });

  it('omits the description, CTA and close button unless asked', () => {
    const utils = renderAnnouncement();
    expect(utils.UNSAFE_root.findAll((n) => hostName(n) === 'Pressable')).toHaveLength(0);
  });

  it('renders the CTA and calls onAction', () => {
    const onAction = jest.fn();
    const { getByText } = renderAnnouncement({ actionLabel: 'Upgrade now', onAction });
    fireEvent.press(getByText('Upgrade now'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('names the close button, and dismissing unmounts then fires onClose', () => {
    const onClose = jest.fn();
    const utils = renderAnnouncement({ dismissible: true, onClose, closeLabel: 'Hide' });
    const close = utils.UNSAFE_root.findAll(
      (n) => hostName(n) === 'Pressable' && n.props.accessibilityLabel === 'Hide',
    )[0];
    expect(close).toBeDefined();
    expect(flat(close?.props.style)).toMatchObject({ position: 'absolute', top: 0, right: 0 });
    act(() => {
      if (close) fireEvent.press(close);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(utils.queryByTestId('card')).toBeNull();
  });
});
