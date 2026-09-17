import React from 'react';
import { render, within } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AgentLimitsCard } from '../agent-limits-card';
import type { AgentLimitsContext, AgentLimitsUsageLimit } from '../agent-limits-card';
import { ACCENT_TABLE, colorRamp, resolveButtonRamps } from '../button/shared';
import { buildTheme } from '../theme/build-theme';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

const CONTEXT: AgentLimitsContext = {
  max: 1_000_000,
  segments: [
    { label: 'Messages', tokens: 520_000 },
    { label: 'System tools', tokens: 96_000 },
    { label: 'Custom', tokens: 204_000, color: 'rgb(1 2 3)' },
    { label: 'MCP tools (deferred)', tokens: 69_900, deferred: true },
  ],
  groups: [
    {
      label: 'MCP tools',
      tokens: 137_900,
      items: [
        { label: 'browser', tokens: 54_200 },
        { label: 'figma', tokens: 41_800 },
      ],
    },
  ],
};

const LIMITS: AgentLimitsUsageLimit[] = [
  { label: '5-hour limit', used: 0.38, resets: 'Resets in 2 hr 46 min' },
  { label: 'Overdrawn', used: 1.4, resets: 'Resets Tue 3:00 PM' },
];

function renderCard(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('AgentLimitsCard', () => {
  it('keeps the card geometry: radius 16, padding 10/16/16 in longhands', () => {
    const { getByTestId } = renderCard(<AgentLimitsCard testID="card" context={CONTEXT} />);
    const card = resolvedStyle(getByTestId('card').props.style);
    expect(card).toMatchObject({
      borderRadius: 16,
      paddingTop: 10,
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 16,
    });
    expect(card.paddingHorizontal).toBeUndefined();
    expect(resolvedStyle(getByTestId('card-context-bar').props.style).height).toBe(6);
  });

  it('reads out used / max, counting only non-deferred buckets', () => {
    const { getByText, getByTestId } = renderCard(<AgentLimitsCard testID="card" context={CONTEXT} />);
    expect(getByText('(82%)')).toBeTruthy();
    const bar = getByTestId('card-context-bar');
    expect(bar.props.accessibilityRole).toBe('progressbar');
    expect(bar.props['aria-valuemin']).toBe(0);
    expect(bar.props['aria-valuemax']).toBe(1_000_000);
    expect(bar.props['aria-valuenow']).toBe(820_000);
    expect(bar.props.accessibilityLabel).toBe('Context window');
    // Three counted segments drawn; the deferred bucket is not.
    expect(bar.children).toHaveLength(3);
  });

  it('expands the breakdown on press: shares, a dash for deferred, and free space', () => {
    const onExpandedChange = jest.fn();
    const { getByTestId, queryByTestId, getByText } = renderCard(
      <AgentLimitsCard testID="card" context={CONTEXT} onExpandedChange={onExpandedChange} />,
    );
    const toggle = getByTestId('card-context-toggle');
    expect(toggle.props['aria-expanded']).toBe(false);
    expect(queryByTestId('card-breakdown')).toBeNull();

    pressHost(toggle);

    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(getByTestId('card-context-toggle').props['aria-expanded']).toBe(true);
    const breakdown = within(getByTestId('card-breakdown'));
    expect(breakdown.getByText('52.0%')).toBeTruthy();
    expect(breakdown.getByText('—')).toBeTruthy();
    expect(breakdown.getByText('69.9k')).toBeTruthy();
    expect(breakdown.getByText('Free space')).toBeTruthy();
    expect(breakdown.getByText('180k')).toBeTruthy();
    expect(breakdown.getByText('18.0%')).toBeTruthy();
  });

  it('stays put when controlled, reporting the requested state', () => {
    const onExpandedChange = jest.fn();
    const { getByTestId } = renderCard(
      <AgentLimitsCard
        testID="card"
        context={CONTEXT}
        expanded={false}
        onExpandedChange={onExpandedChange}
      />,
    );
    pressHost(getByTestId('card-context-toggle'));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(getByTestId('card-context-toggle').props['aria-expanded']).toBe(false);
  });

  it('opens a group to list its members', () => {
    const { getByLabelText, queryByText, getByText } = renderCard(
      <AgentLimitsCard context={CONTEXT} defaultExpanded />,
    );
    const group = getByLabelText('MCP tools, 137.9k, 2');
    expect(group.props['aria-expanded']).toBe(false);
    expect(queryByText('browser')).toBeNull();
    pressHost(group);
    expect(getByLabelText('MCP tools, 137.9k, 2').props['aria-expanded']).toBe(true);
    expect(getByText('browser')).toBeTruthy();
    expect(getByText('54.2k')).toBeTruthy();
  });

  it('paints segments from the chart palette, first tone the accent 400, custom colours win', () => {
    const { getByTestId } = renderCard(<AgentLimitsCard testID="card" context={CONTEXT} />);
    const theme = buildTheme('teal', 'light');
    const bar = getByTestId('card-context-bar');
    const fills = bar.findAll(
      (node) => node !== bar && typeof node.type === 'string' && node.props.style !== undefined,
      { deep: false },
    );
    const [first, second, custom] = fills;
    const bg = (node: { props: { style?: unknown } } | undefined) =>
      resolvedStyle(node?.props.style).backgroundColor;
    expect(bg(first)).toBe(colorRamp(theme.colors.primary, ACCENT_TABLE)[400]);
    expect(bg(second)).not.toBe(bg(first));
    expect(bg(custom)).toBe('rgb(1 2 3)');
  });

  it('shows each plan limit as a clamped, named progressbar', () => {
    const { getByText, getByLabelText, UNSAFE_root } = renderCard(
      <AgentLimitsCard plan="Max (5x)" limits={LIMITS} />,
    );
    expect(getByText('Plan usage limits · Max (5x)')).toBeTruthy();
    expect(getByText('38%')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
    expect(getByText('Resets in 2 hr 46 min')).toBeTruthy();
    const bars = UNSAFE_root.findAll(
      (node) => typeof node.type === 'string' && node.props.accessibilityRole === 'progressbar',
    );
    expect(bars.map((b) => [b.props.accessibilityLabel, b.props['aria-valuenow']])).toEqual([
      ['5-hour limit', 38],
      ['Overdrawn', 100],
    ]);
    expect(getByLabelText('5-hour limit')).toBeTruthy();
  });

  it('renders the plan arrow only with a handler, as a named Bloom button', () => {
    const onPlanPress = jest.fn();
    const { getByTestId, rerender, queryByTestId } = renderCard(
      <AgentLimitsCard testID="card" limits={LIMITS} onPlanPress={onPlanPress} />,
    );
    const button = getByTestId('card-plan-button');
    expect(button.props.accessibilityLabel).toBe('Manage plan');
    pressHost(button);
    expect(onPlanPress).toHaveBeenCalledTimes(1);

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentLimitsCard testID="card" limits={LIMITS} />
      </BloomThemeProvider>,
    );
    expect(queryByTestId('card-plan-button')).toBeNull();
  });

  it('renders either section alone, with no separator', () => {
    const contextOnly = renderCard(<AgentLimitsCard testID="card" context={CONTEXT} />);
    expect(contextOnly.queryByText(/Plan usage limits/)).toBeNull();
    contextOnly.unmount();

    const limitsOnly = renderCard(<AgentLimitsCard testID="card" limits={LIMITS} />);
    expect(limitsOnly.queryByTestId('card-context-toggle')).toBeNull();
    expect(limitsOnly.getByText('Plan usage limits')).toBeTruthy();
  });

  it('localises its fixed strings and token format', () => {
    const { getByText, getByTestId } = renderCard(
      <AgentLimitsCard
        testID="card"
        context={CONTEXT}
        limits={LIMITS}
        defaultExpanded
        formatTokens={(n) => `${n} t`}
        labels={{ contextWindow: 'Ventana', freeSpace: 'Libre', planUsageLimits: 'Límites' }}
      />,
    );
    expect(getByText('Ventana')).toBeTruthy();
    expect(getByText('Libre')).toBeTruthy();
    expect(getByText('Límites')).toBeTruthy();
    expect(getByText('180000 t')).toBeTruthy();
    expect(getByTestId('card-context-toggle').props.accessibilityLabel).toBe(
      'Ventana, 820000 t / 1000000 t (82%)',
    );
  });

  it('formats tokens in compact notation by default', () => {
    const { getByText } = renderCard(
      <AgentLimitsCard
        context={{ max: 1_000_000, segments: [{ label: 'a', tokens: 482_800 }, { label: 'b', tokens: 314 }] }}
      />,
    );
    expect(getByText(/483\.1k \/ 1M/)).toBeTruthy();
  });

  it('maps the surface onto the neutral ramp per mode', () => {
    const light = renderCard(<AgentLimitsCard testID="card" limits={LIMITS} />, 'light');
    const lightTheme = buildTheme('teal', 'light');
    expect(resolvedStyle(light.getByTestId('card').props.style).backgroundColor).toBe(
      resolveButtonRamps(lightTheme).neutral[100],
    );
    light.unmount();

    const dark = renderCard(<AgentLimitsCard testID="card" limits={LIMITS} />, 'dark');
    const darkTheme = buildTheme('teal', 'dark');
    expect(resolvedStyle(dark.getByTestId('card').props.style).backgroundColor).toBe(
      resolveButtonRamps(darkTheme).neutral[900],
    );
  });
});
