import { render } from '@testing-library/react-native';
import { AgentAvatar } from '../../agent-avatar/AgentAvatar';
import { AvatarDrawingObserver } from '../../agent-avatar/context';
import { FOLD_CONFIG } from '../../agent-avatar/model';
import { Drawing } from '../../agent-avatar/SvgDrawing';

it('reports the exact committed drawing without resetting the avatar pose', () => {
  global.requestAnimationFrame = jest.fn(() => 1);
  global.cancelAnimationFrame = jest.fn();
  const observe = jest.fn();
  const view = render(
    <AvatarDrawingObserver.Provider value={observe}>
      <AgentAvatar config={{ ...FOLD_CONFIG, motion: 0 }} size={80} paused />
    </AvatarDrawingObserver.Provider>,
  );
  expect(observe).toHaveBeenCalled();
  const current = view.UNSAFE_getByType(Drawing).props.context;
  expect(observe.mock.calls[observe.mock.calls.length - 1]![0]).toBe(current);
  expect(current.nodes.length).toBeGreaterThan(0);
});
