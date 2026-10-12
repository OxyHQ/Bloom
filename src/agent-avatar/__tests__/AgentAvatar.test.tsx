import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatar } from '../AgentAvatar';
import { CharacterAvatar } from '../CharacterAvatar';
import { DEFAULT_CONFIG, FOLD_CONFIG, ALIEN_CONFIG, MASCOT_CONFIG } from '../model';
jest.mock('../../styles/styled-primitives', () => ({
  StyledView: require('react-native').View,
  StyledText: require('react-native').Text,
}));

let renderer: ReactTestRenderer;
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
});
it.each([
  DEFAULT_CONFIG,
  FOLD_CONFIG,
  ALIEN_CONFIG,
  MASCOT_CONFIG,
  { ...DEFAULT_CONFIG, face: false },
])('uses one renderer for saved family $family face=$face', (config) => {
  act(() => {
    renderer = create(<AgentAvatar config={config} label="Ember" className="m-2" paused />);
  });
  expect(renderer.root.findAllByType(CharacterAvatar)).toHaveLength(1);
  const root = renderer.root.findByProps({ accessibilityRole: 'image' });
  expect(root.props.accessibilityLabel).toBe('Ember');
  expect(root.props.className).toBe('m-2');
});
it('preserves localized names and explicit overrides', () => {
  act(() => {
    renderer = create(<AgentAvatar config={DEFAULT_CONFIG} paused locale="es" />);
  });
  expect(renderer.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel).toBe(
    'Avatar del agente',
  );
  act(() => {
    renderer.update(
      <AgentAvatar config={DEFAULT_CONFIG} paused locale="es" accessibilityLabel="Peri" />,
    );
  });
  expect(renderer.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel).toBe(
    'Peri',
  );
});
