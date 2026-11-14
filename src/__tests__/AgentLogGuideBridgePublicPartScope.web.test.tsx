/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { AgentLogGuideBridge } from '../agent-log';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const bridge = <AgentLogGuideBridge height={6} offset={7} reduce />;
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{bridge}</BloomScope> : bridge}
    </BloomThemeProvider>
  );
}

it('keeps numeric tree-guide geometry independent of BloomScope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const geometry = () => {
      const bridge = host.querySelector<HTMLElement>('[data-testid="agent-log-guide-bridge"]');
      if (!bridge) throw new Error('AgentLogGuideBridge did not render');
      const style = getComputedStyle(bridge);
      return { width: style.width, height: style.height, top: style.top, left: style.left };
    };

    renderSubject();
    expect(geometry()).toEqual({ width: '1px', height: '6px', top: '-6px', left: '7px' });
    renderSubject('xs');
    expect(geometry()).toEqual({ width: '1px', height: '6px', top: '-6px', left: '7px' });
    renderSubject('lg');
    expect(geometry()).toEqual({ width: '1px', height: '6px', top: '-6px', left: '7px' });
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
