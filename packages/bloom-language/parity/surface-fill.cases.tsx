import * as RN from 'react-native';
import { RiHeart3Line as Heart } from '@oxy.so/bloom/icons';
import { SurfaceLevelProvider, useSurfaceFill } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';
import type { ReactElement, ReactNode } from 'react';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

/** Bloom JSX that reads the surface fill as an app does (`useSurfaceFill()`). */
function Surfaced({ children }: { children: (fill: string) => ReactElement }): ReactElement {
  return children(useSurfaceFill());
}

/** The surfaces a view may sit on: the page, a level with no fill of its own, a container's exact fill. */
const SURFACES: readonly [string, (children: ReactElement) => ReactElement][] = [
  ['on the page', (children) => children],
  [
    'on a raised level',
    (children) => <SurfaceLevelProvider level={1}>{children}</SurfaceLevelProvider>,
  ],
  [
    'on a container’s own fill',
    (children) => (
      <SurfaceLevelProvider level={2} fill="#123456">
        {children}
      </SurfaceLevelProvider>
    ),
  ],
];

/** The `surfaceFill` role: the fill of the surface a view sits on (Bloom's `useSurfaceFill()`). */
export const SURFACE_FILL_CASES: readonly ParityCase[] = SURFACES.flatMap(([where, on]) => [
  {
    name: `a box filled and edged with the surface ${where}`,
    language: () =>
      on(
        toElement(
          L.VStack()
            .frame({ width: '48', height: '48' })
            .background('surfaceFill')
            .border('surfaceFill', 'thick'),
        ),
      ),
    bloom: () =>
      on(
        <Surfaced>
          {(fill) => (
            <RN.View
              style={{
                width: 48,
                height: 48,
                backgroundColor: fill,
                borderWidth: 2,
                borderColor: fill,
              }}
            />
          )}
        </Surfaced>,
      ),
  },
  {
    name: `a text and an icon in the surface’s colour ${where}`,
    language: () =>
      on(
        toElement(
          L.VStack(
            L.Text('Ink').foreground('surfaceFill'),
            L.Icon(Heart).foreground('surfaceFill'),
          ),
        ),
      ),
    bloom: () =>
      on(
        <Surfaced>
          {(fill) => (
            <RN.View>
              <Text style={{ color: fill }}>Ink</Text>
              <Heart size="md" fill={fill} />
            </RN.View>
          )}
        </Surfaced>,
      ),
  },
]);
