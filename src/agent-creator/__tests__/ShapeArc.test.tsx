import { fireEvent, render } from '@testing-library/react-native';
import { AgentAvatar } from '../../agent-avatar/AgentAvatar';
import { CharacterRuntimeContext } from '../../agent-avatar/context';
import { DEFAULT_CONFIG, FOLD_CONFIG } from '../../agent-avatar/model';
import { StyledImage } from '../../styles/styled-primitives';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { ShapeArc, type ShapeArcChoice } from '../ShapeArc';
import { ShapeSilhouette } from '../ShapeSilhouette';

jest.mock('../../agent-avatar/AgentAvatar', () => ({
  AgentAvatar: jest.fn(() => null),
}));

it('uses frozen previews from the one renderer and renders every body without PNGs and preserves selection', () => {
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
  expect(view.UNSAFE_getAllByType(AgentAvatar)).toHaveLength(9);
  for (const preview of view.UNSAFE_getAllByType(AgentAvatar))
    expect(preview.props).toMatchObject({
      portrait: true,
      paused: true,
      interactive: false,
    });
  expect(view.UNSAFE_queryAllByType(StyledImage)).toHaveLength(0);
  for (const preview of view.UNSAFE_getAllByType(AgentAvatar)) {
    expect(preview.props.config.face).toBe(false);
    expect(preview.props.config.character.selections).toMatchObject({
      eyes: 'none',
      eyewear: 'none',
      accessory: 'none',
    });
  }
  fireEvent.press(view.getByLabelText('cloud shape'));
  expect(onSelect).toHaveBeenCalledWith('cloud');
});

it('preserves Todd geometry while excluding its face and accessories from the preview', () => {
  const view = render(
    <ShapeSilhouette
      config={{
        ...FOLD_CONFIG,
        character: {
          preset: 'blue_beret',
          bodyColor: '#cc5533',
          selections: {
            shape: 'todd',
            eyes: 'cyclops',
            eyewear: 'monocle',
            accessory: 'three_lobe',
          },
        },
      }}
    />,
  );
  const avatar = view.UNSAFE_getByType(AgentAvatar).props;
  expect(avatar.config.character.selections).toEqual({
    shape: 'todd',
    eyes: 'none',
    eyewear: 'none',
    accessory: 'none',
  });
  expect(avatar.config.face).toBe(false);
  expect(avatar.config.character.bodyColor).toBe('#cc5533');
  expect(avatar).toMatchObject({
    portrait: true,
    paused: true,
    interactive: false,
  });
});

it('recolors the body preview without changing the input recipe, seed or parts', () => {
  const config = {
    ...FOLD_CONFIG,
    seed: 83,
    character: {
      preset: 'lime_frog',
      bodyColor: '#dd3322',
      selections: {
        shape: 'heart',
        eyes: 'todd',
        eyewear: 'monocle',
        accessory: 'crown',
      },
    },
  };
  const snapshot = JSON.stringify(config);
  const view = render(<ShapeSilhouette config={config} />);
  const first = view.UNSAFE_getByType(AgentAvatar).props.config;
  expect(first).toMatchObject({
    seed: 83,
    face: false,
    character: {
      bodyColor: '#dd3322',
      selections: {
        shape: 'heart',
        eyes: 'none',
        eyewear: 'none',
        accessory: 'none',
      },
    },
  });
  const next = {
    ...config,
    character: { ...config.character, bodyColor: '#2255dd' },
  };
  view.rerender(<ShapeSilhouette config={next} />);
  expect(view.UNSAFE_getByType(AgentAvatar).props.config.character.bodyColor).toBe('#2255dd');
  expect(JSON.stringify(config)).toBe(snapshot);
  expect(next.character.selections).toEqual(config.character.selections);
});
