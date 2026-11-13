import { normalizeAvatarSkinColor } from '../../agent-avatar/skin-color';
import { CHARACTER_COLORS } from '../../agent-avatar/character-colors';
import { APP_COLOR_PRESETS } from '../../theme/color-presets';
import { CustomColorPicker } from '../CustomColorPicker';
import { GlossArt } from '../GlossArt';
import { act, fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { CharacterAvatar } from '../../agent-avatar/CharacterAvatar';
import { AVATAR_EYES } from '../../agent-avatar/catalog-ids';
import { CharacterRuntimeFixture } from './support/character-runtime-fixture';
import { Select } from '../../select';
import { CHARACTER_OPTIONS, CHARACTER_TEMPLATES } from '../constants';
import { ShapeArc } from '../ShapeArc';
import { EmotionPicker } from '../EmotionPicker';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AgentCreator } from '../AgentCreator';
import { AgentCreatorField } from '../AgentCreatorField';
import { AgentCreatorSection } from '../AgentCreatorSection';
import { TextFieldInput } from '../../text-field';
import type { AgentCreatorAgent } from '../types';

jest.mock('../../agent-avatar/CharacterAvatar', () => ({
  CharacterAvatar: jest.fn(() => null),
}));

const agent: AgentCreatorAgent = {
  id: 'design',
  name: 'Designer',
  label: 'Design',
  description: 'Helpful designer',
  avatar: { preset: 'blue_beret' },
  color: 'teal',
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
  it('keeps the latest avatar when a memoized preferences panel changes a setting', () => {
    const onChange = jest.fn();
    const view = editor(onChange);
    const next = { ...agent, avatar: { ...agent.avatar, accessory: 'crown' as const } };
    view.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentCreator agent={next} onChange={onChange} />
      </BloomThemeProvider>,
    );
    fireEvent.press(view.getByLabelText('Notify when this agent finishes'));
    expect(onChange).toHaveBeenLastCalledWith({
      ...next,
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
  it('draws the host’s own rows in the details card, in the editor’s own row geometry', () => {
    const onUsername = jest.fn();
    const view = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentCreator agent={agent} onChange={jest.fn()}>
          <AgentCreatorField label="Username">
            <TextFieldInput
              label="Agent username"
              size="sm"
              value="designer"
              onChangeText={onUsername}
            />
          </AgentCreatorField>
        </AgentCreator>
      </BloomThemeProvider>,
    );
    expect(view.getByText('Username')).toBeTruthy();
    fireEvent.changeText(view.getByLabelText('Agent username'), 'architect');
    expect(onUsername).toHaveBeenCalledWith('architect');
    // The built-in rows are the same component: the host's row follows them, never replaces them.
    expect(view.getByLabelText('Agent name')).toBeTruthy();
    expect(view.getByLabelText('Agent description')).toBeTruthy();
  });
  it('draws the host’s own titled cards below the details card, with the editor’s rows in them', () => {
    const view = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentCreator
          agent={agent}
          onChange={jest.fn()}
          sections={
            <AgentCreatorSection title="Heartbeat">
              <AgentCreatorField label="Every" divider={false}>
                <TextFieldInput
                  label="Heartbeat interval"
                  size="sm"
                  value="60"
                  onChangeText={jest.fn()}
                />
              </AgentCreatorField>
            </AgentCreatorSection>
          }
        />
      </BloomThemeProvider>,
    );
    expect(view.getByText('Heartbeat')).toBeTruthy();
    expect(view.getByLabelText('Heartbeat interval')).toBeTruthy();
    expect(view.getByLabelText('Agent description')).toBeTruthy();
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
      <CharacterRuntimeFixture value={{}}>
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

  it('writes a named swatch as the account colour, outside the character history', () => {
    const { view, onChange } = controlled();
    fireEvent.press(view.getByLabelText('Blue avatar'));
    const blue = normalizeAvatarSkinColor(CHARACTER_COLORS.blue);
    expect(onChange).toHaveBeenLastCalledWith({ ...agent, color: blue });
    expect(view.getByLabelText('Blue avatar').props['aria-pressed']).toBe(true);
    expect(view.getByLabelText('Custom avatar color').props['aria-pressed']).toBe(false);
    // A colour is the account's, not a character edit: there is nothing to undo.
    expect(view.getByLabelText('Undo').props.accessibilityState?.disabled ?? true).toBe(true);
    expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe(blue);
  });

  it('writes any custom colour as the account colour, as the hex the avatar is drawn in', () => {
    const { view, onChange } = controlled();
    fireEvent.press(view.getByLabelText('Custom avatar color'));
    const picker = () => view.UNSAFE_getByType(CustomColorPicker);
    act(() => picker().props.onChange('#445566'));
    expect(onChange.mock.lastCall![0]).toEqual({
      ...agent,
      color: normalizeAvatarSkinColor('#445566'),
    });
    expect(view.getAllByLabelText('Custom avatar color')[0]!.props['aria-pressed']).toBe(true);
    expect(picker().props.value).toBe(normalizeAvatarSkinColor('#445566'));
    const calls = onChange.mock.calls.length;
    act(() => picker().props.onChange('not-a-color'));
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it('marks the named swatch whose hex the account colour is, and the custom one otherwise', () => {
    const named = controlled({ ...agent, color: '#4778FF' });
    expect(named.view.getByLabelText('Blue avatar').props['aria-pressed']).toBe(true);
    expect(named.view.getByLabelText('Custom avatar color').props['aria-pressed']).toBe(false);
    named.view.unmount();
    const preset = controlled({ ...agent, color: 'lagoon' });
    expect(preset.view.getByLabelText('Custom avatar color').props['aria-pressed']).toBe(true);
    expect(
      preset.view
        .UNSAFE_getAllByType(GlossArt)
        .some(
          (art) =>
            art.props.center === normalizeAvatarSkinColor(APP_COLOR_PRESETS.lagoon.hex) &&
            art.props.active,
        ),
    ).toBe(true);
  });

  it('draws a character in the agent colour, never its own paint, and hands it back paintless', () => {
    const { view, last } = controlled({
      ...agent,
      color: 'lagoon',
      avatar: { preset: 'blue_beret', bodyColor: '#123456' },
    });
    expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe(
      normalizeAvatarSkinColor(APP_COLOR_PRESETS.lagoon.hex),
    );
    fireEvent.press(view.getByLabelText('Dots'));
    expect(last()).not.toHaveProperty('bodyColor');
    expect(last()).not.toHaveProperty('color');
    expect(last()).toMatchObject({ eyes: 'dots' });
  });

  it('draws a paintless character whose colour does not resolve in the first named swatch', () => {
    const { view } = controlled({
      ...agent,
      color: 'not-a-preset',
      avatar: { shape: 'heart', eyes: 'oval', eyewear: 'none', accessory: 'none' },
    });
    expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe(
      normalizeAvatarSkinColor(CHARACTER_COLORS.pink),
    );
  });

  it('undoes a character edit back to the parts it started from, without paint', () => {
    const { view, last } = controlled({ ...agent, avatar: { preset: 'alfred', color: 'coral' } });
    fireEvent.press(view.getByLabelText('Dots'));
    fireEvent.press(view.getByLabelText('Undo'));
    expect(last()).toEqual({ preset: 'alfred' });
    fireEvent.press(view.getByLabelText('Redo'));
    expect(last()).toMatchObject({ eyes: 'dots' });
    expect(last()).not.toHaveProperty('color');
  });

  it('announces geometry preparation without delaying the selected eye control', () => {
    const { view } = controlled();
    const preview = () =>
      view
        .UNSAFE_getAllByType(CharacterAvatar)
        .find((node) => typeof node.props.onLoadingChange === 'function')!;
    act(() => preview().props.onLoadingChange(true));
    expect(view.getByText('Preparing avatar…')).toBeTruthy();
    expect(view.getByTestId('agent-avatar-preparation').props['aria-busy']).toBe(true);
    fireEvent.press(view.getByLabelText('Dots'));
    expect(view.UNSAFE_getByType(EmotionPicker).props.value).toBe('dots');
    act(() => preview().props.onLoadingChange(false));
    expect(view.queryByText('Preparing avatar…')).toBeNull();
    expect(view.getByTestId('agent-avatar-preparation').props['aria-busy']).toBe(false);
  });

  it('reuses character choices for profile edits while refreshing translated labels', () => {
    const view = editor();
    const shapes = view.UNSAFE_getByType(ShapeArc).props.choices;
    const eyes = view.UNSAFE_getByType(EmotionPicker).props.choices;
    view.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentCreator agent={{ ...agent, name: 'Updated' }} onChange={jest.fn()} />
      </BloomThemeProvider>,
    );
    expect(view.UNSAFE_getByType(ShapeArc).props.choices).toBe(shapes);
    expect(view.UNSAFE_getByType(EmotionPicker).props.choices).toBe(eyes);
    view.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <AgentCreator
          agent={agent}
          onChange={jest.fn()}
          labels={{ characterOption: (_category, id) => `Translated ${id}` }}
        />
      </BloomThemeProvider>,
    );
    expect(view.UNSAFE_getByType(EmotionPicker).props.choices[0].label).toMatch(/^Translated /);
    expect(view.UNSAFE_getByType(EmotionPicker).props.choices).not.toBe(eyes);
  });

  it('keeps every SVG character control available without a WebGL runtime', () => {
    // The SVG preview and thumbnails are independent of the hosted WebGL module.
    const view = render(
      <CharacterRuntimeFixture value={{}}>
        <BloomThemeProvider mode="light" colorPreset="teal">
          <AgentCreator agent={agent} onChange={jest.fn()} />
        </BloomThemeProvider>
      </CharacterRuntimeFixture>,
    );
    expect(view.getByTestId('agent-creator-character-controls')).toBeTruthy();
    expect(view.getByLabelText('Blue avatar')).toBeTruthy();
    expect(view.UNSAFE_getByType(ShapeArc)).toBeTruthy();
    expect(view.UNSAFE_getByType(EmotionPicker)).toBeTruthy();
    for (const avatar of view.UNSAFE_getAllByType(CharacterAvatar)) {
      expect(avatar.props.renderer).toBe('svg');
    }
  });

  it('offers distinct editor silhouettes and every eye style, as characters', () => {
    const { view } = controlled();
    const shapes = view.UNSAFE_getByType(ShapeArc).props.choices;
    expect(shapes.map((choice: { id: string }) => choice.id)).toEqual(
      CHARACTER_OPTIONS.shape.map(([id]) => id),
    );
    expect(new Set(shapes.map((choice: { id: string }) => choice.id)).size).toBe(
      CHARACTER_OPTIONS.shape.length,
    );
    expect(shapes[0].character).toMatchObject({ preset: 'blue_beret', shape: shapes[0].id });
    expect(view.UNSAFE_getByType(EmotionPicker).props.choices).toHaveLength(
      CHARACTER_OPTIONS.eyes.length,
    );
    expect(view.UNSAFE_getByType(ShapeArc).props.value).toBe('six_lobed_flower');
    expect(view.UNSAFE_getByType(EmotionPicker).props.value).toBe('oval');
  });

  it('selects the shared silhouette for a saved legacy shape without rewriting it', () => {
    const saved = { ...agent, avatar: { preset: 'purple_heart' as const } };
    const { view } = controlled(saved);
    const arc = view.UNSAFE_getByType(ShapeArc).props;
    expect(arc.value).toBe('bot_heart');
    expect(arc.choices.some((choice: { id: string }) => choice.id === 'heart')).toBe(false);
    expect(saved.avatar).toEqual({ preset: 'purple_heart' });
  });

  it('writes the whole character when a body is chosen, keeping the face and the hat', () => {
    const { view, last } = controlled();
    act(() => view.UNSAFE_getByType(ShapeArc).props.onSelect('bot_heart'));
    expect(last()).toEqual({
      preset: 'blue_beret',
      shape: 'bot_heart',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'felipe_beret',
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
    });
    expect(view.getByLabelText('Dots').props['aria-pressed']).toBe(true);
  });

  it('edits eyewear and accessory through the selects', () => {
    const { view, last } = controlled();
    const controls = () => view.UNSAFE_getAllByType(Select);
    // Eyewear and accessory lead the controls: a character is built from its parts, with no preset to pick.
    expect(controls().map((select) => select.props.value)).not.toContain('blue_beret');
    expect(controls()[0]!.props.value).toBe('none');
    expect(controls()[1]!.props.value).toBe('felipe_beret');
    fireEvent(controls()[1]!, 'valueChange', 'crown');
    expect(last()).toMatchObject({ accessory: 'crown', shape: 'six_lobed_flower' });
    fireEvent(controls()[0]!, 'valueChange', 'monocle');
    expect(last()).toMatchObject({ eyewear: 'monocle', accessory: 'crown' });
    expect(controls()[0]!.props.value).toBe('monocle');
    fireEvent(controls()[1]!, 'valueChange', 'none');
    expect(last()).toMatchObject({ accessory: 'none' });
  });

  it('accepts rapid body, eye, glasses, hat and colour edits without losing any of them', () => {
    const { view, onChange, last } = controlled();
    const controls = () => view.UNSAFE_getAllByType(Select);
    act(() => view.UNSAFE_getByType(ShapeArc).props.onSelect('cloud'));
    fireEvent.press(view.getByLabelText('Dots'));
    fireEvent(controls()[0]!, 'valueChange', 'round_sunglasses');
    fireEvent(controls()[1]!, 'valueChange', 'crown');
    fireEvent.press(view.getByLabelText('Coral avatar'));
    expect(last()).toEqual({
      preset: 'blue_beret',
      shape: 'cloud',
      eyes: 'dots',
      eyewear: 'round_sunglasses',
      accessory: 'crown',
    });
    expect(onChange.mock.lastCall![0].color).toBe(normalizeAvatarSkinColor(CHARACTER_COLORS.coral));
  });

  it('offers every eye but the single one the catalogue draws separately', () => {
    expect(CHARACTER_OPTIONS.eyes.map((option) => option[0]).sort()).toEqual(
      AVATAR_EYES.filter((id) => id !== 'cyclops').sort(),
    );
  });
});
