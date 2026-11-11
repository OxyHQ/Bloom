/** @jest-environment jsdom */
/* biome-ignore-all lint/correctness/noReactNativeRawText: Chip renders its text children through Bloom Text. */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Badge } from '../badge';
import type { BadgeSize } from '../badge';
import { Chip } from '../chip';
import type { ChipSize } from '../chip';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({
  scope,
  nestedScope,
  badgeSize,
  chipSize,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  badgeSize?: BadgeSize;
  chipSize?: ChipSize;
}) {
  const content = (
    <>
      <Badge content="3" size={badgeSize} testID="badge" />
      <Chip size={chipSize} testID="chip">
        Filter
      </Chip>
    </>
  );
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{content}</BloomScope> : content}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('resolves Badge and Chip Bloom size aliases from the nearest scope in DOM web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: {
    scope?: BloomSize;
    nestedScope?: BloomSize;
    badgeSize?: BadgeSize;
    chipSize?: ChipSize;
  }) => act(() => root.render(<Subject {...props} />));
  const heights = () => {
    const read = (id: string) => {
      const element = host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      if (!element) throw new Error(`Badge/Chip fixture did not render ${id}`);
      return getComputedStyle(element).height;
    };
    return [read('badge'), read('chip')];
  };
  try {
    renderSubject();
    expect(heights()).toEqual(['18px', '24px']);
    renderSubject({ scope: 'xs' });
    expect(heights()).toEqual(['14px', '20px']);
    renderSubject({ scope: 'lg' });
    expect(heights()).toEqual(['24px', '28px']);
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(heights()).toEqual(['24px', '28px']);
    renderSubject({ scope: 'xs', badgeSize: 'md', chipSize: 'md' });
    expect(heights()).toEqual(['18px', '24px']);
    renderSubject({ scope: 'lg', badgeSize: 'label-medium', chipSize: '2xl' });
    expect(heights()).toEqual(['24px', '44px']);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
