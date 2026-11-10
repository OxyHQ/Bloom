/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { useAvatarFlights } from '../avatar-flight';
import { BloomScope } from '../appearance';
import {
  previewAvatarGeometry,
  SelectedAgentPreview,
} from '../multi-agent-chat/SelectedAgentPreview';
import type { Agent } from '../multi-agent-chat/data';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const AGENTS: Agent[] = Array.from({ length: 4 }, (_, index) => ({
  id: `agent-${index}`,
  name: `Agent ${index}`,
  label: 'Research',
  description: '',
  avatar: { preset: 'blue_beret' },
}));

function Subject({ count, size, nested }: { count: number; size?: 'xs' | 'lg'; nested: boolean }) {
  const flights = useAvatarFlights();
  const preview = (
    <SelectedAgentPreview agents={AGENTS.slice(0, count)} flights={flights} anchor="scope" />
  );
  return (
    <BloomThemeProvider fonts={false}>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{preview}</BloomScope>
        </BloomScope>
      ) : size ? (
        <BloomScope size={size}>{preview}</BloomScope>
      ) : (
        preview
      )}
    </BloomThemeProvider>
  );
}

it('keeps the rendered preview artwork and footprint count-based under nested BloomScope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    for (const count of [1, 2, 3, 4]) {
      const tree = (size?: 'xs' | 'lg', nested = false) => (
        <Subject count={count} size={size} nested={nested} />
      );
      act(() => root.render(tree()));
      const measure = () => {
        const image = host.querySelector<HTMLElement>('[role="img"]');
        if (!image) throw new Error('Selected agent preview did not render');
        return {
          footprint: [getComputedStyle(image).width, getComputedStyle(image).height],
          avatars: Array.from(image.children).map((node) =>
            Number.parseFloat(getComputedStyle(node as HTMLElement).width),
          ),
        };
      };
      const defaultScope = measure();
      expect(defaultScope.footprint).toEqual(['160px', '112px']);
      expect(defaultScope.avatars).toHaveLength(count);
      expect(defaultScope.avatars).toEqual(
        AGENTS.slice(0, count)
          .map((_, index) => previewAvatarGeometry(count, index).size)
          .sort(),
      );
      act(() => root.render(tree('xs')));
      expect(measure()).toEqual(defaultScope);
      act(() => root.render(tree(undefined, true)));
      expect(measure()).toEqual(defaultScope);
    }
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
