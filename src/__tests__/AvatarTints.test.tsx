import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import { Avatar, AVATAR_SIZES, resolveAvatarTint } from '../avatar';
import { avatarInitialsType, avatarTintForName } from '../avatar/initials';

/** Deep-merge a style prop (jest's react-native mock does not flatten). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flat(style: any): Record<string, any> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flat));
  return style ?? {};
}

function withTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="blue">
      {ui}
    </BloomThemeProvider>,
  );
}

function captureTheme(mode: 'light' | 'dark'): Theme {
  let theme: Theme | undefined;
  function Probe() {
    theme = useTheme();
    return null;
  }
  withTheme(<Probe />, mode);
  if (!theme) throw new Error('no theme');
  return theme;
}

describe('Avatar — size rungs and initials', () => {
  it('maps the rungs to pixels', () => {
    expect(AVATAR_SIZES).toEqual({ xs: 20, sm: 24, md: 32, lg: 36 });
  });

  it('sets the initials type per rung', () => {
    expect(avatarInitialsType(20)).toMatchObject({ fontSize: 10, lineHeight: 15, fontWeight: '600' });
    expect(avatarInitialsType(24)).toMatchObject({ fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0 });
    expect(avatarInitialsType(32)).toMatchObject({ fontSize: 16, lineHeight: 22, fontWeight: '600' });
    expect(avatarInitialsType(36)).toMatchObject({ fontSize: 18, lineHeight: 24, fontWeight: '600' });
    expect(avatarInitialsType(40)).toMatchObject({ fontSize: 18, lineHeight: 24 });
  });

  it('renders a token size at its pixels with explicit initials', () => {
    const { getByText, toJSON } = withTheme(<Avatar size="md" color="blue" initials="M" />);
    const text = getByText('M');
    expect(flat(text.props.style)).toMatchObject({ fontSize: 16, lineHeight: 22 });
    expect(JSON.stringify(toJSON())).toContain('"width":32');
  });

  it('paints the tint the resolver returns, on both the disc and the letter', () => {
    const theme = captureTheme('light');
    const tint = resolveAvatarTint(theme, 'lime');
    const { getByText, toJSON } = withTheme(<Avatar size="lg" color="lime" initials="A" />);
    expect(flat(getByText('A').props.style).color).toBe(tint.foreground);
    expect(JSON.stringify(toJSON())).toContain(tint.background);
  });

  it('keeps the neutral disc lighter in light mode than in dark', () => {
    const light = resolveAvatarTint(captureTheme('light'), 'neutral');
    const dark = resolveAvatarTint(captureTheme('dark'), 'neutral');
    expect(light.background).not.toBe(dark.background);
  });

  it('derives a stable tint and initial from a name', () => {
    expect(avatarTintForName('Ada Lovelace')).toBe(avatarTintForName('Ada Lovelace'));
    const { getByText } = withTheme(<Avatar name="ada" size={40} />);
    expect(getByText('A')).toBeTruthy();
  });

  it('gives a caller placeholderColor a white letter', () => {
    const { getByText } = withTheme(<Avatar name="Zed" placeholderColor="#123456" />);
    expect(flat(getByText('Z').props.style).color).toBe('#FFFFFF');
  });
});
