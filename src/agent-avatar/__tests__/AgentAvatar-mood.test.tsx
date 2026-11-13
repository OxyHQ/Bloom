import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Path } from 'react-native-svg';
import { AgentAvatar } from '../AgentAvatar';
import type { AgentAvatarMood } from '../types';

jest.mock('../../styles/styled-primitives', () => ({
  StyledView: require('react-native').View,
  StyledText: require('react-native').Text,
}));
// Reduced motion: the avatar draws one still frame per change, so the frame is the settled pose.
jest.mock('../../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => true,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let renderer: ReactTestRenderer;
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
});

const view = (mood?: AgentAvatarMood) => (
  <AgentAvatar character={{ preset: 'blue_beret' }} size={112} mood={mood} />
);
const drawing = () => renderer.root.findAllByType(Path).map((path) => path.props.d as string);
async function mount(mood?: AgentAvatarMood) {
  await act(async () => {
    renderer = create(view(mood));
  });
  for (let i = 0; i < 20 && drawing().length === 0; i++)
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
  expect(drawing().length).toBeGreaterThan(0);
  return drawing();
}

it('with reduced motion, shows the settled sad pose and goes back to neutral, all without a shake', async () => {
  const neutral = await mount();
  act(() => renderer.unmount());
  const sad = await mount('sad');
  expect(sad).not.toEqual(neutral);
  // The same still, however long it has been shown: no shake is in progress.
  await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
  expect(drawing()).toEqual(sad);
  act(() => renderer.update(view('neutral')));
  expect(drawing()).toEqual(neutral);
  act(() => renderer.update(view('sad')));
  expect(drawing()).toEqual(sad);
});
