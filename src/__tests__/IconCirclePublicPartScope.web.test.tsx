/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import type { BloomIconComponent } from '../icons';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { IconCircle } from '../icon-circle';

const Icon: BloomIconComponent = ({ width, height }) => (
  <svg data-testid="glyph" width={width} height={height} />
);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({
  scope,
  nestedScope,
  size,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  size?: 'lg' | 'xl';
}) {
  const content = <IconCircle icon={Icon} size={size} />;
  return (
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{content}</BloomScope> : content}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps its icon-token geometry independent from Bloom scopes in DOM web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: {
    scope?: BloomSize;
    nestedScope?: BloomSize;
    size?: 'lg' | 'xl';
  }) => act(() => root.render(<Subject {...props} />));
  const dimensions = () => {
    const glyph = host.querySelector<SVGElement>('[data-testid="glyph"]');
    const disc = glyph?.parentElement;
    if (!glyph || !disc) throw new Error('IconCircle fixture did not render');
    return [
      getComputedStyle(disc).width,
      getComputedStyle(disc).height,
      glyph.getAttribute('width'),
      glyph.getAttribute('height'),
    ];
  };
  try {
    renderSubject();
    const baseline = ['64px', '64px', '28', '28'];
    expect(dimensions()).toEqual(baseline);
    renderSubject({ scope: 'xs' });
    expect(dimensions()).toEqual(baseline);
    renderSubject({ scope: 'lg' });
    expect(dimensions()).toEqual(baseline);
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(dimensions()).toEqual(baseline);
    renderSubject({ scope: 'lg', size: 'lg' });
    expect(dimensions()).toEqual(['52px', '52px', '24', '24']);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
