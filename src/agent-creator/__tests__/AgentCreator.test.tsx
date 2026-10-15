import { act, fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { CharacterRuntimeFixture } from './support/character-runtime-fixture';
import { Select } from '../../select';
import { CHARACTER_OPTIONS, CHARACTER_TEMPLATES } from '../constants';
import { ShapeArc } from '../ShapeArc';
import { CustomColorPicker } from '../CustomColorPicker';
import { GlossArt } from '../GlossArt';
import { EmotionPicker } from '../EmotionPicker';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AgentCreator } from '../AgentCreator';
import type { AgentCreatorAgent } from '../types';

const agent: AgentCreatorAgent = {
  id: 'design',
  name: 'Designer',
  label: 'Design',
  description: 'Helpful designer',
  avatar: { preset: 'blue_beret' },
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
    fireEvent.changeText(view.getByLabelText('Agent description'), 'Builds better systems');
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      description: 'Builds better systems',
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
  it('draws the speech preferences by default, and not with showPreferences={false}', () => {
    const shown = editor();
    expect(shown.queryByLabelText('Notify when this agent finishes')).toBeTruthy();
    shown.unmount();

    const onChange = jest.fn();
    const hidden = editor(onChange, { showPreferences: false });
    expect(hidden.queryByLabelText('Notify when this agent finishes')).toBeNull();
    // The profile and the look are still the editor, and the preferences are left as they were.
    fireEvent.changeText(hidden.getByLabelText('Agent name'), 'Architect');
    expect(onChange).toHaveBeenLastCalledWith({ ...agent, name: 'Architect' });
  });
  it('previews a host speech provider with saved voice preferences', () => {
    const onPreviewVoice = jest.fn();
    const view = editor(jest.fn(), {
      voices: [{ id: 'local', name: 'Local English', language: 'en-US' }],
      onPreviewVoice,
    });
    fireEvent.press(view.getByLabelText('Preview voice'));
    expect(onPreviewVoice).toHaveBeenCalledWith('Hello! Ready when you are.', agent.preferences);
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

/** The editor with its runtime present, edits applied the way a host would apply them. */
function controlled(initial: AgentCreatorAgent = agent) {
  const onChange = jest.fn();
  function Host() {
    const [current, setCurrent] = useState(initial);
    return (
      <CharacterRuntimeFixture value={{ runtimeUrl: '/runtime.mjs' }}>
        <BloomThemeProvider>
          <AgentCreator
            agent={current}
            onChange={(next) => {
              onChange(next);
              setCurrent(next);
            }}
          />
        </BloomThemeProvider>
      </CharacterRuntimeFixture>
    );
  }
  const view = render(<Host />);
  const last = () => (onChange.mock.lastCall![0] as AgentCreatorAgent).avatar;
  return { view, onChange, last };
}

describe('the character editor', () => {
  beforeEach(() => {
    global.requestAnimationFrame = jest.fn(() => 1);
    global.cancelAnimationFrame = jest.fn();
  });

  it('offers no character controls without a runtime to draw them', () => {
    // An app that opts out of the hosted default (BLOOM_CHARACTER_RUNTIME_URL) has no runtime.
    const view = render(
      <CharacterRuntimeFixture value={{ runtimeUrl: undefined }}>
        <BloomThemeProvider mode="light" colorPreset="teal">
          <AgentCreator agent={agent} onChange={jest.fn()} />
        </BloomThemeProvider>
      </CharacterRuntimeFixture>,
    );
    expect(view.queryByTestId('agent-creator-character-controls')).toBeNull();
    expect(view.queryByLabelText('Blue avatar')).toBeNull();
    expect(view.UNSAFE_queryByType(ShapeArc)).toBeNull();
    expect(view.UNSAFE_queryByType(EmotionPicker)).toBeNull();
  });

  it('offers every body and every eye style, as characters', () => {
    const { view } = controlled();
    const shapes = view.UNSAFE_getByType(ShapeArc).props.choices;
    expect(shapes.map((choice: { id: string }) => choice.id)).toHaveLength(21);
    expect(new Set(shapes.map((choice: { id: string }) => choice.id)).size).toBe(21);
    expect(shapes[0].character).toMatchObject({ preset: 'blue_beret', shape: shapes[0].id });
    expect(view.UNSAFE_getByType(EmotionPicker).props.choices).toHaveLength(12);
    expect(view.UNSAFE_getByType(ShapeArc).props.value).toBe('six_lobed_flower');
    expect(view.UNSAFE_getByType(EmotionPicker).props.value).toBe('oval');
  });

  it('writes the whole character when a body is chosen, keeping the face, the hat and the paint', () => {
    const { view, last } = controlled();
    act(() => view.UNSAFE_getByType(ShapeArc).props.onSelect('heart'));
    expect(last()).toEqual({
      preset: 'blue_beret',
      shape: 'heart',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'felipe_beret',
      color: 'blue',
    });
  });

  it('keeps the body and the rest when an eye style is chosen', () => {
    const { view, last } = controlled({ ...agent, avatar: { preset: 'alfred', color: 'coral' } });
    fireEvent.press(view.getByLabelText('Dots'));
    expect(last()).toEqual({
      preset: 'alfred',
      shape: 'rounded_triangle',
      eyes: 'dots',
      eyewear: 'tall_oval_frames',
      accessory: 'bow',
      color: 'coral',
    });
    expect(view.getByLabelText('Dots').props['aria-pressed']).toBe(true);
  });

  it('names one paint at a time: a named color replaces an exact one and back', () => {
    const { view, last } = controlled({
      ...agent,
      avatar: { preset: 'blue_beret', bodyColor: '#123456' },
    });
    expect(view.getByLabelText('Blue avatar').props['aria-pressed']).toBe(false);
    expect(view.getByLabelText('Custom avatar color').props['aria-pressed']).toBe(true);
    expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe('#123456');
    expect(
      view
        .UNSAFE_getAllByType(GlossArt)
        .some((art) => art.props.center === '#123456' && art.props.active),
    ).toBe(true);
    fireEvent.press(view.getByLabelText('Custom avatar color'));
    const picker = view.UNSAFE_getByType(CustomColorPicker);
    expect(picker.props.value).toBe('#123456');
    fireEvent(picker, 'change', '#Ab1234');
    expect(last()).toMatchObject({ bodyColor: '#ab1234' });
    expect(last()).not.toHaveProperty('color');
    fireEvent.press(view.getByLabelText('Blue avatar'));
    expect(last()).toMatchObject({ color: 'blue' });
    expect(last()).not.toHaveProperty('bodyColor');
    expect(view.getByLabelText('Blue avatar').props['aria-pressed']).toBe(true);
  });

  it('edits eyewear and accessory through the selects, and rejects a malformed exact color', () => {
    const { view, onChange, last } = controlled();
    const controls = () => view.UNSAFE_getAllByType(Select);
    expect(controls()[1]!.props.value).toBe('none');
    expect(controls()[2]!.props.value).toBe('felipe_beret');
    fireEvent(controls()[2]!, 'valueChange', 'crown');
    expect(last()).toMatchObject({ accessory: 'crown', shape: 'six_lobed_flower' });
    fireEvent(controls()[1]!, 'valueChange', 'monocle');
    expect(last()).toMatchObject({ eyewear: 'monocle', accessory: 'crown' });
    expect(controls()[1]!.props.value).toBe('monocle');
    fireEvent(controls()[2]!, 'valueChange', 'none');
    expect(last()).toMatchObject({ accessory: 'none' });
    fireEvent.press(view.getByLabelText('Custom avatar color'));
    const calls = onChange.mock.calls.length;
    fireEvent(view.UNSAFE_getByType(CustomColorPicker), 'change', 'not-a-color');
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it('accepts rapid body, eye, glasses, hat and palette edits without losing any of them', () => {
    const { view, last } = controlled();
    const controls = () => view.UNSAFE_getAllByType(Select);
    act(() => view.UNSAFE_getByType(ShapeArc).props.onSelect('cloud'));
    fireEvent.press(view.getByLabelText('Dots'));
    fireEvent(controls()[1]!, 'valueChange', 'round_sunglasses');
    fireEvent(controls()[2]!, 'valueChange', 'crown');
    fireEvent.press(view.getByLabelText('Coral avatar'));
    expect(last()).toEqual({
      preset: 'blue_beret',
      shape: 'cloud',
      eyes: 'dots',
      eyewear: 'round_sunglasses',
      accessory: 'crown',
      color: 'coral',
    });
  });

  it('starts from a template, shows Custom after an edit, and recognises the template again', () => {
    const { view, last } = controlled({ ...agent, avatar: CHARACTER_TEMPLATES.blue_beret! });
    const controls = () => view.UNSAFE_getAllByType(Select);
    expect(controls()[0]!.props.value).toBe('blue_beret');
    act(() => view.UNSAFE_getByType(ShapeArc).props.onSelect('heart'));
    expect(controls()[0]!.props.value).toBe('custom');
    act(() => view.UNSAFE_getByType(ShapeArc).props.onSelect('six_lobed_flower'));
    expect(controls()[0]!.props.value).toBe('blue_beret');
    fireEvent(controls()[0]!, 'valueChange', 'alfred');
    expect(last()).toEqual(CHARACTER_TEMPLATES.alfred);
    expect(CHARACTER_OPTIONS.eyes.length).toBe(12);
  });

  it('replays working on the preview without editing the saved character', () => {
    const { view, onChange } = controlled();
    fireEvent.press(view.getByText('Work'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
