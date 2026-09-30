import { fireEvent, render } from '@testing-library/react-native';
import { FOLD_CONFIG } from '../../agent-avatar/model';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AgentCreator } from '../AgentCreator';
import type { AgentCreatorAgent } from '../types';

const agent: AgentCreatorAgent = {
  id: 'design',
  name: 'Designer',
  label: 'Design',
  description: 'Helpful designer',
  avatar: { ...FOLD_CONFIG },
  preferences: {
    voice: 'local',
    speed: 1.25,
    language: 'en',
    notifications: false,
  },
};
function editor(onChange = jest.fn(), extra = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <AgentCreator agent={agent} onChange={onChange} {...extra} />
    </BloomThemeProvider>,
  );
}

describe('controlled agent creator', () => {
  beforeEach(() => {
    global.requestAnimationFrame = jest.fn(() => 1);
    global.cancelAnimationFrame = jest.fn();
  });
  it('edits each profile field while retaining the agent identity, avatar and preferences', () => {
    const onChange = jest.fn();
    const view = editor(onChange);
    fireEvent.changeText(view.getByLabelText('Agent name'), 'Architect');
    expect(onChange).toHaveBeenLastCalledWith({ ...agent, name: 'Architect' });
    fireEvent.changeText(view.getByLabelText('Agent label'), 'Architecture');
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      label: 'Architecture',
    });
    fireEvent.changeText(
      view.getByLabelText('Agent description'),
      'Builds better systems',
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      description: 'Builds better systems',
    });
  });
  it('preserves the other avatar controls when choosing a color or expression', () => {
    const onChange = jest.fn();
    const view = editor(onChange);
    fireEvent.press(view.getByLabelText('Blue avatar'));
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      avatar: {
        ...agent.avatar,
        hue: 220,
        saturation: 85,
        lightness: undefined,
        lightEyes: false,
        lookAt: 'wander',
      },
    });
    fireEvent.press(view.getByLabelText('Happy'));
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      avatar: { ...agent.avatar, eyes: 'happy', lookAt: 'wander' },
    });
  });
  it('edits notifications without discarding language, voice or speed', () => {
    const onChange = jest.fn();
    const view = editor(onChange);
    fireEvent.press(view.getByLabelText('Notify when this agent finishes'));
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      preferences: { ...agent.preferences, notifications: true },
    });
  });
  it('previews a host speech provider with saved voice preferences', () => {
    const onPreviewVoice = jest.fn();
    const view = editor(jest.fn(), {
      voices: [{ id: 'local', name: 'Local English', language: 'en-US' }],
      onPreviewVoice,
    });
    fireEvent.press(view.getByLabelText('Preview voice'));
    expect(onPreviewVoice).toHaveBeenCalledWith(
      'Hello! Ready when you are.',
      agent.preferences,
    );
  });
  it('closes the host panel without committing a change', () => {
    const onClose = jest.fn(),
      onChange = jest.fn();
    const view = editor(onChange, { onClose });
    fireEvent.press(view.getByLabelText('Close agent editor'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });
});
