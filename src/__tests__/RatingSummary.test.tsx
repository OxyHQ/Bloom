/**
 * @jest-environment jsdom
 *
 * `RatingSummary` through the REAL react-native-web: the average is one named
 * element, every bar a progressbar named by its stars with its share, the bars
 * agree with the count, and an unrated product draws no rating at all.
 */
import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { RatingSummary } from '../rating';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(<BloomThemeProvider mode="light">{ui}</BloomThemeProvider>);
  });
}

const byTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`);

describe('RatingSummary', () => {
  it('names the average once and each bar by its stars and share', () => {
    mount(
      <RatingSummary
        testID="r"
        average={4.6}
        count={200}
        distribution={{ 5: 150, 4: 30, 3: 10, 1: 10 }}
      />,
    );
    const average = byTestId('r-average');
    expect(average?.getAttribute('aria-label')).toBe('Rated 4.6 out of 5, 200 reviews');
    expect(average?.textContent).toBe('4.6out of 5');
    const bars = container.querySelectorAll('[role="progressbar"]');
    expect(bars).toHaveLength(5);
    const five = byTestId('r-bar-5');
    expect(five?.getAttribute('aria-label')).toBe('5 stars');
    expect(five?.getAttribute('aria-valuetext')).toBe('75%');
    // An absent key is zero.
    expect(byTestId('r-bar-2')?.getAttribute('aria-valuetext')).toBe('0%');
    expect(byTestId('r-count')?.textContent).toBe('200 reviews');
  });

  it('draws a whole average with one decimal', () => {
    mount(<RatingSummary testID="r" average={5} count={1} distribution={{ 5: 1 }} />);
    expect(byTestId('r-average')?.textContent).toBe('5.0out of 5');
  });

  it('with no ratings draws the empty words and no distribution', () => {
    mount(<RatingSummary testID="r" average={null} count={0} distribution={{}} />);
    expect(byTestId('r-empty')?.textContent).toBe('No ratings yet');
    expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(0);
    expect(byTestId('r-average')).toBeNull();
  });

  it('takes the caller words', () => {
    mount(
      <RatingSummary
        testID="r"
        average={4}
        count={3}
        distribution={{ 4: 3 }}
        countLabel="3 ratings"
        outOfLabel="of 5"
        accessibilityLabel="Four stars"
      />,
    );
    expect(byTestId('r-count')?.textContent).toBe('3 ratings');
    expect(byTestId('r-average')?.getAttribute('aria-label')).toBe('Four stars');
  });
});
