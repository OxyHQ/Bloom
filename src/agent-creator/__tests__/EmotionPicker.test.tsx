import { fireEvent, render } from '@testing-library/react-native';
import { CharacterAvatar } from '../../agent-avatar/CharacterAvatar';
import { FOLD_CONFIG } from '../../agent-avatar/model';
import { StyledImage } from '../../styles/styled-primitives';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { CHARACTER_OPTIONS } from '../constants';
import { EmotionPicker } from '../EmotionPicker';

jest.mock('../../agent-avatar/CharacterAvatar', () => ({
  CharacterAvatar: jest.fn(() => null),
}));

it('renders all eye styles as isolated eyes on a neutral fitting body, preserving paint and selection', () => {
  const config = {
    ...FOLD_CONFIG,
    face: false,
    seed: 83,
    character: {
      preset: 'blue_beret',
      bodyColor: '#23ab78',
      selections: {
        shape: 'heart',
        eyes: 'todd',
        eyewear: 'monocle',
        accessory: 'crown',
      },
    },
  };
  const choices = CHARACTER_OPTIONS.eyes.map(([id, label]) => ({
    id,
    label,
    config: {
      ...config,
      character: {
        ...config.character,
        selections: { ...config.character.selections, eyes: id },
      },
    },
  }));
  const snapshot = JSON.stringify(choices),
    onSelect = jest.fn();
  const view = render(
    <BloomThemeProvider>
      <EmotionPicker
        config={config}
        choices={choices}
        value="todd"
        onChange={jest.fn()}
        onSelect={onSelect}
      />
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
    expect(eye.props.config).toMatchObject({
      face: true,
      seed: 83,
      lookAt: 'center',
      character: {
        bodyColor: '#23ab78',
        selections: {
          shape: 'circle',
          eyes: choices[index]!.id,
          eyewear: 'none',
          accessory: 'none',
        },
      },
    });
  }
  fireEvent.press(view.getByLabelText('Single eye'));
  expect(onSelect).toHaveBeenCalledWith('cyclops');
  expect(JSON.stringify(choices)).toBe(snapshot);
});

it('keeps disabled eyes noninteractive without changing the chosen recipe', () => {
  const config = {
    ...FOLD_CONFIG,
    character: { preset: 'lime_frog', selections: { eyes: 'clippo' } },
  };
  const onSelect = jest.fn();
  const view = render(
    <BloomThemeProvider>
      <EmotionPicker
        config={config}
        choices={[{ id: 'clippo', label: 'Clippo', config, disabled: true }]}
        onSelect={onSelect}
        onChange={jest.fn()}
      />
    </BloomThemeProvider>,
  );
  fireEvent.press(view.getByLabelText('Clippo'));
  expect(onSelect).not.toHaveBeenCalled();
  expect(view.UNSAFE_getByType(CharacterAvatar).props.style.opacity).toBe(0.35);
});
