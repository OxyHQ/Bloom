import { fireEvent, render } from '@testing-library/react-native';
import { AgentAvatar } from '../../agent-avatar/AgentAvatar';
import { CharacterRuntimeContext } from '../../agent-avatar/context';
import { DEFAULT_CONFIG, FOLD_CONFIG } from '../../agent-avatar/model';
import { StyledImage } from '../../styles/styled-primitives';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { ShapeArc, type ShapeArcChoice } from '../ShapeArc';
import { Path } from 'react-native-svg';
import { CHARACTER_COLORS } from '../constants';

jest.mock('../../agent-avatar/AgentAvatar', () => ({
  AgentAvatar: jest.fn(() => {
    throw new Error('The shape selector must not start an avatar renderer');
  }),
}));

it('shows all migrated contours without rendering avatars and preserves catalog PNGs and selection', () => {
  const choices: ShapeArcChoice[] = [
    ...(['slender', 'pocket', 'petal', 'star', 'cloud', 'shield'] as const).map((foldShape) => ({
      id: foldShape,
      label: foldShape,
      config: { ...FOLD_CONFIG, foldShape },
    })),
    ...(['pebble', 'squircle'] as const).map((shape) => ({
      id: shape,
      label: shape,
      config: { ...DEFAULT_CONFIG, shape },
    })),
    {
      id: 'circle',
      label: 'circle',
      config: DEFAULT_CONFIG,
      thumbnail: '/thumbnails/shapes/circle.png',
    },
  ];
  const onSelect = jest.fn();
  const view = render(
    <CharacterRuntimeContext.Provider value={{ runtimeUrl: '/runtime.mjs' }}>
      <BloomThemeProvider>
        <ShapeArc
          config={FOLD_CONFIG}
          choices={choices}
          value="slender"
          onChange={jest.fn()}
          onSelect={onSelect}
        />
      </BloomThemeProvider>
    </CharacterRuntimeContext.Provider>,
  );
  expect(AgentAvatar).not.toHaveBeenCalled();
  expect(
    view.UNSAFE_getAllByType(Path).filter((path) => path.props.fill === CHARACTER_COLORS.pink),
  ).toHaveLength(8);
  expect(view.UNSAFE_getByType(StyledImage).props.source).toEqual({
    uri: '/thumbnails/shapes/circle.png',
  });
  fireEvent.press(view.getByLabelText('cloud shape'));
  expect(onSelect).toHaveBeenCalledWith('cloud');
});
