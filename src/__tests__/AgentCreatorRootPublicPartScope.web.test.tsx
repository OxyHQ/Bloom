/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: 1440,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: 900,
    configurable: true,
  });
  return jest.requireActual('react-native-web');
});
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});
jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const { StyleSheet } = jest.requireActual('react-native-web');
  const host = (tag: string) =>
    React.forwardRef(({ style, ...props }: { style?: unknown }, ref: unknown) =>
      React.createElement(tag, { ...props, ref, style: StyleSheet.flatten(style) }),
    );
  const Svg = host('svg');
  return {
    ...Object.fromEntries(
      [
        'Path',
        'Circle',
        'Rect',
        'G',
        'Defs',
        'LinearGradient',
        'RadialGradient',
        'Stop',
        'ClipPath',
        'Pattern',
        'Mask',
        'Line',
        'Polygon',
        'Polyline',
        'Ellipse',
        'Text',
        'TSpan',
        'Image',
        'Filter',
        'FeGaussianBlur',
      ].map((name) => [name, host(name.charAt(0).toLowerCase() + name.slice(1))]),
    ),
    __esModule: true,
    default: Svg,
    Svg,
  };
});
jest.mock('../agent-avatar/use-vector-geometry-preparation', () => ({
  useVectorGeometryPreparation: jest.fn(),
}));
jest.mock('../agent-avatar', () => {
  const actual = jest.requireActual('../agent-avatar');
  return { ...actual, AgentAvatar: () => null };
});

import { AgentCreator } from '../agent-creator/AgentCreator.web';
import type { AgentCreatorAgent } from '../agent-creator/types';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const agent: AgentCreatorAgent = {
  id: 'design',
  name: 'Designer',
  label: 'Design',
  description: 'Helpful designer',
  avatar: { preset: 'blue_beret' },
  preferences: { voice: 'local', speed: 1, language: 'en', notifications: false },
};

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const editor = (
    <AgentCreator agent={agent} onChange={() => undefined} onClose={() => undefined} />
  );
  return (
    <BloomThemeProvider mode="light" fonts={false}>
      {size ? <BloomScope size={size}>{editor}</BloomScope> : editor}
    </BloomThemeProvider>
  );
}

it('delegates header size through the web editor while keeping its explicit close size', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (size?: 'xs' | 'lg') => act(() => root.render(<Subject size={size} />));
    const geometry = () => {
      const dimension = (label: string) => {
        const node = host.querySelector<HTMLElement>(`[aria-label="${label}"]`);
        if (!node) throw new Error(`AgentCreator did not render ${label}`);
        return getComputedStyle(node).height;
      };
      return {
        undo: dimension('Undo'),
        redo: dimension('Redo'),
        close: dimension('Close agent editor'),
      };
    };
    renderSubject();
    expect(geometry()).toEqual({ undo: '34px', redo: '34px', close: '20px' });
    renderSubject('xs');
    expect(geometry()).toEqual({ undo: '24px', redo: '24px', close: '20px' });
    renderSubject('lg');
    expect(geometry()).toEqual({ undo: '34px', redo: '34px', close: '20px' });
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
