import React from 'react';
// `image/BloomImage` draws with expo-image on a device, and jest's `Platform.OS`
// is `ios` — so the rendered image is `__mocks__/expo-image.ts`'s component,
// not react-native's `Image`.
import { Image } from 'expo-image';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Avatar, AVATAR_LIVE_SIZE } from '../avatar';
import { AvatarGroup } from '../avatar-group';
import { CharacterRuntimeContext } from '../agent-avatar/context';
import { resolveAvatarCharacter } from '../agent-avatar/character';
import {
  createCharacterStills,
  type StillBackend,
  type StillJob,
} from '../agent-avatar/character-still';
import type { AgentAvatarProps } from '../agent-avatar/types';

const mockAgentAvatar = jest.fn((_props: AgentAvatarProps) => null);
jest.mock('../agent-avatar/AgentAvatar', () => ({
  AgentAvatar: (props: AgentAvatarProps) => {
    mockAgentAvatar(props);
    return null;
  },
}));
let mockReduced = false;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReduced,
}));

const URI = 'data:image/png;base64,AAAA';
const bot = { kind: 'bot', character: { preset: 'blue_beret' as const }, name: 'Peri' };
const lastProps = () => mockAgentAvatar.mock.calls[mockAgentAvatar.mock.calls.length - 1]![0];
const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

let jobs: StillJob[];
let backend: jest.Mock<ReturnType<StillBackend>, Parameters<StillBackend>>;
let stills: ReturnType<typeof createCharacterStills>;
const wrap = (ui: React.ReactElement) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    <CharacterRuntimeContext.Provider
      value={{ runtimeUrl: 'https://example.test/runtime.mjs', stills }}
    >
      {ui}
    </CharacterRuntimeContext.Provider>
  </BloomThemeProvider>
);
const renderAvatar = (ui: React.ReactElement) => render(wrap(ui));
const stillImages = (view: ReturnType<typeof render>) =>
  view.UNSAFE_queryAllByType(Image).filter((node) => node.props.source?.uri === URI);

beforeEach(() => {
  jobs = [];
  mockReduced = false;
  mockAgentAvatar.mockClear();
  backend = jest.fn(async (job: StillJob) => {
    jobs.push(job);
    return URI;
  });
  stills = createCharacterStills({ runtimeUrl: 'https://example.test/runtime.mjs', backend });
});

describe('resolution order: character, then image, then initials', () => {
  it('draws a bot account with a character, as its still, never its image', async () => {
    const view = renderAvatar(
      <Avatar account={{ ...bot, avatar: 'https://cdn.test/bot.png' }} size={40} />,
    );
    await flush();
    expect(stillImages(view)).toHaveLength(1);
    expect(
      view
        .UNSAFE_queryAllByType(Image)
        .some((n) => n.props.source?.uri === 'https://cdn.test/bot.png'),
    ).toBe(false);
  });

  it('an explicit character wins, even for an account that is not a bot', async () => {
    const view = renderAvatar(
      <Avatar account={{ kind: 'user', name: 'Ada' }} character={{ preset: 'alfred' }} />,
    );
    await flush();
    expect(stillImages(view)).toHaveLength(1);
    expect(jobs[0]!.character.preset).toBe('alfred');
  });

  it('a person with a stored character still draws their image', async () => {
    const view = renderAvatar(
      <Avatar
        account={{
          kind: 'user',
          character: { preset: 'alfred' },
          avatar: 'https://cdn.test/p.png',
        }}
      />,
    );
    await flush();
    expect(backend).not.toHaveBeenCalled();
    expect(
      view
        .UNSAFE_queryAllByType(Image)
        .some((n) => n.props.source?.uri === 'https://cdn.test/p.png'),
    ).toBe(true);
  });

  it('character={null} opts a bot out: its remote image is drawn instead', async () => {
    const view = renderAvatar(
      <Avatar account={{ ...bot, avatar: 'https://cdn.test/remote.png' }} character={null} />,
    );
    await flush();
    expect(backend).not.toHaveBeenCalled();
    expect(
      view
        .UNSAFE_queryAllByType(Image)
        .some((n) => n.props.source?.uri === 'https://cdn.test/remote.png'),
    ).toBe(true);
  });

  it('a remote bot with no character keeps its remote image', async () => {
    const view = renderAvatar(
      <Avatar account={{ kind: 'bot', avatar: 'https://remote.test/a.png' }} />,
    );
    await flush();
    expect(backend).not.toHaveBeenCalled();
    expect(
      view
        .UNSAFE_queryAllByType(Image)
        .some((n) => n.props.source?.uri === 'https://remote.test/a.png'),
    ).toBe(true);
  });

  it('an invalid stored character falls to the image path instead of throwing', async () => {
    const view = renderAvatar(
      <Avatar
        account={{ kind: 'bot', character: { shape: 'heart' }, name: 'Zed', avatar: null }}
        size={40}
      />,
    );
    await flush();
    expect(backend).not.toHaveBeenCalled();
    expect(view.queryByText('Z')).toBeTruthy();
  });

  it('explicit source/uri still beats the account image, and the account names the initials', () => {
    const view = renderAvatar(
      <Avatar
        account={{
          kind: 'user',
          name: { first: 'Grace', last: 'Hopper' },
          avatar: 'https://a.test/a.png',
        }}
        source="https://b.test/b.png"
      />,
    );
    const uris = view.UNSAFE_queryAllByType(Image).map((n) => n.props.source?.uri);
    expect(uris).toContain('https://b.test/b.png');
    expect(uris).not.toContain('https://a.test/a.png');
  });
});

