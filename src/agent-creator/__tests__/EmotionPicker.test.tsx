import { fireEvent, render } from '@testing-library/react-native';
import { CharacterAvatar } from '../../agent-avatar/CharacterAvatar';
import type { AvatarCharacter } from '../../agent-avatar/character';
import { StyledImage } from '../../styles/styled-primitives';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { CHARACTER_OPTIONS } from '../constants';
import { EmotionPicker } from '../EmotionPicker';

jest.mock('../../agent-avatar/CharacterAvatar', () => ({
  CharacterAvatar: jest.fn(() => null),
}));

const character: AvatarCharacter = {
  preset: 'blue_beret',
  bodyColor: '#23ab78',
  shape: 'heart',
  eyes: 'todd',
  eyewear: 'monocle',
  accessory: 'crown',
};

it('renders all eye styles as isolated eyes on a plain circle, preserving paint and selection', () => {
  const choices = CHARACTER_OPTIONS.eyes.map(([id, label]) => ({
    id,
    label,
    character: { ...character, eyes: id },
  }));
  const snapshot = JSON.stringify(choices),
    onSelect = jest.fn();
  const view = render(
    <BloomThemeProvider>
      <EmotionPicker choices={choices} value="todd" backgroundColor="#23ab78" onSelect={onSelect} />
    </BloomThemeProvider>,
  );
  const eyes = view.UNSAFE_getAllByType(CharacterAvatar);
  expect(eyes).toHaveLength(12);
  expect(view.UNSAFE_queryAllByType(StyledImage)).toHaveLength(0);
  for (const [index, eye] of eyes.entries()) {
    expect(eye.props).toMatchObject({
      previewPart: 'eyes',
      paused: true,
      portrait: true,
      interactive: false,
      size: 34,
    });
    expect(eye.props.character).toMatchObject({
      bodyColor: '#23ab78',
      shape: 'circle',
      eyes: choices[index]!.id,
      eyewear: 'none',
      accessory: 'none',
    });
  }
  fireEvent.press(view.getByLabelText('Single eye'));
  expect(onSelect).toHaveBeenCalledWith('cyclops');
  expect(JSON.stringify(choices)).toBe(snapshot);
});

it('keeps disabled eyes noninteractive without changing the chosen character', () => {
  const lime: AvatarCharacter = { preset: 'lime_frog', eyes: 'clippo' };
  const onSelect = jest.fn();
  const view = render(
    <BloomThemeProvider>
      <EmotionPicker
        choices={[{ id: 'clippo', label: 'Clippo', character: lime, disabled: true }]}
        value="clippo"
        backgroundColor="#b6d80b"
        onSelect={onSelect}
      />
    </BloomThemeProvider>,
  );
  fireEvent.press(view.getByLabelText('Clippo'));
  expect(onSelect).not.toHaveBeenCalled();
  expect(view.UNSAFE_getByType(CharacterAvatar).props.style.opacity).toBe(0.35);
});
