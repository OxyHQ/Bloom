import { fireEvent, render } from '@testing-library/react-native';
import { VectorStaticPortrait } from '../../agent-avatar/VectorStaticPortrait';
import { vectorShapePortraits } from '../../agent-avatar/vector-static';
import type { AvatarCharacter } from '../../agent-avatar/character';
import { CharacterRuntimeContext } from '../../agent-avatar/context';
import { StyledImage } from '../../styles/styled-primitives';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { ShapeArc, type ShapeArcChoice } from '../ShapeArc';
import { ShapeSilhouette } from '../ShapeSilhouette';

jest.mock('../../agent-avatar/VectorStaticPortrait', () => ({
  VectorStaticPortrait: jest.fn(() => null),
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
  expect(view.UNSAFE_getAllByType(VectorStaticPortrait)).toHaveLength(9);
  for (const preview of view.UNSAFE_getAllByType(VectorStaticPortrait)) {
    expect(preview.props.size).toBe(56);
    expect(preview.props.bodyColor).toBe('#cc5533');
    expect(preview.props.frame.paths.length).toBeGreaterThan(0);
  }
  expect(view.UNSAFE_queryAllByType(StyledImage)).toHaveLength(0);
  fireEvent.press(view.getByLabelText('cloud shape'));
  expect(onSelect).toHaveBeenCalledWith('cloud');
});

it('keeps the body and its paint while excluding the face and accessories from the preview', () => {
  const view = render(<ShapeSilhouette character={{ ...base, shape: 'todd', eyes: 'cyclops' }} />);
  const preview = view.UNSAFE_getByType(VectorStaticPortrait).props;
  expect(preview.frame).toBe(vectorShapePortraits.todd);
  expect(preview.bodyColor).toBe('#cc5533');
  expect(preview.size).toBe(56);
});

it('recolors the body preview without changing the input character', () => {
  const input: AvatarCharacter = { ...base, shape: 'heart' };
  const snapshot = JSON.stringify(input);
  const view = render(<ShapeSilhouette character={input} />);
  expect(view.UNSAFE_getByType(VectorStaticPortrait).props.frame).toBe(vectorShapePortraits.heart);
  expect(view.UNSAFE_getByType(VectorStaticPortrait).props.bodyColor).toBe('#cc5533');
  view.rerender(<ShapeSilhouette character={{ ...input, bodyColor: '#2255dd' }} />);
  expect(view.UNSAFE_getByType(VectorStaticPortrait).props.bodyColor).toBe('#2255dd');
  expect(JSON.stringify(input)).toBe(snapshot);
});
