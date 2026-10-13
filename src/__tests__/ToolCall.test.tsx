import type React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ToolCall, ToolCallList } from '../tool-call';
import { formatDuration } from '../tool-call/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

let mockReduced = false;
let mockRtl = false;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReduced,
}));
jest.mock('../hooks/use-is-rtl', () => ({
  useIsRtl: () => mockRtl,
  useDirectionProps: () => ({}),
}));
jest.mock('../styles/adopt-style-sheet', () => ({
  adoptStyleSheet: jest.fn(),
  dropStyleSheet: jest.fn(),
}));

function renderCall(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const hidden = { includeHiddenElements: true } as const;

beforeEach(() => {
  mockReduced = false;
  mockRtl = false;
});

describe('ToolCall status', () => {
  it.each([
    ['running', 'Running'],
    ['done', 'Done'],
    ['error', 'Failed'],
  ] as const)('says %s in words, not only in an icon', (status, word) => {
    const { getByText } = renderCall(<ToolCall name="web_search" status={status} />);
    expect(getByText(word, hidden)).toBeTruthy();
  });

  it('titles the row with the label, falling back to the name', () => {
    const { getByText, rerender } = renderCall(
      <ToolCall name="web_search" label="Searching the web" status="done" />,
    );
    expect(getByText('Searching the web')).toBeTruthy();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ToolCall name="web_search" status="done" />
      </BloomThemeProvider>,
    );
    expect(getByText('web_search')).toBeTruthy();
  });

  it('shows the detail, and the error message in place of it when failed', () => {
    const { getByText, queryByText, rerender } = renderCall(
      <ToolCall name="t" status="done" detail="query: bloom" error="boom" />,
    );
    expect(getByText('query: bloom')).toBeTruthy();
    expect(queryByText('boom')).toBeNull();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ToolCall name="t" status="error" detail="query: bloom" error="boom" />
      </BloomThemeProvider>,
    );
    expect(getByText('boom')).toBeTruthy();
    expect(queryByText('query: bloom')).toBeNull();
  });

  it('keeps the detail on a failure that gave no message', () => {
    const { getByText } = renderCall(<ToolCall name="t" status="error" detail="query: bloom" />);
    expect(getByText('query: bloom')).toBeTruthy();
  });

  it('puts the status in a live region: polite, assertive for a failure', () => {
    const { getByTestId, rerender } = renderCall(<ToolCall name="t" status="running" testID="c" />);
    const region = () => getByTestId('c-status', hidden);
    expect(region().props['aria-live']).toBe('polite');
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ToolCall name="t" status="error" testID="c" />
      </BloomThemeProvider>,
    );
    expect(region().props['aria-live']).toBe('assertive');
  });

  it('formats a duration under and over a second', () => {
    expect(formatDuration(420)).toBe('420ms');
    expect(formatDuration(2400)).toBe('2.4s');
    const { getByText } = renderCall(<ToolCall name="t" status="done" durationMs={1840} />);
    expect(getByText('1.8s')).toBeTruthy();
  });

  it('renders the given icon instead of the default', () => {
    const Icon = jest.fn(() => null);
    renderCall(<ToolCall name="t" status="done" icon={Icon} />);
    expect(Icon).toHaveBeenCalled();
  });
});

