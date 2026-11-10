/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createRef } from 'react';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});

import { BloomScope } from '../appearance';
import { ScrollBar } from '../layout/ScrollBar.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderBar(host: HTMLElement, scope: 'xs' | 'lg', size: 'sm' | 'md') {
  const root = createRoot(host);
  const target = createRef<HTMLDivElement>();
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <BloomScope size={scope}>
          <div ref={target} />
          <ScrollBar target={target} size={size} scrollbar="always" />
        </BloomScope>
      </BloomThemeProvider>,
    ),
  );
  const track = host.querySelector<HTMLElement>('[data-bloom-scrollbar]');
  const thumb = host.querySelector<HTMLElement>('[data-bloom-scrollbar-thumb]');
  if (!track || !thumb) throw new Error('Scrollbar track or thumb did not render');
  const measured = {
    track: track.style.width,
    thumb: thumb.style.width,
  };
  act(() => root.unmount());
  return measured;
}

it('uses its own sm/md visual thickness on web, independent of BloomScope size', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  try {
    expect(renderBar(host, 'xs', 'sm')).toEqual({ track: '10px', thumb: '4px' });
    expect(renderBar(host, 'lg', 'sm')).toEqual({ track: '10px', thumb: '4px' });
    expect(renderBar(host, 'xs', 'md')).toEqual({ track: '12px', thumb: '6px' });
    expect(renderBar(host, 'lg', 'md')).toEqual({ track: '12px', thumb: '6px' });
  } finally {
    host.remove();
  }
});
