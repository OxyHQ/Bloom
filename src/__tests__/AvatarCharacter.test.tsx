import React from 'react';
import { Image } from 'expo-image';
import { act, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AvatarGroup } from '../avatar-group';
import { Avatar, AVATAR_LIVE_SIZE } from '../avatar';
import { resolveAvatarCharacter } from '../agent-avatar/character';
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
const bot = { kind: 'bot', character: { preset: 'blue_beret' as const }, name: 'Peri' };
const last = () => mockAgentAvatar.mock.calls[mockAgentAvatar.mock.calls.length - 1]![0];
const wrap = (ui: React.ReactElement) => (
  <BloomThemeProvider mode="light" colorPreset="teal">
    {ui}
  </BloomThemeProvider>
);
const draw = (ui: React.ReactElement) => render(wrap(ui));
beforeEach(() => {
  mockReduced = false;
  mockAgentAvatar.mockClear();
});
it('routes small bot rows to animated SVG, never account images or old supplied stills', () => {
  const view = draw(
    <Avatar
      account={{ ...bot, avatar: 'https://old/image.png' }}
      characterStill={{ uri: 'https://old/still.png' }}
      size={36}
    />,
  );
  expect(last()).toMatchObject({
    size: 36,
    accessibilityLabel: 'Peri',
  });
  expect(resolveAvatarCharacter(last().character)).toEqual(resolveAvatarCharacter(bot.character));
  expect(view.UNSAFE_queryAllByType(Image)).toHaveLength(0);
});
it.each([
  ['small', 36, undefined, true],
  ['profile', AVATAR_LIVE_SIZE, undefined, true],
  ['working', 36, 'working' as const, true],
])('preserves auto motion for %s', (_name, size, activity, live) => {
  draw(<Avatar account={bot} size={size} activity={activity} />);
  expect(!!last().portrait).toBe(!live);
});
it('honors never and reduced motion without loading a different renderer', () => {
  draw(<Avatar account={bot} size={200} motion="never" activity="working" />);
  expect(last().portrait).toBe(true);
  mockReduced = true;
  draw(<Avatar account={bot} size={200} motion="always" />);
  expect(last().portrait).toBe(true);
});
it('preserves normalized saved paint and expression through SVG rendering', () => {
  const character = { preset: 'alfred' as const, bodyColor: '#123456', eyes: 'cyclops' as const };
  draw(<Avatar character={character} size={32} />);
  expect(resolveAvatarCharacter(last().character)).toEqual(resolveAvatarCharacter(character));
});
it('keeps image and initials fallbacks for people, remote bots and explicit opt-outs', () => {
  const view = draw(
    <>
      <Avatar
        account={{ kind: 'user', character: bot.character, avatar: 'https://person/image.png' }}
      />
      <Avatar account={{ kind: 'bot', avatar: 'https://remote/image.png' }} />
      <Avatar account={bot} character={null} />
    </>,
  );
  expect(mockAgentAvatar).not.toHaveBeenCalled();
  expect(view.UNSAFE_queryAllByType(Image).map((n) => n.props.source?.uri)).toEqual(
    expect.arrayContaining(['https://person/image.png', 'https://remote/image.png']),
  );
  expect(view.queryByText('P')).toBeTruthy();
});
it('rejects incomplete stored recipes to the existing initials fallback', () => {
  const view = draw(
    <Avatar account={{ kind: 'bot', character: { shape: 'heart' }, name: 'Zed' }} />,
  );
  expect(mockAgentAvatar).not.toHaveBeenCalled();
  expect(view.queryByText('Z')).toBeTruthy();
});
it.each([
  ['Peri smiling', 'Peri smiling'],
  ['', ''],
])('preserves explicit accessible name %s', (alt, expected) => {
  draw(<Avatar account={bot} alt={alt} />);
  expect(last().accessibilityLabel).toBe(expected);
});
it('starts work after first frame and forwards reaction requests', () => {
  draw(<Avatar account={bot} size={36} activity="working" reactionKey={7} />);
  expect(last().reactionKey).toBe(7);
  expect(last().workingKey).toBeUndefined();
  act(() => last().onReady!());
  expect(last().workingKey).toBe(1);
});
it('does not silently freeze small characters in dense row lists', () => {
  draw(
    <>
      {Array.from({ length: 50 }, (_, i) => (
        <Avatar key={i} account={bot} size={36} />
      ))}
    </>,
  );
  expect(mockAgentAvatar).toHaveBeenCalledTimes(50);
  expect(mockAgentAvatar.mock.calls.every(([p]) => !p.portrait && !p.paused)).toBe(true);
});

