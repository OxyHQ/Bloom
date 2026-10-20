/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../portal', () => jest.requireActual('../portal/index.web'));
jest.mock('../button', () => jest.requireActual('../button/index.web'));

import { BloomScope, type BloomSize } from '../appearance';
import { ContactRow } from '../chat-people/ContactRow';
import { ReleaseStatusBadge } from '../creator-studio/ReleaseCard';
import { OfferingBadge } from '../offering-badge/OfferingBadge';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Tooltip, TooltipContent, TooltipTextBubble, TooltipTrigger } from '../tooltip/Tooltip.web';
import { VoiceControls } from '../voice/VoiceControls';

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
function mount(content: ReactNode) {
  act(() => root.render(<BloomThemeProvider mode="light">{content}</BloomThemeProvider>));
}
function element(selector: string) {
  const node = document.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
}
const subjects = [
  {
    name: 'voice controls',
    render: (size?: 'sm' | 'md') => <VoiceControls onEnd={() => {}} size={size} testID="voice" />,
    measure: () => getComputedStyle(element('[data-testid="voice-end"]')).height,
    defaultSize: '44px',
    small: '32px',
    medium: '36px',
    large: '44px',
  },
  {
    name: 'offering badge',
    render: (size?: 'sm' | 'md') => <OfferingBadge offering="sale" size={size} testID="offering" />,
    measure: () => getComputedStyle(element('[data-testid="offering"]')).height,
    defaultSize: '24px',
    small: '20px',
    medium: '24px',
    large: '24px',
  },
  {
    name: 'release status badge',
    render: (size?: 'sm' | 'md') => (
      <ReleaseStatusBadge status="draft" size={size} testID="release" />
    ),
    measure: () => getComputedStyle(element('[data-testid="release"]')).height,
    defaultSize: '20px',
    small: '20px',
    medium: '24px',
    large: '24px',
  },
  {
    name: 'contact row avatar',
    render: (size?: 'sm' | 'md') => (
      <ContactRow id="person" name="Ana" size={size} testID="contact" />
    ),
    measure: () => {
      const row = element('[data-testid="contact"]');
      const avatar = Array.from(row.querySelectorAll<HTMLElement>('div')).find((node) => {
        const style = getComputedStyle(node);
        return (
          style.position === 'relative' &&
          style.width === style.height &&
          ['36px', '44px'].includes(style.width)
        );
      });
      if (!avatar) throw new Error('Missing sized contact avatar');
      return getComputedStyle(avatar).width;
    },
    defaultSize: '44px',
    small: '36px',
    medium: '44px',
    large: '44px',
  },
];
it.each(subjects)(
  '$name resolves family default, all inherited rungs, nesting and explicit override',
  (subject) => {
    mount(subject.render());
    expect(subject.measure()).toBe(subject.defaultSize);
    for (const [size, expected] of [
      ['xs', subject.small],
      ['sm', subject.small],
      ['md', subject.medium],
      ['lg', subject.large],
    ] as const) {
      mount(<BloomScope size={size}>{subject.render()}</BloomScope>);
      expect(subject.measure()).toBe(expected);
    }
    mount(
      <BloomScope size="sm">
        <BloomScope size="md">{subject.render()}</BloomScope>
      </BloomScope>,
    );
    expect(subject.measure()).toBe(subject.medium);
    mount(<BloomScope size="lg">{subject.render('sm')}</BloomScope>);
    expect(subject.measure()).toBe(subject.small);
  },
);
it.each(['content', 'text bubble'] as const)(
  'tooltip %s inherits size through its real portal',
  (kind) => {
    function content(size?: 'sm' | 'md') {
      return (
        <Tooltip visible onVisibleChange={() => {}}>
          <TooltipTrigger>
            <span>Anchor</span>
          </TooltipTrigger>
          {kind === 'content' ? (
            <TooltipContent label="Help" size={size}>
              <span>Help</span>
            </TooltipContent>
          ) : (
            <TooltipTextBubble size={size}>Help</TooltipTextBubble>
          )}
        </Tooltip>
      );
    }
    function padding() {
      return getComputedStyle(element('[data-bloom-tooltip]')).paddingLeft;
    }
    mount(content());
    expect(padding()).toBe('10px');
    for (const [size, expected] of [
      ['xs', '10px'],
      ['sm', '10px'],
      ['md', '12px'],
      ['lg', '12px'],
    ] as const satisfies readonly (readonly [BloomSize, string])[]) {
      mount(<BloomScope size={size}>{content()}</BloomScope>);
      expect(padding()).toBe(expected);
      expect(container.querySelector('[data-bloom-tooltip]')).toBeNull();
      if (kind === 'text bubble') {
        const text = element('[data-bloom-tooltip] [dir="auto"]');
        expect(getComputedStyle(text).fontSize).toBe(
          size === 'xs' || size === 'sm' ? '12px' : '14px',
        );
      }
    }
    mount(
      <BloomScope size="lg">
        <BloomScope size="sm">{content()}</BloomScope>
      </BloomScope>,
    );
    expect(padding()).toBe('10px');
    mount(<BloomScope size="sm">{content('md')}</BloomScope>);
    expect(padding()).toBe('12px');
  },
);
