/**
 * @jest-environment jsdom
 */

// Real react-native-web, so the assertions read the ATTRIBUTES a browser sees
// (`aria-expanded`, `dir`), not props handed back by a stub.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Text } from 'react-native';

import { AgentThinking } from '../agent-thinking';
import { pickMessages } from '../locale/messages';
import { AGENT_THINKING_MESSAGES } from '../agent-thinking/messages';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
}

const header = () => container.querySelector<HTMLElement>('[data-testid="r-header"]')!;
const body = () => container.querySelector<HTMLElement>('[data-testid="r-body"]')!;
const expanded = () => header().getAttribute('aria-expanded');
const press = () => act(() => header().click());

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.removeAttribute('dir');
});

describe('AgentThinking disclosure open state', () => {
  it('starts closed and names its header with aria-expanded', () => {
    mount(
      <AgentThinking thinking={false} testID="r" durationMs={4000}>
        why
      </AgentThinking>,
    );
    expect(header().getAttribute('role')).toBe('button');
    expect(expanded()).toBe('false');
    expect(header().textContent).toContain('Thought for 4 s');
  });

  it('honours defaultOpen and toggles on press', () => {
    const onOpenChange = jest.fn();
    mount(
      <AgentThinking thinking={false} testID="r" defaultOpen onOpenChange={onOpenChange}>
        why
      </AgentThinking>,
    );
    expect(expanded()).toBe('true');
    press();
    expect(expanded()).toBe('false');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    press();
    expect(expanded()).toBe('true');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('is controlled by open and only reports the press', () => {
    const onOpenChange = jest.fn();
    mount(
      <AgentThinking thinking={false} testID="r" open={false} onOpenChange={onOpenChange}>
        why
      </AgentThinking>,
    );
    press();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(expanded()).toBe('false');
  });

  it('renders string and node children', () => {
    mount(
      <AgentThinking thinking={false} testID="r" defaultOpen>
        streamed text
      </AgentThinking>,
    );
    expect(body().textContent).toBe('streamed text');
    mount(
      <AgentThinking thinking={false} testID="r" defaultOpen>
        <Text>a node</Text>
      </AgentThinking>,
    );
    expect(body().textContent).toBe('a node');
  });

  it('grows with a streaming string', () => {
    mount(<AgentThinking testID="r">The</AgentThinking>);
    mount(<AgentThinking testID="r">The answer</AgentThinking>);
    expect(body().textContent).toBe('The answer');
  });
});

describe('AgentThinking disclosure streaming', () => {
  it('opens while streaming and shows the thinking label, not the duration', () => {
    mount(
      <AgentThinking testID="r" durationMs={9000}>
        why
      </AgentThinking>,
    );
    expect(expanded()).toBe('true');
    expect(header().textContent).toContain('Thinking');
    expect(header().textContent).not.toContain('Thought for');
  });

  it('collapses when streaming ends and then reads the duration', () => {
    mount(<AgentThinking testID="r">why</AgentThinking>);
    mount(
      <AgentThinking testID="r" thinking={false} durationMs={12000}>
        why
      </AgentThinking>,
    );
    expect(expanded()).toBe('false');
    expect(header().textContent).toContain('Thought for 12 s');
  });

  it('opens when streaming starts', () => {
    mount(
      <AgentThinking thinking={false} testID="r">
        why
      </AgentThinking>,
    );
    mount(<AgentThinking testID="r">why</AgentThinking>);
    expect(expanded()).toBe('true');
  });

  it('reports the automatic changes through onOpenChange', () => {
    const onOpenChange = jest.fn();
    mount(
      <AgentThinking testID="r" onOpenChange={onOpenChange}>
        why
      </AgentThinking>,
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    mount(
      <AgentThinking thinking={false} testID="r" onOpenChange={onOpenChange}>
        why
      </AgentThinking>,
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the user choice when streaming ends', () => {
    mount(<AgentThinking testID="r">why</AgentThinking>);
    press(); // user closes mid-stream
    expect(expanded()).toBe('false');
    mount(
      <AgentThinking testID="r" thinking={false}>
        why
      </AgentThinking>,
    );
    expect(expanded()).toBe('false');

    mount(<AgentThinking testID="r">why</AgentThinking>);
    expect(expanded()).toBe('true'); // a new stream starts open again
    mount(
      <AgentThinking testID="r" thinking={false}>
        why
      </AgentThinking>,
    );
    expect(expanded()).toBe('false');
  });

  it('does not close a body the user opened after streaming ended', () => {
    mount(<AgentThinking testID="r">why</AgentThinking>);
    mount(
      <AgentThinking testID="r" thinking={false}>
        why
      </AgentThinking>,
    );
    press();
    expect(expanded()).toBe('true');
  });
});

describe('AgentThinking disclosure duration', () => {
  const headerFor = (durationMs?: number) => {
    mount(
      <AgentThinking thinking={false} testID="r" durationMs={durationMs}>
        why
      </AgentThinking>,
    );
    return header().textContent;
  };

  it.each([
    [0, 'Thought for a moment'],
    [400, 'Thought for a moment'],
    [500, 'Thought for 1 s'],
    [1000, 'Thought for 1 s'],
    [12400, 'Thought for 12 s'],
    [59600, 'Thought for 1 min'],
    [60000, 'Thought for 1 min'],
    [65000, 'Thought for 1 min 5 s'],
    [3_725_000, 'Thought for 62 min 5 s'],
  ])('%i ms reads %s', (ms, text) => {
    expect(headerFor(ms)).toContain(text);
  });

  it('reads "Reasoning" with no duration and tolerates a negative one', () => {
    expect(headerFor(undefined)).toContain('Reasoning');
    expect(headerFor(-5)).toContain('Thought for a moment');
  });

  it('reads in the locale, with its units and joiner', () => {
    expect(pickMessages(AGENT_THINKING_MESSAGES, 'zh').thoughtFor(1, 5)).toBe('思考了1分钟5秒');
    expect(pickMessages(AGENT_THINKING_MESSAGES, 'es').thoughtFor(0, 12)).toBe(
      'Pensó durante 12 s',
    );
  });

  it('formats minutes and seconds from the catalog', () => {
    const { thoughtFor } = AGENT_THINKING_MESSAGES.en;
    expect(thoughtFor(1, 5)).toBe('Thought for 1 min 5 s');
    expect(thoughtFor(0, 7)).toBe('Thought for 7 s');
  });
});

describe('AgentThinking disclosure layout', () => {
  it('lays the body out with logical insets so RTL mirrors it', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    mount(
      <AgentThinking thinking={false} testID="r" defaultOpen>
        why
      </AgentThinking>,
    );
    const rule = body().querySelector<HTMLElement>('[style*="border"]')!;
    const style = rule.style;
    expect(style.borderRightWidth).toBe('2px');
    expect(style.borderLeftWidth).not.toBe('2px');
  });

  it('forwards style and testID to the root', () => {
    mount(
      <AgentThinking thinking={false} testID="r" style={{ opacity: 0.5 }}>
        why
      </AgentThinking>,
    );
    const rootEl = container.querySelector<HTMLElement>('[data-testid="r"]')!;
    expect(rootEl.style.opacity).toBe('0.5');
  });
});
