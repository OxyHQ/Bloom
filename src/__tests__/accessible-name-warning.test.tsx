import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Switch } from '../switch';
import { Slider } from '../slider';
import { DotGridMeter } from '../dot-grid-meter';
import { resetAccessibleNameWarningsForTests } from '../hooks/use-accessible-name-warning';

/**
 * THE UNNAMED-CONTROL GUARD.
 *
 * Three Bloom controls render no text of their own — a switch is a track and a
 * thumb, a slider a track and a knob, a meter a grid of dots — so the caller's
 * `accessibilityLabel` is the only route to an accessible name on either
 * platform. A caption beside the control is a sibling element and names
 * nothing.
 *
 * Nothing about that failure is visible on screen. `Switch` shipped with no
 * label prop AT ALL and the gap survived long enough for a consumer to fork the
 * component instead of reporting it; adding the prop fixes the library but not
 * the 56 call sites already written without one. A required prop was the other
 * candidate and it is weaker than it looks — `accessibilityLabel=""`
 * type-checks and names nothing, which is why the check below is on the VALUE.
 *
 * The latch is module state outliving a render tree, so `beforeEach` resets it:
 * without that the first test to warn would leave every later "did not warn"
 * assertion passing against a guard that can no longer fire.
 */
describe('missing accessible name guard', () => {
  let warn: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    resetAccessibleNameWarningsForTests();
    // `__mocks__/setup.ts` already silences console.warn; this re-spies so the
    // calls are recorded and stay scoped to one test.
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  const bloomWarnings = (component: string) =>
    warn.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].startsWith(`[Bloom] ${component}:`),
    );

  const mount = (ui: React.ReactElement) =>
    render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );

  const noop = () => {};

  it('warns when a Switch is mounted with no label', () => {
    mount(<Switch value onValueChange={noop} />);

    expect(bloomWarnings('Switch')).toHaveLength(1);
  });

  /** Mutation: drop the `missing` guard and this warns. */
  it('stays silent when a Switch is named', () => {
    mount(<Switch value onValueChange={noop} accessibilityLabel="Notifications" />);

    expect(bloomWarnings('Switch')).toHaveLength(0);
  });

  /**
   * The case a REQUIRED prop could not catch, and the reason this guard tests
   * the value rather than the presence: `accessibilityLabel=""` satisfies
   * `accessibilityLabel: string` and renders `aria-label=""`, which is not a
   * name. Whitespace is the same thing one keystroke along.
   *
   * Mutation: `name.trim() === ''` → `name === ''` and the second case passes.
   */
  it.each([
    ['empty', ''],
    ['whitespace', '   '],
  ])('warns for a label that is %s, which names nothing', (_kind, label) => {
    mount(<Switch value onValueChange={noop} accessibilityLabel={label} />);

    expect(bloomWarnings('Switch')).toHaveLength(1);
  });

  it('names the component and states the fix', () => {
    mount(<Switch value onValueChange={noop} />);

    const message = bloomWarnings('Switch')[0]?.[0];
    // The consumer's own tree is the only place this is fixable, so the message
    // has to carry the prop name and the reason a nearby caption is not enough.
    expect(message).toContain('accessibilityLabel');
    expect(message).toContain('sibling');
  });

  /**
   * Latched per component, not per instance: a settings screen renders one
   * unnamed switch per row, and a dozen identical lines is how a real message
   * gets filtered out.
   *
   * Mutation: drop the `warned` set and this reports three.
   */
  it('warns once for a screen full of unnamed switches', () => {
    mount(
      <>
        <Switch value onValueChange={noop} />
        <Switch value={false} onValueChange={noop} />
        <Switch value onValueChange={noop} />
      </>,
    );

    expect(bloomWarnings('Switch')).toHaveLength(1);
  });

  it('latches per component, so a second unnamed control still speaks', () => {
    mount(
      <>
        <Switch value onValueChange={noop} />
        <Slider value={40} min={0} max={100} onValueChange={noop} />
        <DotGridMeter filled={3} total={10} />
      </>,
    );

    expect(bloomWarnings('Switch')).toHaveLength(1);
    expect(bloomWarnings('Slider')).toHaveLength(1);
    expect(bloomWarnings('DotGridMeter')).toHaveLength(1);
  });

  it('stays silent when Slider and DotGridMeter are named', () => {
    mount(
      <>
        <Slider value={40} min={0} max={100} onValueChange={noop} accessibilityLabel="Volume" />
        <DotGridMeter filled={3} total={10} accessibilityLabel="Diversity" />
      </>,
    );

    expect(bloomWarnings('Slider')).toHaveLength(0);
    expect(bloomWarnings('DotGridMeter')).toHaveLength(0);
  });

  /**
   * Mutation: drop the `process.env.NODE_ENV` gate and this warns. Metro and
   * Vite fold the branch statically, so production ships neither the latch nor
   * the message — an unnamed control still renders and still works.
   */
  it('does not warn in production', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      mount(<Switch value onValueChange={noop} />);
    } finally {
      process.env.NODE_ENV = previous;
    }

    expect(bloomWarnings('Switch')).toHaveLength(0);
  });
});
