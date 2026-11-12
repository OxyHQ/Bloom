/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});
jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const host = (tag: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { children, animatedProps: _animatedProps, ...rest } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
  return {
    __esModule: true,
    default: host('svg'),
    Svg: host('svg'),
    Path: host('path'),
    Circle: host('circle'),
  };
});
jest.mock('../ai-chat/AiChatReveal', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native-web');
  const wrapper = (props: Record<string, unknown>) => {
    const { children, ...rest } = props;
    return React.createElement(View, rest, children);
  };
  return {
    RevealFade: wrapper,
    RevealLine: wrapper,
    RevealSequence: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useRevealSlot: () => ({ animate: false, delay: 0 }),
  };
});

import {
  AiChatBullet,
  AiChatBulletList,
  AiChatLinkChip,
  AiChatMessageLine,
  AiChatStrong,
} from '../ai-chat/AiChatMessages';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('keeps authored AiChat message part geometry independent from BloomScope on web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderParts = (size?: 'xs' | 'lg') =>
      act(() => {
        const parts = (
          <>
            {/* biome-ignore lint/correctness/noReactNativeRawText: AiChatMessageLine renders its children inside Bloom Text. */}
            <AiChatMessageLine tone="secondary">status</AiChatMessageLine>
            <AiChatBulletList>
              <AiChatBullet>
                {/* biome-ignore lint/correctness/noReactNativeRawText: AiChatStrong renders its children inside Bloom Text. */}
                <AiChatStrong>Important</AiChatStrong>
              </AiChatBullet>
            </AiChatBulletList>
            {/* biome-ignore lint/correctness/noReactNativeRawText: AiChatLinkChip renders its children inside Bloom Text. */}
            <AiChatLinkChip>resource</AiChatLinkChip>
          </>
        );
        root.render(
          <BloomThemeProvider mode="light" fonts={false}>
            {size ? <BloomScope size={size}>{parts}</BloomScope> : parts}
          </BloomThemeProvider>,
        );
      });
    const geometry = () => {
      const list = Array.from(host.querySelectorAll<HTMLElement>('*')).find(
        (element) => element.style.paddingLeft === '21px' && element.style.gap === '8px',
      );
      const bullet = Array.from(host.querySelectorAll<HTMLElement>('*')).find(
        (element) => element.style.width === '5px' && element.style.height === '5px',
      );
      const link = host.querySelector<HTMLElement>('[data-bloom-ai-chat-chip]');
      const linkGlyph = link?.querySelector<SVGElement>('svg');
      const exactText = (text: string) =>
        Array.from(host.querySelectorAll<HTMLElement>('*')).find(
          (element) => element.textContent === text && element.children.length === 0,
        );
      const message = exactText('status');
      const strong = exactText('Important');
      if (!list || !bullet || !link || !linkGlyph || !message || !strong) {
        throw new Error('AiChat message part geometry is missing');
      }
      return {
        list: [list.style.paddingLeft, list.style.gap],
        bullet: [
          bullet.style.width,
          bullet.style.height,
          getComputedStyle(bullet).borderTopLeftRadius,
        ],
        link: [link.style.paddingLeft, link.style.paddingTop],
        linkGlyph: [linkGlyph.getAttribute('width'), linkGlyph.getAttribute('height')],
        message: [getComputedStyle(message).fontSize, getComputedStyle(message).lineHeight],
        strong: [getComputedStyle(strong).fontSize, getComputedStyle(strong).lineHeight],
      };
    };
    renderParts();
    const initial = geometry();
    expect(initial.list).toEqual(['21px', '8px']);
    expect(initial.bullet).toEqual(['5px', '5px', '2.5px']);
    expect(initial.link).toEqual(['4px', '3px']);
    expect(initial.linkGlyph).toEqual(['16', '16']);
    expect(initial.message).toEqual(['14px', '20px']);
    expect(initial.strong).toEqual(['14px', '20px']);
    renderParts('xs');
    expect(geometry()).toEqual(initial);
    renderParts('lg');
    expect(geometry()).toEqual(initial);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
