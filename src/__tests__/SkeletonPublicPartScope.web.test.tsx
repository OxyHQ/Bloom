/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import * as Skeleton from '../skeleton';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [
  [undefined, '36px'],
  ['xs', '24px'],
  ['sm', '32px'],
  ['md', '36px'],
  ['lg', '44px'],
] as const;

function mount(size: (typeof sizes)[number][0], portal = false) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const button = (
    <Button testID="loading-action">
      <Text>Open</Text>
    </Button>
  );
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <PortalProvider>
          {size ? (
            <BloomScope size={size}>
              <Skeleton.Region testID="loading">
                <Skeleton.Row>
                  <Skeleton.Col>
                    <Skeleton.Box width={60} height={18} />
                    <Skeleton.Circle size={24} />
                    <Skeleton.Pill size={20} />
                    <Skeleton.Text style={{ width: 80, lineHeight: 20 }} />
                    {portal ? <Portal>{button}</Portal> : button}
                  </Skeleton.Col>
                </Skeleton.Row>
              </Skeleton.Region>
            </BloomScope>
          ) : (
            <Skeleton.Region testID="loading">
              <Skeleton.Row>
                <Skeleton.Col>
                  <Skeleton.Box width={60} height={18} />
                  <Skeleton.Circle size={24} />
                  <Skeleton.Pill size={20} />
                  <Skeleton.Text style={{ width: 80, lineHeight: 20 }} />
                  {portal ? <Portal>{button}</Portal> : button}
                </Skeleton.Col>
              </Skeleton.Row>
            </Skeleton.Region>
          )}
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    ),
  );
  return {
    host,
    cleanup() {
      act(() => root.unmount());
      host.remove();
      document.getElementById('bloom-portal-root')?.remove();
    },
  };
}

function assertShapeGeometry(host: HTMLElement) {
  const shapes = Array.from(host.querySelectorAll<HTMLElement>('[data-bloom-skeleton-motion]'));
  const dimensions = shapes.map((shape) => ({
    width: getComputedStyle(shape).width,
    height: getComputedStyle(shape).height,
  }));
  expect(dimensions).toContainEqual({ width: '60px', height: '18px' });
  expect(dimensions).toContainEqual({ width: '24px', height: '24px' });
  expect(dimensions).toContainEqual({ width: '32.36px', height: '20px' });
  expect(dimensions).toContainEqual({ width: '', height: '14px' });
  const textShape = shapes[shapes.length - 1];
  if (!textShape?.parentElement) throw new Error('Missing Skeleton.Text layout parent');
  expect(getComputedStyle(textShape.parentElement).maxWidth).toBe('80px');
}

it.each(sizes)(
  'Skeleton shapes keep caller geometry and wrappers delegate %s scope on web',
  (size, height) => {
    const mounted = mount(size);
    try {
      assertShapeGeometry(mounted.host);
      const action = mounted.host.querySelector<HTMLElement>('[data-testid="loading-action"]');
      if (!action) throw new Error('Missing child control in Skeleton region');
      expect(getComputedStyle(action).height).toBe(height);
    } finally {
      mounted.cleanup();
    }
  },
);

it('Skeleton Region, Row and Col preserve nearest scope through a caller portal on web', () => {
  const mounted = mount('xs', true);
  try {
    assertShapeGeometry(mounted.host);
    const action = document.body.querySelector<HTMLElement>('[data-testid="loading-action"]');
    if (!action) throw new Error('Missing portal child control in Skeleton region');
    expect(getComputedStyle(action).height).toBe('24px');
  } finally {
    mounted.cleanup();
  }
});
