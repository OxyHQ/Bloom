import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatar } from '../AgentAvatar';
import { CharacterAvatar } from '../CharacterAvatar';
import type { AvatarCharacter } from '../character';
jest.mock('../../styles/styled-primitives', () => ({
  StyledView: require('react-native').View,
  StyledText: require('react-native').Text,
}));

let renderer: ReactTestRenderer;
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
});
it.each<[string, AvatarCharacter]>([
  ['a preset', { preset: 'blue_beret' }],
  ['a preset with its paint changed', { preset: 'alfred', color: 'coral' }],
  ['a preset with a part changed', { preset: 'blue_beret', accessory: 'none' }],
  [
    'complete parts and an exact color',
    { shape: 'heart', eyes: 'oval', eyewear: 'none', accessory: 'bow', bodyColor: '#ffd838' },
  ],
  ['a hidden face', { preset: 'blue_beret', eyes: 'none' }],
])('uses one renderer for %s', (_name, character) => {
  act(() => {
    renderer = create(<AgentAvatar character={character} label="Ember" className="m-2" paused />);
  });
  expect(renderer.root.findAllByType(CharacterAvatar)).toHaveLength(1);
  const root = renderer.root.findByProps({ accessibilityRole: 'image' });
  expect(root.props.accessibilityLabel).toBe('Ember');
  expect(root.props.className).toBe('m-2');
});
it('throws at the component that was handed a character the renderer cannot draw', () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  expect(() => {
    act(() => {
      renderer = create(<AgentAvatar character={{ shape: 'heart' }} paused />);
    });
  }).toThrow('needs its eyes');
});
it('preserves localized names and explicit overrides', () => {
  act(() => {
    renderer = create(<AgentAvatar character={{ preset: 'blue_beret' }} paused locale="es" />);
  });
  expect(renderer.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel).toBe(
    'Avatar del agente',
  );
  act(() => {
    renderer.update(
      <AgentAvatar
        character={{ preset: 'blue_beret' }}
        paused
        locale="es"
        accessibilityLabel="Peri"
      />,
    );
  });
  expect(renderer.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel).toBe(
    'Peri',
  );
});
