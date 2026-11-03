/**
 * `Meter` and `MeterRing` natively (React Native's own renderer): a measurement
 * is a `meter`, a level indicator, as ARIA and a Mac name it, and a task's
 * progress a `progressbar`; each says its value as Bloom formats it. React
 * Native folds the flat `aria-value*` into `accessibilityValue` and keeps `now`
 * as a WHOLE number, so without the caller's words the share of the track is
 * the value's text ("42%", "42 %"), never a fraction that reads as nothing.
 */
import { render } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { LocaleProvider } from '../locale/context';
import { Meter, MeterRing } from '../stat-bar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function mount(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function host(screen: ReturnType<typeof render>, id: string): ReactTestInstance {
  const all = screen.getAllByTestId(id);
  const found = all.find((node) => typeof node.type === 'string') ?? all[0];
  if (!found) throw new Error(`no view ${id}`);
  return found;
}

describe('Meter natively', () => {
  it('is a meter named by its label, with its range and its share as its value', () => {
    const screen = mount(<Meter value={0.42} accessibilityLabel="Battery" testID="m" />);
    const bar = host(screen, 'm');
    expect(bar.props.role).toBe('meter');
    expect(bar.props.accessibilityLabel).toBe('Battery');
    expect(bar.props['aria-valuemin']).toBe(0);
    expect(bar.props['aria-valuemax']).toBe(1);
    expect(bar.props['aria-valuenow']).toBe(0.42);
    expect(bar.props['aria-valuetext']).toBe('42%');
  });

  it("says the caller's words when it has them, and its share in the reader's locale", () => {
    const words = mount(
      <Meter value={4} max={5} accessibilityLabel="Cleanliness" valueText="4 of 5" testID="m" />,
    );
    expect(host(words, 'm').props['aria-valuetext']).toBe('4 of 5');
    const spanish = mount(
      <LocaleProvider locale="es">
        <Meter value={3} max={4} accessibilityLabel="Batería" testID="m" />
      </LocaleProvider>,
    );
    expect(host(spanish, 'm').props['aria-valuetext']).toBe('75 %');
  });

  it('is a progressbar when it measures a task', () => {
    const screen = mount(
      <Meter role="progressbar" value={1} max={4} accessibilityLabel="Uploading" testID="m" />,
    );
    expect(host(screen, 'm').props.role).toBe('progressbar');
    expect(host(screen, 'm').props['aria-valuetext']).toBe('25%');
  });
});

describe('MeterRing natively', () => {
  it('is a meter with its share, or a progressbar for a download', () => {
    const ring = mount(<MeterRing value={30} max={40} accessibilityLabel="Quality" testID="r" />);
    expect(host(ring, 'r').props.role).toBe('meter');
    expect(host(ring, 'r').props['aria-valuetext']).toBe('75%');
    const download = mount(
      <MeterRing
        value={0}
        indeterminate
        role="progressbar"
        accessibilityLabel="Installing Notes"
        testID="r"
      />,
    );
    expect(host(download, 'r').props.role).toBe('progressbar');
    expect(host(download, 'r').props['aria-valuenow']).toBeUndefined();
    expect(host(download, 'r').props['aria-valuetext']).toBeUndefined();
  });
});