it('accepts DTO string keys, validates unknown characters and follows immutable updates', () => {
  const account: { kind: string; character: { preset: string }; name: { displayName: string } } = {
    kind: 'bot',
    character: { preset: 'blue_beret' },
    name: { displayName: 'Peri' },
  };
  const view = draw(<Avatar account={account} size={32} motion="always" />);
  expect(last().character).toMatchObject({ preset: 'blue_beret' });
  view.rerender(
    wrap(
      <Avatar
        account={{ ...account, character: { preset: 'alfred' } }}
        size={32}
        motion="always"
      />,
    ),
  );
  expect(last().character).toMatchObject({ preset: 'alfred' });
  mockAgentAvatar.mockClear();
  view.rerender(
    wrap(
      <Avatar
        account={{ ...account, character: { preset: 'future-unknown' } }}
        size={32}
        motion="always"
      />,
    ),
  );
  expect(mockAgentAvatar).not.toHaveBeenCalled();
  expect(view.queryByText('P')).toBeTruthy();
});

it('falls through blank service display names to structured names and handles', () => {
  const view = draw(
    <Avatar account={{ name: { displayName: '  ', full: 'Grace Hopper' }, username: 'other' }} />,
  );
  expect(view.queryByText('G')).toBeTruthy();
  view.rerender(
    wrap(<Avatar account={{ name: { displayName: '  ', full: '  ' }, username: 'ada' }} />),
  );
  expect(view.queryByText('A')).toBeTruthy();
});

it.each(['stack', 'row', 'cluster'] as const)(
  'forwards motion through the memoized %s group while retaining SVG under reduced motion',
  (layout) => {
    const items = Array.from({ length: 3 }, (_, index) => ({ ...bot, id: `bot-${index}` }));
    const element = (motion: 'always' | 'never') => (
      <AvatarGroup items={items} layout={layout} size={32} motion={motion} />
    );
    const view = draw(element('never'));
    expect(mockAgentAvatar.mock.calls).toHaveLength(3);
    expect(mockAgentAvatar.mock.calls.every(([props]) => props.portrait)).toBe(true);
    mockAgentAvatar.mockClear();
    view.rerender(wrap(element('always')));
    expect(mockAgentAvatar.mock.calls).toHaveLength(3);
    expect(mockAgentAvatar.mock.calls.every(([props]) => !props.portrait)).toBe(true);
    mockReduced = true;
    view.rerender(wrap(element('never')));
    mockAgentAvatar.mockClear();
    view.rerender(wrap(element('always')));
    expect(mockAgentAvatar.mock.calls).toHaveLength(3);
    expect(mockAgentAvatar.mock.calls.every(([props]) => props.portrait)).toBe(true);
    expect(view.UNSAFE_queryAllByType(Image)).toHaveLength(0);
  },
);

it.each([
  ['name', { ...bot, username: 'peri' }, undefined, 'Peri'],
  ['handle', { kind: 'bot', character: bot.character, username: 'peri' }, undefined, 'peri'],
  [
    'structured name',
    { kind: 'bot', character: bot.character, name: { full: 'Peri Bot' } },
    undefined,
    'Peri Bot',
  ],
  ['alt', bot, 'Peri smiling', 'Peri smiling'],
  ['fallback', { kind: 'bot', character: bot.character }, undefined, 'Agent avatar'],
])('names a static SVG by its %s', (_name, account, alt, expected) => {
  draw(<Avatar account={account} alt={alt} motion="never" />);
  expect(last().portrait).toBe(true);
  expect(last().accessibilityLabel).toBe(expected);
});
