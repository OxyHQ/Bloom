import React from 'react';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { FileUpload, formatFileSize } from '../file-upload';
import { resolveFileUploadPaint } from '../file-upload/FileUpload';
import type { FileUploadFile } from '../file-upload';
import type { Theme } from '../theme/types';

// The shared react-native mock has no `Easing`, `Animated.parallel` or
// `stopAnimation`; the upload's native motion uses all three.
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  class Value extends actual.Animated.Value {
    stopAnimation() {}
  }
  const run = { start: (cb?: () => void) => cb?.(), stop: () => {} };
  return {
    ...actual,
    Easing: { bezier: () => (t: number) => t, out: (f: unknown) => f, ease: (t: number) => t },
    Animated: { ...actual.Animated, Value, parallel: () => run },
  };
});

const REPORT: FileUploadFile = { name: 'quarterly-report.pdf', size: 2.4 * 1024 * 1024 };

function renderWithTheme(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** Press the drop zone's own host node and flush the async picker. */
async function pressZone(host: ReturnType<typeof render>['getByTestId'] extends (id: string) => infer R ? R : never) {
  expect(typeof host.props.onPress).toBe('function');
  await act(async () => {
    await host.props.onPress();
  });
}

describe('formatFileSize', () => {
  it('rounds to the expected precision', () => {
    expect(formatFileSize(500)).toBe('1 KB');
    expect(formatFileSize(312 * 1024)).toBe('312 KB');
    expect(formatFileSize(2.44 * 1024 * 1024)).toBe('2.4 MB');
    expect(formatFileSize(8 * 1024 * 1024)).toBe('8 MB');
    expect(formatFileSize(14.6 * 1024 * 1024)).toBe('15 MB');
  });
});

describe('FileUpload', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the idle zone as a named button with the allowed types and limit', () => {
    const { getByTestId, getByText } = renderWithTheme(<FileUpload testID="zone" />);
    const zone = getByTestId('zone');
    expect(zone.props.accessibilityRole).toBe('button');
    expect(zone.props.accessibilityLabel).toBe('Upload a file');
    expect(zone.props['aria-busy']).toBe(false);
    // JPEG is accepted but left out of the label.
    expect(getByText('PDF, JPG, PNG, XLSX (max 8 MB)')).toBeTruthy();
  });

  it('picks through onPickFiles on native and runs the simulated upload to completion', async () => {
    jest.useFakeTimers();
    const onFileSelected = jest.fn();
    const onUploadComplete = jest.fn();
    const { getByTestId, getByText, queryByText } = renderWithTheme(
      <FileUpload
        testID="zone"
        onPickFiles={() => Promise.resolve([REPORT])}
        onFileSelected={onFileSelected}
        onUploadComplete={onUploadComplete}
      />,
    );

    await pressZone(getByTestId('zone'));
    expect(onFileSelected).toHaveBeenCalledWith(REPORT);
    expect(getByTestId('zone').props['aria-busy']).toBe(true);
    expect(getByText('quarterly-report.pdf')).toBeTruthy();
    expect(getByText('Uploading 2.4 MB...')).toBeTruthy();

    // Step through the simulated ticks (at most 50 × 90ms after a 250ms start)
    // until the success state lands, then hold for 1.6s.
    for (let i = 0; i < 60; i++) {
      if (queryByText('100%')) break;
      act(() => {
        jest.advanceTimersByTime(90);
      });
    }
    expect(getByText('100%')).toBeTruthy();
    expect(onUploadComplete).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(onUploadComplete).toHaveBeenCalledWith(REPORT);
    expect(getByTestId('zone').props['aria-busy']).toBe(false);
  });

  it('rejects an unsupported extension and an oversized file, then clears the message', async () => {
    jest.useFakeTimers();
    const onFileSelected = jest.fn();
    const onReject = jest.fn();
    let next: FileUploadFile = { name: 'notes.txt', size: 10 };
    const { getByTestId, getByText, queryByText } = renderWithTheme(
      <FileUpload
        testID="zone"
        onPickFiles={() => next}
        onFileSelected={onFileSelected}
        onReject={onReject}
      />,
    );

    await pressZone(getByTestId('zone'));
    expect(getByText('Only PDF, JPG, JPEG, PNG, XLSX files are supported')).toBeTruthy();

    next = { name: 'huge.pdf', size: 9 * 1024 * 1024 };
    await pressZone(getByTestId('zone'));
    expect(getByText('That file is larger than 8 MB')).toBeTruthy();
    expect(onReject).toHaveBeenCalledTimes(2);
    expect(onFileSelected).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2600);
    });
    expect(queryByText('That file is larger than 8 MB')).toBeNull();
  });

  it('is fully controlled by file + progress', () => {
    jest.useFakeTimers();
    const onUploadComplete = jest.fn();
    const { getByTestId, getByText, rerender } = renderWithTheme(
      <FileUpload testID="zone" file={REPORT} progress={42} onUploadComplete={onUploadComplete} />,
    );
    expect(getByText('42%')).toBeTruthy();
    expect(getByTestId('zone').props['aria-busy']).toBe(true);

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <FileUpload testID="zone" file={REPORT} progress={100} onUploadComplete={onUploadComplete} />
      </BloomThemeProvider>,
    );
    expect(getByText('Uploaded successfully!')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(onUploadComplete).toHaveBeenCalledWith(REPORT);
  });

  it('does not open the picker while busy or disabled', async () => {
    const onPickFiles = jest.fn(() => REPORT);
    const { getByTestId } = renderWithTheme(
      <FileUpload testID="zone" file={REPORT} progress={10} onPickFiles={onPickFiles} />,
    );
    await pressZone(getByTestId('zone'));
    expect(onPickFiles).not.toHaveBeenCalled();

    const disabled = renderWithTheme(<FileUpload testID="off" disabled onPickFiles={onPickFiles} />);
    expect(disabled.getByTestId('off').props.disabled).toBe(true);
  });

  it('localises every visible string', () => {
    const { getByText } = renderWithTheme(
      <FileUpload
        file={REPORT}
        progress={5}
        labels={{ uploading: (size) => `Subiendo ${size}...` }}
      />,
    );
    expect(getByText('Subiendo 2.4 MB...')).toBeTruthy();
  });
});

describe('resolveFileUploadPaint', () => {
  function theme(isDark: boolean): Theme {
    let captured: Theme | null = null;
    const { useTheme } = jest.requireActual('../theme/use-theme') as typeof import('../theme/use-theme');
    function Grab() {
      captured = useTheme();
      return null;
    }
    renderWithTheme(<Grab />, isDark ? 'dark' : 'light');
    return captured as unknown as Theme;
  }

  it('follows the light and dark token map', () => {
    const light = resolveFileUploadPaint(theme(false));
    const dark = resolveFileUploadPaint(theme(true));
    expect(light.busyBackground).toBe(theme(false).colors.card);
    expect(light.fileName).toBe(theme(false).colors.text);
    // Idle and busy fills differ in both modes (the fill cross-fade has to show).
    expect(light.idleBackground).not.toBe(light.busyBackground);
    expect(dark.idleBackground).not.toBe(dark.busyBackground);
    // The ring and pill share accent-400; the pill label is white.
    expect(light.ringFill).toBe(light.pillBackground);
    expect(light.pillText).toBe('#FFFFFF');
    // Hover darkens the icon in light and lightens it in dark.
    expect(light.discIconHover).not.toBe(light.discIcon);
    expect(dark.discIconHover).not.toBe(dark.discIcon);
  });
});