describe('placeholder, then still', () => {
  it('shows the initials at the final size until the still has drawn, then swaps with no layout change', async () => {
    let finish!: (uri: string) => void;
    backend.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const view = renderAvatar(<Avatar account={bot} size={48} testID="avatar" />);
    expect(view.queryByText('P')).toBeTruthy();
    expect(stillImages(view)).toHaveLength(0);
    await flush();
    const box = view.getByTestId('avatar').props.style;
    await act(async () => finish(URI));
    expect(stillImages(view)).toHaveLength(1);
    expect(view.queryByText('P')).toBeNull();
    expect(view.getByTestId('avatar').props.style).toEqual(box);
    expect(stillImages(view)[0]!.props.style).toEqual({ width: 48, height: 48 });
  });

  it('keeps the placeholder when the still cannot be drawn', async () => {
    backend.mockResolvedValue(null);
    const view = renderAvatar(<Avatar account={bot} size={40} />);
    await flush();
    expect(view.queryByText('P')).toBeTruthy();
  });
});

describe('live or still', () => {
  const mounted = () => mockAgentAvatar.mock.calls.length;

  it.each([
    ['a list-row size', 36, undefined, false],
    ['a size rung', 'lg' as const, undefined, false],
    ['a profile size', AVATAR_LIVE_SIZE, undefined, true],
    ['a small size that is working', 36, 'working' as const, true],
  ])('auto: %s', async (_name, size, activity, live) => {
    const view = renderAvatar(<Avatar account={bot} size={size} activity={activity} />);
    await flush();
    expect(mounted() > 0).toBe(live);
    expect(stillImages(view).length > 0).toBe(!live);
  });

  it('always moves and never does not, whatever the size', async () => {
    renderAvatar(<Avatar account={bot} size={36} motion="always" />);
    expect(mounted()).toBeGreaterThan(0);
    mockAgentAvatar.mockClear();
    const never = renderAvatar(
      <Avatar account={bot} size={200} motion="never" activity="working" />,
    );
    await flush();
    expect(mounted()).toBe(0);
    expect(stillImages(never)).toHaveLength(1);
  });

  it('reduced motion makes every avatar a still, even motion="always"', async () => {
    mockReduced = true;
    const view = renderAvatar(
      <Avatar account={bot} size={200} motion="always" activity="working" />,
    );
    await flush();
    expect(mounted()).toBe(0);
    expect(stillImages(view)).toHaveLength(1);
  });

  it('a live avatar draws no still and asks the cache for nothing', async () => {
    renderAvatar(<Avatar account={bot} size={AVATAR_LIVE_SIZE} />);
    await flush();
    expect(backend).not.toHaveBeenCalled();
  });

  it('maps activity, reactionKey and the character onto AgentAvatar', async () => {
    renderAvatar(<Avatar account={bot} size={120} reactionKey={3} />);
    const props = lastProps();
    expect(props).toMatchObject({ size: 120, reactionKey: 3 });
    expect(props.character).toMatchObject({ preset: 'blue_beret' });
  });

  it('starts the working episode once the first frame is up, and again when it re-enters', () => {
    const element = (activity: 'idle' | 'working') => (
      <Avatar account={bot} size={120} activity={activity} />
    );
    const view = renderAvatar(element('working'));
    const last = () => lastProps();
    expect(last().workingKey).toBeUndefined();
    act(() => last().onReady!());
    expect(last().workingKey).toBe(1);
    view.rerender(wrap(element('idle')));
    expect(last().workingKey).toBe(1);
    view.rerender(wrap(element('working')));
    expect(last().workingKey).toBe(2);
  });

  it('a live character keeps its own paint, not its preset’s', () => {
    renderAvatar(
      <Avatar
        character={{ preset: 'blue_beret', accessory: 'none', color: 'orchid' }}
        size={120}
      />,
    );
    const handed = resolveAvatarCharacter(lastProps().character);
    expect(handed.paint).toEqual({ color: 'orchid' });
    expect(handed).toEqual(
      resolveAvatarCharacter({ preset: 'blue_beret', accessory: 'none', color: 'orchid' }),
    );
  });

  it('an explicit workingKey is the caller’s and is passed through', () => {
    renderAvatar(<Avatar account={bot} size={120} activity="working" workingKey={9} />);
    expect(lastProps().workingKey).toBe(9);
  });
});

