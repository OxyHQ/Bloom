/**
 * @jest-environment jsdom
 *
 * The pipeline through the REAL react-native-web. The three things asserted
 * here that a prop-level test cannot see: whether the amount is actually
 * allowed to break across lines, whether the column's fill is a visible step off
 * what is behind it, and whether the single-column layout emits a real tablist
 * with a real selected tab.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  DealCard,
  PipelineBoard,
  PipelineColumn,
  dealHealthLabel,
  dealHealthTone,
  pipelineColumnFill,
} from '../pipeline';
import { PIPELINE_SKELETON_CARDS } from '../pipeline/constants';
import { contrastRatio } from '../styles/color-contrast';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import type { PipelineStage } from '../pipeline';

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

const queryTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`);

function normalise(color: string): string {
  const probe = document.createElement('div');
  probe.style.color = color;
  return probe.style.color;
}

const noop = () => undefined;

const DEAL = {
  title: 'Fleet telematics rollout',
  account: 'Larkspur Freight',
  amount: '€148,000',
  closeDate: 'Closes 30 Sep',
  owner: { name: 'Marta Oyeleye' },
};

const STAGES: PipelineStage[] = [
  { id: 'qualified', name: 'Qualified', count: 2, total: '€170,400', tone: 'info' },
  { id: 'proposal', name: 'Proposal', count: 1, total: '€1,304,900' },
  { id: 'won', name: 'Closed won', count: 0, total: '€0', tone: 'success' },
];

describe('a deal card', () => {
  it('draws the app-formatted amount and never lets it wrap', () => {
    mount(<DealCard {...DEAL} testID="d" />);
    const amount = byTestId('d-amount');
    expect(amount.textContent).toBe('€148,000');
    // `numberOfLines={1}` is what stops "€148," sitting over "000" — read as the
    // emitted style, because the prop alone proves nothing about the DOM.
    const style = getComputedStyle(amount);
    expect([style.whiteSpace, style.textOverflow]).toEqual(['nowrap', 'ellipsis']);
    // And it does not shrink away when the close date is long.
    expect(style.flexShrink).toBe('0');
  });

  it('turns a stalled deal into a DURATION, and ignores the duration otherwise', () => {
    mount(<DealCard {...DEAL} health="stalled" stalledFor="23 days" testID="d" />);
    expect(byTestId('d-health').textContent).toContain('Stalled for 23 days');
    mount(<DealCard {...DEAL} health="on-track" stalledFor="23 days" testID="d" />);
    expect(byTestId('d-health').textContent).toContain('On track');
    expect(byTestId('d-health').textContent).not.toContain('23 days');
    // The same rule, pure, at the boundary the card reads it from.
    expect(dealHealthLabel({ health: 'stalled', stalledFor: '23 days' })).toBe('Stalled for 23 days');
    expect(dealHealthLabel({ health: 'stalled' })).toBe('Stalled');
    expect(dealHealthLabel({ health: 'at-risk', stalledFor: '23 days' })).toBe('At risk');
    expect(dealHealthLabel({})).toBeNull();
  });

  it('paints the health as the tone PAIR, never a colour of its own', () => {
    mount(<DealCard {...DEAL} health="at-risk" testID="d" />);
    const accent = resolveAccentColors(theme.colors, 'warning', 'subtle');
    expect(getComputedStyle(byTestId('d-health')).backgroundColor).toBe(normalise(accent.background));
    expect(dealHealthTone('at-risk')).toBe('warning');
    expect(dealHealthTone(undefined)).toBe('default');
  });

  it('names the move action, and keeps it OUT of the press target', () => {
    const onMove = jest.fn();
    mount(<DealCard {...DEAL} onPress={noop} onMove={onMove} testID="d" />);
    const move = byTestId('d-move');
    expect(move.getAttribute('aria-label')).toBe('Move Fleet telematics rollout');
    expect(byTestId('d-subject').contains(move)).toBe(false);
    expect(container.querySelectorAll('[role="button"] [role="button"]').length).toBe(0);
    act(() => {
      move.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onMove).toHaveBeenCalledTimes(1);
  });
});

describe('a column', () => {
  it('separates from the surface behind it, in both modes', () => {
    // 1.1:1 is the smallest fill step that reads as a step. A column that
    // landed on its own page would be valid markup and invisible.
    for (const mode of ['light', 'dark'] as const) {
      mount(<PipelineColumn name="Qualified" testID="col" />, mode);
      const behind = theme.colors.background;
      const fill = pipelineColumnFill(theme, behind);
      expect([mode, contrastRatio(fill, behind) >= 1.1]).toEqual([mode, true]);
      expect(getComputedStyle(byTestId('col')).backgroundColor).toBe(normalise(fill));
    }
  });

  it('says it is empty rather than drawing nothing', () => {
    mount(<PipelineColumn name="Closed won" count={0} emptyLabel="Nothing closed yet" testID="col" />);
    expect(byTestId('col-empty').textContent).toBe('Nothing closed yet');
    expect(queryTestId('col-loading')).toBeNull();
  });

  it('draws placeholders instead of the empty state while loading', () => {
    mount(<PipelineColumn name="Qualified" loading onLoadMore={noop} testID="col" />);
    expect(byTestId('col-loading').children.length).toBe(PIPELINE_SKELETON_CARDS);
    expect(queryTestId('col-empty')).toBeNull();
    // A "load more" under placeholders would ask for more of what is not there.
    expect(queryTestId('col-load-more')).toBeNull();
  });

  it('offers more when there is more, and reports the count and the total', () => {
    const onLoadMore = jest.fn();
    mount(
      <PipelineColumn name="Proposal" count={12} total="€1,304,900" onLoadMore={onLoadMore} testID="col">
        <DealCard {...DEAL} testID="d" />
      </PipelineColumn>,
    );
    expect(byTestId('col-count').textContent).toBe('12');
    expect(byTestId('col-total').textContent).toBe('€1,304,900');
    expect(queryTestId('col-empty')).toBeNull();
    act(() => {
      byTestId('col-load-more').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});

describe('the board', () => {
  const renderStage = (stage: PipelineStage) => <DealCard {...DEAL} testID={`deal-${stage.id}`} />;

  it('draws every column side by side in the board layout', () => {
    mount(
      <PipelineBoard stages={STAGES} renderStage={renderStage} layout="board" accessibilityLabel="Pipeline" testID="b" />,
    );
    for (const stage of STAGES) expect(queryTestId(`b-column-${stage.id}`)).not.toBeNull();
    expect(queryTestId('b-tabs')).toBeNull();
    expect(byTestId('b-scroller').getAttribute('aria-label')).toBe('Pipeline');
  });

  it('draws ONE column behind a real tablist in the single layout', () => {
    mount(
      <PipelineBoard
        stages={STAGES}
        renderStage={renderStage}
        layout="single"
        stageId="proposal"
        accessibilityLabel="Pipeline"
        testID="b"
      />,
    );
    expect(byTestId('b-tabs').getAttribute('role')).toBe('tablist');
    expect(byTestId('b-tabs').getAttribute('aria-label')).toBe('Pipeline');
    // The state a `tab` carries is `aria-selected`; react-native-web drops
    // `accessibilityState` entirely, so only the attribute proves it.
    expect(byTestId('b-tab-proposal').getAttribute('aria-selected')).toBe('true');
    expect(byTestId('b-tab-qualified').getAttribute('aria-selected')).toBe('false');
    expect(queryTestId('b-column-proposal')).not.toBeNull();
    expect(queryTestId('b-column-qualified')).toBeNull();
  });

  it('reports the stage a tab selects', () => {
    const onStageChange = jest.fn();
    mount(
      <PipelineBoard
        stages={STAGES}
        renderStage={renderStage}
        layout="single"
        defaultStageId="qualified"
        onStageChange={onStageChange}
        testID="b"
      />,
    );
    expect(queryTestId('b-column-qualified')).not.toBeNull();
    act(() => {
      byTestId('b-tab-won').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onStageChange).toHaveBeenCalledWith('won');
    // Uncontrolled: it moved on its own as well as reporting.
    expect(queryTestId('b-column-won')).not.toBeNull();
    expect(queryTestId('b-column-qualified')).toBeNull();
  });

  it('names a tab with its count, since the pill is the only thing a tab reads', () => {
    mount(<PipelineBoard stages={STAGES} renderStage={renderStage} layout="single" testID="b" />);
    expect(byTestId('b-tab-qualified').getAttribute('aria-label')).toBe('Qualified, 2 deals');
  });
});
