import { fireEvent, render } from '@testing-library/react-native';
import { AgentAvatar } from '../../agent-avatar/AgentAvatar';
import type { AvatarCharacter } from '../../agent-avatar/character';
import { CharacterRuntimeContext } from '../../agent-avatar/context';
import { StyledImage } from '../../styles/styled-primitives';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { ShapeArc, type ShapeArcChoice } from '../ShapeArc';
import { ShapeSilhouette } from '../ShapeSilhouette';

jest.mock('../../agent-avatar/AgentAvatar', () => ({
  AgentAvatar: jest.fn(() => null),
}));

const base: AvatarCharacter = {
  preset: 'blue_beret',
  eyes: 'todd',
  eyewear: 'monocle',
  accessory: 'crown',
  bodyColor: '#cc5533',
};

it('uses frozen previews from the one renderer for every body, without PNGs, and keeps the selection', () => {
  const choices: ShapeArcChoice[] = (
    [
      'slender',
      'pocket',
      'petal',
      'star',
      'cloud',
      'shield',
      'pebble',
      'squircle',
      'circle',
    ] as const
  ).map((shape) => ({ id: shape, label: shape, character: { ...base, shape } }));
  const onSelect = jest.fn();
  const view = render(
    <CharacterRuntimeContext.Provider value={{ runtimeUrl: '/runtime.mjs' }}>
      <BloomThemeProvider>
        <ShapeArc choices={choices} value="slender" onSelect={onSelect} />
      </BloomThemeProvider>
    </CharacterRuntimeContext.Provider>,
  );
  expect(view.UNSAFE_getAllByType(AgentAvatar)).toHaveLength(9);
  for (const preview of view.UNSAFE_getAllByType(AgentAvatar)) {
    expect(preview.props).toMatchObject({ portrait: true, paused: true, interactive: false });
    expect(preview.props.character).toMatchObject({
      eyes: 'none',
      eyewear: 'none',
      accessory: 'none',
    });
  }
  expect(view.UNSAFE_queryAllByType(StyledImage)).toHaveLength(0);
  fireEvent.press(view.getByLabelText('cloud shape'));
  expect(onSelect).toHaveBeenCalledWith('cloud');
});

it('keeps the body and its paint while excluding the face and accessories from the preview', () => {
  const view = render(<ShapeSilhouette character={{ ...base, shape: 'todd', eyes: 'cyclops' }} />);
  const { character, ...rest } = view.UNSAFE_getByType(AgentAvatar).props;
  expect(character).toMatchObject({
    shape: 'todd',
    eyes: 'none',
    eyewear: 'none',
    accessory: 'none',
    bodyColor: '#cc5533',
  });
  expect(rest).toMatchObject({ portrait: true, paused: true, interactive: false });
});

it('recolors the body preview without changing the input character', () => {
  const input: AvatarCharacter = { ...base, shape: 'heart' };
  const snapshot = JSON.stringify(input);
  const view = render(<ShapeSilhouette character={input} />);
  expect(view.UNSAFE_getByType(AgentAvatar).props.character).toMatchObject({
    shape: 'heart',
    bodyColor: '#cc5533',
    eyes: 'none',
  });
  view.rerender(<ShapeSilhouette character={{ ...input, bodyColor: '#2255dd' }} />);
  expect(view.UNSAFE_getByType(AgentAvatar).props.character.bodyColor).toBe('#2255dd');
  expect(JSON.stringify(input)).toBe(snapshot);
});