describe('a still made ahead of time (characterStill)', () => {
  const MADE = 'data:image/png;base64,MADE';
  const madeImages = (view: ReturnType<typeof render>) =>
    view.UNSAFE_queryAllByType(Image).filter((node) => node.props.source?.uri === MADE);

  it('a still avatar draws it from the first render and never asks the cache, so no runtime loads', async () => {
    const view = renderAvatar(
      <Avatar account={bot} characterStill={{ uri: MADE }} size={20} alt="Peri" />,
    );
    expect(madeImages(view)).toHaveLength(1);
    await flush();
    expect(backend).not.toHaveBeenCalled();
    expect(mockAgentAvatar).not.toHaveBeenCalled();
    expect(stillImages(view)).toHaveLength(0);
    expect(view.queryByText('P')).toBeNull();
    const image = madeImages(view)[0]!;
    expect(image.props.style).toEqual({ width: 20, height: 20 });
    expect(image.props.accessibilityLabel).toBe('Peri');
  });

  it('reduced motion keeps it a still', async () => {
    mockReduced = true;
    const view = renderAvatar(
      <Avatar account={bot} characterStill={{ uri: MADE }} size={20} activity="working" />,
    );
    await flush();
    expect(mockAgentAvatar).not.toHaveBeenCalled();
    expect(madeImages(view)).toHaveLength(1);
    expect(backend).not.toHaveBeenCalled();
  });

  it('a live character shows it, unnamed, under the first frame instead of the initials', () => {
    const view = renderAvatar(
      <Avatar account={bot} characterStill={{ uri: MADE }} size={20} activity="working" />,
    );
    expect(mockAgentAvatar).toHaveBeenCalled();
    expect(madeImages(view)).toHaveLength(1);
    expect(madeImages(view)[0]!.props.accessible).toBe(false);
    expect(view.queryByText('P')).toBeNull();
    act(() => lastProps().onReady!());
    expect(madeImages(view)).toHaveLength(0);
    expect(backend).not.toHaveBeenCalled();
  });

  it('is ignored when no character is drawn', () => {
    const view = renderAvatar(
      <Avatar account={{ kind: 'user', name: 'Ada' }} characterStill={{ uri: MADE }} />,
    );
    expect(madeImages(view)).toHaveLength(0);
    expect(view.queryByText('A')).toBeTruthy();
  });
});

describe('50 rows', () => {
  const rows = Array.from({ length: 50 }, (_, i) => ({
    id: `bot-${i}`,
    kind: 'bot',
    name: `Bot ${i}`,
    character: { preset: 'blue_beret' as const, eyeSpacing: 0.5 + (i % 5) * 0.2 },
  }));

  it('mounts no AgentAvatar, and renders each distinct character once', async () => {
    const view = renderAvatar(
      <>
        {rows.map((account) => (
          <Avatar key={account.id} account={account} size={36} />
        ))}
      </>,
    );
    await flush();
    await flush();
    expect(mockAgentAvatar).not.toHaveBeenCalled();
    expect(backend).toHaveBeenCalledTimes(5);
    expect(stillImages(view)).toHaveLength(50);
  });

  it('a facepile of bots is stills too', async () => {
    const view = renderAvatar(<AvatarGroup items={rows.slice(0, 5)} size={32} />);
    await flush();
    await flush();
    expect(mockAgentAvatar).not.toHaveBeenCalled();
    expect(stillImages(view).length).toBeGreaterThan(0);
  });
});

describe('accessible name', () => {
  const imageNode = (view: ReturnType<typeof render>) =>
    view.UNSAFE_queryAllByType(Image).find((n) => n.props.source?.uri === URI)!;

  it.each([
    ['the name', { ...bot, username: 'peri' }, undefined, 'Peri'],
    [
      'the handle when there is no name',
      { kind: 'bot', character: bot.character, username: 'peri' },
      undefined,
      'peri',
    ],
    [
      'Oxy’s name object',
      { kind: 'bot', character: bot.character, name: { full: 'Peri Bot' } },
      undefined,
      'Peri Bot',
    ],
    ['alt over both', bot, 'Peri smiling', 'Peri smiling'],
    [
      'a default when the account has neither',
      { kind: 'bot', character: bot.character },
      undefined,
      'Agent avatar',
    ],
  ])('a still is named by %s', async (_name, account, alt, expected) => {
    const view = renderAvatar(<Avatar account={account} alt={alt} />);
    await flush();
    expect(imageNode(view).props.accessibilityLabel).toBe(expected);
    expect(imageNode(view).props.accessibilityRole).toBe('image');
  });

  it('alt="" is the explicit decorative opt-out', async () => {
    const view = renderAvatar(<Avatar account={bot} alt="" />);
    await flush();
    expect(imageNode(view).props.accessible).toBe(false);
    expect(imageNode(view).props.accessibilityLabel).toBeUndefined();
  });

  it('a live character is named the same way', () => {
    renderAvatar(<Avatar account={bot} size={AVATAR_LIVE_SIZE} />);
    expect(lastProps().accessibilityLabel).toBe('Peri');
  });
});
