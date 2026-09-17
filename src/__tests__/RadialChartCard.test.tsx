import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { resolvedStyle } from './support/rendered-style';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RadialChartCard, fitHalfOuter, type RadialDatum } from '../chart-cards/RadialChartCard';
import {
  pieSectorAngles,
  radialBarBandCentres,
  radialBarBands,
  radialLabelArc,
  sectorIndexAt,
  sectorPath,
  valueAngle,
} from '../chart-cards/polar-geometry';

// The demo data. Every `d` below is copied from recharts 3.10's SVG for
// that card at 480 wide (448 × 229 chart area).
const RINGS: RadialDatum[] = [
  { label: 'Other', value: 90 },
  { label: 'Edge', value: 173 },
  { label: 'Firefox', value: 187 },
  { label: 'Safari', value: 200 },
  { label: 'Chrome', value: 275 },
];
const STACKED: RadialDatum[] = [
  { label: 'Desktop', value: 1260 },
  { label: 'Mobile', value: 570 },
];

/** Every number in two paths agrees to 1e-3 (recharts sums its pie angles in a different order). */
function expectSamePath(actual: string | null, expected: string) {
  const nums = (d: string) => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);
  const a = nums(actual ?? '');
  const e = nums(expected);
  expect(a).toHaveLength(e.length);
  a.forEach((v, i) => expect(Math.abs(v - e[i]!)).toBeLessThan(1e-3));
  expect((actual ?? '').replace(/[-\d.e]+/g, '#').replace(/\s+/g, ' ')).toBe(expected.replace(/[-\d.e]+/g, '#').replace(/\s+/g, ' '));
}

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function layout(getByTestId: (id: string) => unknown, id: string, width = 448, height = 229) {
  act(() => {
    fireEvent(getByTestId(id) as never, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

type Node = { props: Record<string, unknown> };

describe('radial geometry matches recharts', () => {
  it('splits the radius axis into bands, 22% gap, whole-pixel bars', () => {
    const bands = radialBarBands(5, 44, 106, 0.22);
    expect(bands[0]).toEqual({ innerRadius: expect.closeTo(46.728, 6), outerRadius: expect.closeTo(53.728, 6) });
    expect(bands[4]).toEqual({ innerRadius: expect.closeTo(96.328, 6), outerRadius: expect.closeTo(103.328, 6) });
    expect(radialBarBands(5, 26, 106, 0.14)[0]).toEqual({ innerRadius: expect.closeTo(28.24, 6), outerRadius: expect.closeTo(40.24, 6) });
    expect(radialBarBands(1, 88, 104, 0.22)[0]).toEqual({ innerRadius: expect.closeTo(91.52, 6), outerRadius: expect.closeTo(100.52, 6) });
    expect(radialBarBands(1, 72, 104, 0.22)[0]).toEqual({ innerRadius: expect.closeTo(79.04, 6), outerRadius: expect.closeTo(97.04, 6) });
    expect(radialBarBandCentres(5, 44, 106)).toEqual([50.2, 62.6, 75, 87.4, 99.8].map((v) => expect.closeTo(v, 6)));
  });

  it('draws the track and the rounded bars', () => {
    const [other, , , , chrome] = radialBarBands(5, 44, 106, 0.22);
    expectSamePath(
      sectorPath({ cx: 224, cy: 114.5, ...other!, startAngle: 90, endAngle: -270 }),
      'M 224,60.772 A 53.728,53.728,0, 1,1, 223.9991,60.772 L 223.9992,67.772 A 46.728,46.728,0, 1,0, 224,67.772 Z',
    );
    expectSamePath(
      sectorPath({ cx: 224, cy: 114.5, ...other!, startAngle: 90, endAngle: valueAngle(90, 303), cornerRadius: 99 }),
      'M 224,64.3941 A3.5,3.5,0,0,1,227.7439,60.9026 A53.728,53.728,0,0,1,276.3646,126.5267 A3.5,3.5,0,0,1,271.9342,129.0916 L271.9342,129.0916 A3.5,3.5,0,0,1,269.5423,124.9598 A46.728,46.728,0,0,0,227.2561,67.8856 A3.5,3.5,0,0,1,224,64.3941Z',
    );
    expectSamePath(
      sectorPath({ cx: 224, cy: 114.5, ...chrome!, startAngle: 90, endAngle: valueAngle(275, 303), cornerRadius: 99 }),
      'M 224,14.7334 A3.5,3.5,0,0,1,227.6227,11.2355 A103.328,103.328,0,1,1,164.3257,30.1457 A3.5,3.5,0,0,1,169.2734,31.0831 L169.2734,31.0831 A3.5,3.5,0,0,1,168.3683,35.8603 A96.328,96.328,0,1,0,227.3773,18.2312 A3.5,3.5,0,0,1,224,14.7334Z',
    );
  });

  it('sets a label along its arc, 10° in, clockwise', () => {
    const band = radialBarBands(5, 26, 106, 0.14)[0]!;
    const d = radialLabelArc(224, 114.5, band, 90, valueAngle(90, 303), 10);
    expectSamePath(d, 'M229.9457136033157,80.78018253686199 A34.24,34.24,0,1,1, 229.3563160829775,80.68155121802249');
  });

  it('lays out the half gauge: 3° gaps, round ends, over a round track', () => {
    const [desktop, mobile] = pieSectorAngles([1260, 570], 180, 0, 3);
    const ring = { cx: 224, cy: 147.42, innerRadius: 96, outerRadius: 128, cornerRadius: 99 };
    expectSamePath(
      sectorPath({ ...ring, startAngle: 180, endAngle: 0 }),
      'M 113.1487,147.42 A16,16,0,0,1,97.3129,129.1343 A128,128,0,0,1,350.6871,129.1343 A16,16,0,0,1,334.8513,147.42 L334.8513,147.42 A16,16,0,0,1,319.0154,133.7057 A96,96,0,0,0,128.9846,133.7057 A16,16,0,0,1,113.1487,147.42Z',
    );
    expectSamePath(
      sectorPath({ ...ring, ...desktop! }),
      'M 113.1487,147.42 A16,16,0,0,1,97.3129,129.1343 A128,128,0,0,1,275.3587,30.1754 A16,16,0,0,1,282.527,53.2786 L282.527,53.2786 A16,16,0,0,1,262.519,59.4866 A96,96,0,0,0,128.9846,133.7057 A16,16,0,0,1,113.1487,147.42Z',
    );
    expectSamePath(
      sectorPath({ ...ring, ...mobile! }),
      'M 287.3737,56.4707 A16,16,0,0,1,311.4299,53.9319 A128,128,0,0,1,350.6871,129.1343 A16,16,0,0,1,334.8513,147.42 L334.8513,147.42 A16,16,0,0,1,319.0154,133.7057 A96,96,0,0,0,289.5724,77.3039 A16,16,0,0,1,287.3737,56.4707Z',
    );
    expect(sectorIndexAt(324, 97, 224, 147.42, [desktop!, mobile!].map((a) => ({ ...a, innerRadius: 96, outerRadius: 128 })))).toBe(1);
  });

  it('shrinks the half gauge only when its apex would clip', () => {
    expect(fitHalfOuter(189)).toBe(128);
    expect(fitHalfOuter(150)).toBe(111);
    expect(fitHalfOuter(40)).toBe(48);
  });
});

describe('RadialChartCard', () => {
  it('headlines the total, draws a track and a rounded arc per ring, and names the chart', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderCard(
      <RadialChartCard testID="radial" data={RINGS} delta={0.052} />,
    );
    expect(getByTestId('radial-headline').props.children).toBe('925');
    layout(getByTestId, 'radial-plot');
    const paths = UNSAFE_getAllByType('Path' as never) as unknown as Node[];
    expect(paths).toHaveLength(10);
    expectSamePath(
      getByTestId('radial-arc-3').props.d as string,
      'M 224,27.1421 A3.5,3.5,0,0,1,227.6401,23.6449 A90.928,90.928,0,1,1,149.2175,166.225 A3.5,3.5,0,0,1,150.2219,161.2781 L150.2219,161.2781 A3.5,3.5,0,0,1,154.9746,162.243 A83.928,83.928,0,1,0,227.3599,30.6393 A3.5,3.5,0,0,1,224,27.1421Z',
    );
    expect(getByTestId('radial-plot-surface').props.accessibilityLabel).toBe(
      'Visitors radial chart: Other 90, Edge 173, Firefox 187, Safari 200, Chrome 275',
    );
  });

  it("hovers a ring anywhere on its track, darkening it and dropping the rest to 25%", () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <RadialChartCard testID="radial" data={RINGS} onActiveIndexChange={onActiveIndexChange} />,
    );
    layout(getByTestId, 'radial-plot');
    const surface = getByTestId('radial-plot-surface');
    // 9 o'clock on Safari's band: past the end of its arc, still on its track.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 137, offsetY: 114.5 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(3);
    expect(getByText('Safari')).toBeTruthy();
    expect(getByTestId('radial-headline').props.children).toBe('200');
    expect(getByTestId('radial-arc-3').props.opacity).toBe(1);
    expect(getByTestId('radial-arc-0').props.opacity).toBe(0.25);
    expect(getByTestId('radial-arc-3').props.fill).not.toBe(getByTestId('radial-arc-0').props.fill);
    // Between two bands: nothing.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 224 - 93.6, offsetY: 114.5 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
  });

  it('draws the grid variant without tracks, over circles and 45° spokes', () => {
    const { getByTestId, UNSAFE_getAllByType } = renderCard(<RadialChartCard testID="radial" variant="grid" data={RINGS} />);
    layout(getByTestId, 'radial-plot');
    expect(UNSAFE_getAllByType('Path' as never)).toHaveLength(5);
    expect((UNSAFE_getAllByType('Circle' as never) as unknown as Node[]).map((c) => c.props.r)).toEqual(
      [50.2, 62.6, 75, 87.4, 99.8].map((v) => expect.closeTo(v, 6)),
    );
    const spokes = UNSAFE_getAllByType('Line' as never) as unknown as Node[];
    expect(spokes).toHaveLength(8);
    expect([spokes[0]!.props.x1, spokes[0]!.props.x2]).toEqual([268, 330]);
  });

  it('reads a gauge as a share of its goal, on an inner disc for `solid`', () => {
    const { getByTestId, getByText, UNSAFE_getAllByType } = renderCard(
      <RadialChartCard testID="radial" variant="solid" data={[{ label: 'Visitors', value: 1260 }]} max={2000} />,
    );
    layout(getByTestId, 'radial-plot');
    expect(getByText('63%')).toBeTruthy();
    expect(getByText('of goal')).toBeTruthy();
    const disc = (UNSAFE_getAllByType('Circle' as never) as unknown as Node[])[0]!;
    expect(disc.props.r).toBe(64);
    expectSamePath(
      getByTestId('radial-arc-0').props.d as string,
      'M 224,26.9212 A9,9,0,0,1,233.92,17.9684 A97.04,97.04,0,1,1,160.4222,187.8118 A9,9,0,0,1,160.1578,174.4518 L160.1578,174.4518 A9,9,0,0,1,172.2153,174.2132 A79.04,79.04,0,1,0,232.08,35.8741 A9,9,0,0,1,224,26.9212Z',
    );
  });

  it('follows the hovered segment on the half gauge and ignores the unclaimed remainder', () => {
    const onActiveIndexChange = jest.fn();
    const { getByTestId, getByText } = renderCard(
      <RadialChartCard testID="radial" variant="stacked" data={STACKED} max={2400} onActiveIndexChange={onActiveIndexChange} />,
    );
    layout(getByTestId, 'radial-plot', 448, 189);
    expect(getByText('53%')).toBeTruthy();
    const surface = getByTestId('radial-plot-surface');
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 250, offsetY: 30 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(1);
    expect(getByText('24%')).toBeTruthy();
    expect(getByTestId('radial-arc-0').props.opacity).toBe(0.3);
    // The remainder (right end of the arc) focuses nothing.
    act(() => {
      fireEvent(surface, 'pointerMove', { nativeEvent: { offsetX: 336, offsetY: 140 } });
    });
    expect(onActiveIndexChange).toHaveBeenLastCalledWith(null);
    expect(getByTestId('radial-legend')).toBeTruthy();
  });

  it('puts tiles under the chart and lets the card grow', () => {
    const { getByTestId, queryByTestId } = renderCard(<RadialChartCard testID="radial" data={RINGS} tiles activeIndex={2} />);
    expect(resolvedStyle(getByTestId('radial').props.style).height).toBeUndefined();
    expect(queryByTestId('radial-legend')).toBeNull();
    expect(resolvedStyle(getByTestId('radial-tiles-tile-0').props.style).opacity).toBe(0.4);
  });
});
