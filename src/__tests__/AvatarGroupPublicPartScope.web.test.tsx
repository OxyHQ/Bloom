/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { AvatarGroup } from '../avatar-group/AvatarGroup.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const items = [
  { id: 'ada', name: 'Ada', initials: 'A' },
  { id: 'grace', name: 'Grace', initials: 'G' },
];

it.each(['stack', 'row', 'cluster'] as const)(
  'keeps %s numeric avatar geometry independent of BloomScope on web',
  (layout) => {
    for (const scope of [undefined, 'xs', 'lg'] as const) {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = createRoot(host);
      const expected = layout === 'cluster' ? '64px' : '48px';
      try {
        act(() =>
          root.render(
            <BloomThemeProvider fonts={false}>
              {scope ? (
                <BloomScope size={scope}>
                  <AvatarGroup
                    testID="group"
                    items={items}
                    layout={layout}
                    size={layout === 'cluster' ? 64 : 48}
                    showInitials
                  />
                </BloomScope>
              ) : (
                <AvatarGroup
                  testID="group"
                  items={items}
                  layout={layout}
                  size={layout === 'cluster' ? 64 : 48}
                  showInitials
                />
              )}
            </BloomThemeProvider>,
          ),
        );
        const group = host.querySelector('[data-testid="group"]');
        if (!group) throw new Error('Missing AvatarGroup');
        const nodes = [group, ...Array.from(group.querySelectorAll('*'))];
        expect(
          nodes.some(
            (node) =>
              getComputedStyle(node).width === expected &&
              getComputedStyle(node).height === expected,
          ),
        ).toBe(true);
      } finally {
        act(() => root.unmount());
        host.remove();
      }
    }
  },
);
