/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Avatar } from '../avatar';
import type { AvatarSizeToken } from '../avatar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({
  scope,
  nestedScope,
  size,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  size?: number | AvatarSizeToken;
}) {
  const avatar = <Avatar name="Ada Lovelace" size={size} testID="avatar" />;
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{avatar}</BloomScope> : avatar}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('maps Bloom control scopes onto Avatar size rungs in DOM web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: {
    scope?: BloomSize;
    nestedScope?: BloomSize;
    size?: number | AvatarSizeToken;
  }) => act(() => root.render(<Subject {...props} />));
  const dimensions = () => {
    const avatar = host.querySelector<HTMLElement>('[data-testid="avatar"]');
    if (!avatar) throw new Error('Avatar fixture did not render');
    return [getComputedStyle(avatar).width, getComputedStyle(avatar).height];
  };
  try {
    renderSubject();
    expect(dimensions()).toEqual(['40px', '40px']);
    renderSubject({ scope: 'xs' });
    expect(dimensions()).toEqual(['20px', '20px']);
    renderSubject({ scope: 'sm' });
    expect(dimensions()).toEqual(['24px', '24px']);
    renderSubject({ scope: 'md' });
    expect(dimensions()).toEqual(['32px', '32px']);
    renderSubject({ scope: 'lg' });
    expect(dimensions()).toEqual(['36px', '36px']);
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(dimensions()).toEqual(['36px', '36px']);
    renderSubject({ scope: 'xs', size: 'md' });
    expect(dimensions()).toEqual(['32px', '32px']);
    renderSubject({ scope: 'lg', size: 48 });
    expect(dimensions()).toEqual(['48px', '48px']);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
