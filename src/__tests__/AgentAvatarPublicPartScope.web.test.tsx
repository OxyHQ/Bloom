/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { AgentAvatar } from '../agent-avatar/AgentAvatar';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size, avatarSize }: { size?: 'xs' | 'lg'; avatarSize?: number }) {
  const avatar = (
    <AgentAvatar character={{ preset: 'blue_beret' }} size={avatarSize} paused testID="avatar" />
  );
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{avatar}</BloomScope> : avatar}
    </BloomThemeProvider>
  );
}

it('preserves numeric character artwork geometry across control scopes', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (props?: { size?: 'xs' | 'lg'; avatarSize?: number }) =>
      act(() => root.render(<Subject {...props} />));
    const dimensions = () => {
      const avatar = host.querySelector<HTMLElement>('[data-testid="avatar"]');
      if (!avatar) throw new Error('AgentAvatar did not render');
      return getComputedStyle(avatar);
    };

    renderSubject();
    expect(dimensions().width).toBe('64px');
    expect(dimensions().height).toBe('64px');
    renderSubject({ size: 'xs' });
    expect(dimensions().width).toBe('64px');
    expect(dimensions().height).toBe('64px');
    renderSubject({ size: 'lg' });
    expect(dimensions().width).toBe('64px');
    expect(dimensions().height).toBe('64px');

    renderSubject({ avatarSize: 48, size: 'xs' });
    expect(dimensions().width).toBe('48px');
    expect(dimensions().height).toBe('48px');
    renderSubject({ avatarSize: 48, size: 'lg' });
    expect(dimensions().width).toBe('48px');
    expect(dimensions().height).toBe('48px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