describe('ToolCall press', () => {
  it('is not a button without onPress or a body', () => {
    const { getByTestId } = renderCall(<ToolCall testID="c" name="t" status="done" />);
    expect(getByTestId('c-row').props.role).toBeUndefined();
    expect(getByTestId('c-row').props.onPress).toBeUndefined();
  });

  it('is one button that opens the result when given onPress', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderCall(
      <ToolCall testID="c" name="web_search" label="Searching" status="done" onPress={onPress} />,
    );
    expect(getByTestId('c-row').props.role).toBe('button');
    pressHost(getByTestId('c-row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not claim to be expandable when only onPress is given', () => {
    const { getByTestId } = renderCall(
      <ToolCall testID="c" name="t" status="done" onPress={() => {}} />,
    );
    expect(getByTestId('c-row').props['aria-expanded']).toBeUndefined();
  });

  it('marks a running row busy', () => {
    const { getByTestId } = renderCall(
      <ToolCall testID="c" name="t" status="running" onPress={() => {}} />,
    );
    expect(getByTestId('c-row').props['aria-busy']).toBe(true);
  });
});

describe('ToolCall inline body', () => {
  it('toggles uncontrolled, starting closed unless defaultExpanded', () => {
    const { getByTestId } = renderCall(
      <ToolCall testID="c" name="t" status="done">
        <Text>Result</Text>
      </ToolCall>,
    );
    expect(getByTestId('c-row').props['aria-expanded']).toBe(false);
    pressHost(getByTestId('c-row'));
    expect(getByTestId('c-row').props['aria-expanded']).toBe(true);
    pressHost(getByTestId('c-row'));
    expect(getByTestId('c-row').props['aria-expanded']).toBe(false);
  });

  it('honours defaultExpanded', () => {
    const { getByTestId } = renderCall(
      <ToolCall testID="c" name="t" status="done" defaultExpanded>
        <Text>Result</Text>
      </ToolCall>,
    );
    expect(getByTestId('c-row').props['aria-expanded']).toBe(true);
  });

  it('is controlled by expanded and reports the request', () => {
    const onExpandedChange = jest.fn();
    const { getByTestId } = renderCall(
      <ToolCall
        testID="c"
        name="t"
        status="done"
        expanded={false}
        onExpandedChange={onExpandedChange}
      >
        <Text>Result</Text>
      </ToolCall>,
    );
    pressHost(getByTestId('c-row'));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(getByTestId('c-row').props['aria-expanded']).toBe(false);
  });

  it('with onPress and a body, one press does both', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderCall(
      <ToolCall testID="c" name="t" status="done" onPress={onPress}>
        <Text>Result</Text>
      </ToolCall>,
    );
    pressHost(getByTestId('c-row'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(getByTestId('c-row').props['aria-expanded']).toBe(true);
  });
});

describe('ToolCall reduced motion', () => {
  it('rests the running indicator as a still glyph', () => {
    mockReduced = true;
    const reduced = renderCall(<ToolCall name="t" status="running" testID="c" />);
    const stillGlyphs = reduced.toJSON();
    reduced.unmount();
    mockReduced = false;
    const moving = renderCall(<ToolCall name="t" status="running" testID="c" />);
    expect(JSON.stringify(stillGlyphs)).not.toEqual(JSON.stringify(moving.toJSON()));
  });
});

describe('ToolCall RTL', () => {
  it('flips the press chevron in a right-to-left layout', () => {
    const rotation = () => {
      const { getByTestId, unmount } = renderCall(
        <ToolCall name="t" status="done" onPress={() => {}} testID="c" />,
      );
      const chevron = getByTestId('c-chevron', hidden);
      const rotate = (resolvedStyle(chevron.props.style).transform as { rotate: string }[])[0]
        ?.rotate;
      unmount();
      return rotate;
    };
    expect(rotation()).toBe('0deg');
    mockRtl = true;
    expect(rotation()).toBe('180deg');
  });
});

describe('ToolCallList', () => {
  it('is a list of list items, and a lone call is neither', () => {
    const { getByTestId } = renderCall(
      <ToolCallList accessibilityLabel="Tool calls" testID="list">
        <ToolCall name="a" status="done" testID="a" />
        <ToolCall name="b" status="running" testID="b" />
      </ToolCallList>,
    );
    expect(getByTestId('list').props.role).toBe('list');
    expect(getByTestId('list').props.accessibilityLabel).toBe('Tool calls');
    expect(getByTestId('a').props.role).toBe('listitem');
    expect(getByTestId('b').props.role).toBe('listitem');

    const lone = renderCall(<ToolCall name="a" status="done" testID="lone" />);
    expect(lone.getByTestId('lone').props.role).toBeUndefined();
  });
});
