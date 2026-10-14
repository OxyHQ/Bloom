import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AgentProfile } from '..';

const reactions: Array<number | undefined> = [];
jest.mock('../../agent-avatar', () => ({
  AgentAvatar: ({ reactionKey }: { reactionKey?: number }) => {
    reactions.push(reactionKey);
    return null;
  },
}));

const agent = (id: string) => ({ id, name: id, avatar: { preset: 'blue_beret' as const } });

describe('AgentProfile reaction', () => {
  beforeEach(() => {
    reactions.length = 0;
  });

  it('makes every avatar in it wave when pressed, then calls onPress', () => {
    const onPress = jest.fn();
    const view = render(
      <BloomThemeProvider mode="light">
        <AgentProfile agents={[agent('a'), agent('b'), agent('c')]} onPress={onPress} />
      </BloomThemeProvider>,
    );
    reactions.length = 0;

    fireEvent.press(view.getByLabelText('a + b + c'));

    expect(onPress).toHaveBeenCalledTimes(1);
    // The last render of each of the three avatars carries the same, advanced key.
    expect(reactions.slice(-3)).toEqual([1, 1, 1]);
  });
});
