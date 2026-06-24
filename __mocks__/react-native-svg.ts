import React from 'react';

/**
 * Jest mock for `react-native-svg`.
 *
 * The real package pulls in `Touchable.Mixin` from `react-native`, which the
 * lightweight RN mock (`__mocks__/react-native.ts`) doesn't provide — so the
 * real module throws on import under `testEnvironment: 'node'`. Bloom icons
 * (`src/icons/*`) are built on these primitives via `createSinglePathSVG`,
 * so any component that renders an icon (e.g. `SearchInput`'s clear button)
 * needs them stubbed.
 *
 * Each export is a thin host-component stand-in that forwards children and
 * `testID`, mirroring the style of the RN component mock. That's enough for
 * render assertions; pixel output is validated visually / in Storybook, not
 * in jest.
 */
const createSvgComponent = (name: string) => {
  const Component = React.forwardRef(
    (props: Record<string, unknown>, ref: unknown) => {
      const { children, ...rest } = props;
      return React.createElement(name, { ref, ...rest }, children as React.ReactNode);
    },
  );
  Component.displayName = name;
  return Component;
};

export const Svg = createSvgComponent('Svg');
export const Path = createSvgComponent('Path');
export const Circle = createSvgComponent('Circle');
export const Rect = createSvgComponent('Rect');
export const G = createSvgComponent('G');
export const Defs = createSvgComponent('Defs');
export const LinearGradient = createSvgComponent('LinearGradient');
export const RadialGradient = createSvgComponent('RadialGradient');
export const Stop = createSvgComponent('Stop');
export const ClipPath = createSvgComponent('ClipPath');
export const Mask = createSvgComponent('Mask');
export const Line = createSvgComponent('Line');
export const Polygon = createSvgComponent('Polygon');
export const Polyline = createSvgComponent('Polyline');
export const Ellipse = createSvgComponent('Ellipse');
export const Text = createSvgComponent('SvgText');
export const TSpan = createSvgComponent('TSpan');

export default Svg;
