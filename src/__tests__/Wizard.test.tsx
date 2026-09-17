/**
 * @jest-environment jsdom
 *
 * WizardProgress and WizardFooter through the REAL react-native-web: the bar's
 * segment fills, the progressbar attributes, the heading, and the footer's
 * actions and states.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { WizardFooter, WizardProgress } from '../wizard';
import { wizardSegmentFills } from '../wizard/WizardProgress';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let theme: Theme;

function ReadTheme() {
  theme = useTheme();
  return null;
}

function mount(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  act(() => {
    root.render(
      <BloomThemeProvider mode={mode} colorPreset="teal">
        <ReadTheme />
        {ui}
      </BloomThemeProvider>,
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = color;
  return probe.style.backgroundColor;
}

const STEPS = [
  { title: 'Property type' },
  { title: 'Address' },
  { title: 'Photos', description: 'Add at least five.' },
  { title: 'Publish' },
];

describe('wizardSegmentFills', () => {
  it('fills done steps, part-fills the current one and leaves the rest empty', () => {
    expect(wizardSegmentFills(4, 2, 0.5)).toEqual([1, 1, 0.5, 0]);
    expect(wizardSegmentFills(4, 0, 0)).toEqual([0, 0, 0, 0]);
  });

  it('clamps the index and the progress', () => {
    expect(wizardSegmentFills(3, 9, 2)).toEqual([1, 1, 1]);
    expect(wizardSegmentFills(3, -1, -1)).toEqual([0, 0, 0]);
  });
});

describe('WizardProgress', () => {
  it('draws one segment per step with the fills as widths', () => {
    mount(<WizardProgress steps={STEPS} current={2} currentProgress={0.25} testID="wp" />);
    expect(byTestId('wp-segment-0-fill').style.width).toBe('100%');
    expect(byTestId('wp-segment-1-fill').style.width).toBe('100%');
    expect(byTestId('wp-segment-2-fill').style.width).toBe('25%');
    expect(byTestId('wp-segment-3-fill').style.width).toBe('0%');
    expect(byTestId('wp-segment-0').style.height).toBe('4px');
    expect(normalise(byTestId('wp-segment-0-fill').style.backgroundColor)).toBe(normalise(theme.colors.text));
  });

  it('is a named progressbar over the whole flow', () => {
    mount(<WizardProgress steps={STEPS} current={2} testID="wp" />);
    const bar = byTestId('wp-bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
    expect(bar.getAttribute('aria-valuenow')).toBe('2.5');
    expect(bar.getAttribute('aria-label')).toBe('Step 3 of 4, Photos');
  });

  it('shows the count, the title as a heading and the description', () => {
    mount(<WizardProgress steps={STEPS} current={2} headingLevel={2} testID="wp" />);
    expect(container.textContent).toContain('Step 3 of 4');
    const heading = container.querySelector('[role="heading"]');
    expect(heading?.textContent).toBe('Photos');
    expect(heading?.getAttribute('aria-level')).toBe('2');
    expect(container.textContent).toContain('Add at least five.');
  });

  it('hides the title on request and formats the count', () => {
    mount(
      <WizardProgress
        steps={STEPS}
        current={0}
        hideTitle
        formatStepCount={(n, total) => `${n}/${total}`}
        testID="wp"
      />,
    );
    expect(container.querySelector('[role="heading"]')).toBeNull();
    expect(container.textContent).toContain('1/4');
  });
});

describe('WizardFooter', () => {
  it('calls Back and Next, and hides Back without onBack', () => {
    const onBack = jest.fn();
    const onNext = jest.fn();
    mount(<WizardFooter onBack={onBack} onNext={onNext} testID="wf" />);
    act(() => byTestId('wf-back').click());
    act(() => byTestId('wf-next').click());
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);

    mount(<WizardFooter onNext={onNext} testID="wf" />);
    expect(container.querySelector('[data-testid="wf-back"]')).toBeNull();
  });

  it('labels the primary action and blocks it while disabled', () => {
    const onNext = jest.fn();
    mount(<WizardFooter onBack={() => undefined} onNext={onNext} nextLabel="Publish" nextDisabled testID="wf" />);
    const next = byTestId('wf-next');
    expect(next.textContent).toContain('Publish');
    act(() => next.click());
    expect(onNext).not.toHaveBeenCalled();
  });

  it('draws the hairline and is sticky on web by default', () => {
    mount(<WizardFooter onNext={() => undefined} testID="wf" />, 'dark');
    const bar = byTestId('wf');
    expect(bar.style.position).toBe('sticky');
    expect(bar.style.borderTopWidth).toBe('1px');
    expect(normalise(bar.style.backgroundColor)).toBe(normalise(theme.colors.background));

    mount(<WizardFooter onNext={() => undefined} sticky={false} testID="wf" />);
    expect(byTestId('wf').style.position).not.toBe('sticky');
  });
});
